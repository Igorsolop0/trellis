import * as ts from 'typescript';

export interface ParsedTest {
    describeBlocks: string[];
    testName: string;
    body: string;
    filePath: string;
}

export interface EnrichedTestMeta {
    describeBlocks: string[];
    testName: string;
    body: string;
    filePath: string;
    // Enriched fields
    assertions: string[];
    endpoints: string[];
    selectors: string[];
    actionVerbs: string[];
    pageObjects: string[];
    framework: string | null;
}

// ─── Extraction Patterns ───

const ASSERTION_PATTERNS = [
    /expect\(([^)]+)\)\.([\w.]+)\(/g,
    /assert\.([\w]+)\(/g,
    /\.should\(([^)]+)\)/g,
    /\.to\.([\w.]+)/g,
];

const ENDPOINT_PATTERNS = [
    /['"`](\/[\w/\-:]+)['"`]/g,
    /\.(get|post|put|patch|delete)\s*\(\s*['"`](\/[^'"`]+)['"`]/g,
    /request\([^)]*\)\.(get|post|put|patch|delete)\s*\(\s*['"`](\/[^'"`]+)['"`]/g,
    /page\.goto\s*\(\s*['"`]([^'"`]+)['"`]/g,
];

const SELECTOR_PATTERNS = [
    /getByRole\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /getByText\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /getByTestId\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /getByLabel\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /getByPlaceholder\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /querySelector\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /locator\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\$\(\s*['"`]([^'"`]+)['"`]/g,
    /cy\.(get|find)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /data-testid=['"`]([^'"`]+)['"`]/g,
];

const ACTION_VERBS = [
    'click', 'type', 'fill', 'press', 'check', 'uncheck', 'select',
    'hover', 'focus', 'blur', 'clear', 'submit', 'navigate', 'goto',
    'scroll', 'drag', 'drop', 'upload', 'download', 'wait',
];

const FRAMEWORK_SIGNALS: Record<string, string[]> = {
    playwright: ['@playwright/test', 'page.goto', 'page.click', 'page.fill', 'page.locator', 'expect(page'],
    cypress: ['cy.', 'cy.visit', 'cy.get', 'cy.intercept', 'Cypress'],
    jest: ['@jest', 'jest.fn', 'jest.mock', 'jest.spyOn', 'describe(', 'it('],
    vitest: ['vitest', 'vi.fn', 'vi.mock', 'vi.spyOn', 'import { describe'],
    supertest: ['supertest', 'request(app)', 'request(server)', '.send(', '.expect('],
};

function extractMatches(text: string, patterns: RegExp[]): string[] {
    const results = new Set<string>();
    for (const pattern of patterns) {
        const re = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = re.exec(text)) !== null) {
            // Take the last captured group that has a value
            for (let i = match.length - 1; i >= 1; i--) {
                if (match[i]) {
                    results.add(match[i]);
                    break;
                }
            }
        }
    }
    return [...results];
}

function extractActionVerbs(body: string): string[] {
    const lower = body.toLowerCase();
    return ACTION_VERBS.filter(verb => lower.includes(verb));
}

function extractPageObjects(body: string): string[] {
    const results = new Set<string>();
    // Common patterns: loginPage.fill, homePage.navigate, etc.
    const poPattern = /(\w+Page|\w+Component|\w+Modal|\w+Dialog)\.\w+/g;
    let match;
    while ((match = poPattern.exec(body)) !== null) {
        results.add(match[1]);
    }
    return [...results];
}

function detectFramework(fullSource: string): string | null {
    for (const [fw, signals] of Object.entries(FRAMEWORK_SIGNALS)) {
        const matchCount = signals.filter(s => fullSource.includes(s)).length;
        if (matchCount >= 2) return fw;
    }
    // Single signal fallback
    for (const [fw, signals] of Object.entries(FRAMEWORK_SIGNALS)) {
        if (signals.some(s => fullSource.includes(s))) return fw;
    }
    return null;
}

// ─── Core Parser ───

export function parseTestsFromCode(sourceCode: string, filePath: string): ParsedTest[] {
    const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);
    const tests: ParsedTest[] = [];

    function walk(node: ts.Node, currentDescribes: string[]) {
        if (ts.isCallExpression(node)) {
            const exp = node.expression;
            if (ts.isIdentifier(exp)) {
                const name = exp.text;
                if (name === 'describe' && node.arguments.length > 0) {
                    const arg0 = node.arguments[0];
                    if (ts.isStringLiteral(arg0) || ts.isNoSubstitutionTemplateLiteral(arg0)) {
                        ts.forEachChild(node, child => walk(child, [...currentDescribes, arg0.text]));
                        return;
                    }
                }
                if ((name === 'it' || name === 'test') && node.arguments.length > 1) {
                    const arg0 = node.arguments[0];
                    if (ts.isStringLiteral(arg0) || ts.isNoSubstitutionTemplateLiteral(arg0)) {
                        const body = sourceCode.substring(node.arguments[1].pos, node.arguments[1].end).trim();
                        tests.push({ describeBlocks: currentDescribes, testName: arg0.text, body, filePath });
                    }
                }
            } else if (ts.isPropertyAccessExpression(exp) && ts.isIdentifier(exp.name)) {
                const name = exp.name.text;
                if (name === 'describe' && node.arguments.length > 0) {
                    const arg0 = node.arguments[0];
                    if (ts.isStringLiteral(arg0) || ts.isNoSubstitutionTemplateLiteral(arg0)) {
                        ts.forEachChild(node, child => walk(child, [...currentDescribes, arg0.text]));
                        return;
                    }
                }
                if ((name === 'it' || name === 'test') && node.arguments.length > 1) {
                    const arg0 = node.arguments[0];
                    if (ts.isStringLiteral(arg0) || ts.isNoSubstitutionTemplateLiteral(arg0)) {
                        const body = sourceCode.substring(node.arguments[1].pos, node.arguments[1].end).trim();
                        tests.push({ describeBlocks: currentDescribes, testName: arg0.text, body, filePath });
                    }
                }
            }
        }
        ts.forEachChild(node, child => walk(child, currentDescribes));
    }

    walk(sourceFile, []);
    return tests;
}

// ─── Enriched Parser ───

export function enrichTestMeta(parsed: ParsedTest, fullFileSource: string): EnrichedTestMeta {
    return {
        ...parsed,
        assertions: extractMatches(parsed.body, ASSERTION_PATTERNS),
        endpoints: extractMatches(parsed.body, ENDPOINT_PATTERNS),
        selectors: extractMatches(parsed.body, SELECTOR_PATTERNS),
        actionVerbs: extractActionVerbs(parsed.body),
        pageObjects: extractPageObjects(parsed.body),
        framework: detectFramework(fullFileSource),
    };
}

export function parseAndEnrichTests(sourceCode: string, filePath: string): EnrichedTestMeta[] {
    const tests = parseTestsFromCode(sourceCode, filePath);
    return tests.map(t => enrichTestMeta(t, sourceCode));
}
