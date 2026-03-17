import fs from 'fs-extra';
import { TestLayer } from '../types';

export interface ParsedTest {
    name: string;
    filePath: string;
    suggestedLayer: TestLayer;
    codeSnippet?: string;
}

export class TestParserService {
    async parseFile(filePath: string, originalFilename: string): Promise<ParsedTest[]> {
        const content = await fs.readFile(filePath, 'utf-8');
        const tests: ParsedTest[] = [];

        const testRegex = /(?:test|it)\s*\(\s*(['"`])(.+?)\1/g;

        let match;
        while ((match = testRegex.exec(content)) !== null) {
            tests.push({
                name: match[2],
                filePath: originalFilename,
                suggestedLayer: this.determineLayer(originalFilename, content),
            });
        }

        return tests;
    }

    private determineLayer(filename: string, content: string): TestLayer {
        const lowerName = filename.toLowerCase();

        if (lowerName.includes('.spec.') || lowerName.includes('e2e') || content.includes('page.goto')) {
            return 'e2e';
        }
        if (lowerName.includes('api') || lowerName.includes('integration') || content.includes('supertest') || content.includes('request(')) {
            return 'api';
        }
        return 'unit';
    }
}
