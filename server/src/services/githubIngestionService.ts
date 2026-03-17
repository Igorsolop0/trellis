import { Octokit } from '@octokit/rest';
import { TestFile } from './ingestionService';
import { TestLayer } from '../types';

const TEST_PATTERNS: { regex: RegExp; layer: TestLayer }[] = [
    { regex: /e2e\/.*\.spec\.(ts|js)$/, layer: 'e2e' },
    { regex: /\.e2e\.(ts|js|tsx|jsx)$/, layer: 'e2e' },
    { regex: /tests\/api.*\.spec\.(ts|js)$/, layer: 'api' },
    { regex: /\.api\.(spec|test)\.(ts|js)$/, layer: 'api' },
    { regex: /\.integration\.(spec|test)\.(ts|js)$/, layer: 'api' },
    { regex: /\.spec\.(ts|js)$/, layer: 'api' },
    { regex: /\.test\.(ts|js|tsx|jsx)$/, layer: 'unit' },
];

const IGNORE_PATTERNS = [
    /node_modules\//,
    /dist\//,
    /build\//,
    /\.next\//,
    /coverage\//,
    /\.git\//,
];

export class GitHubIngestionService {
    private octokit: Octokit;
    private owner: string;
    private repo: string;

    constructor(repoFullName: string, token?: string) {
        const [owner, repo] = repoFullName.split('/');
        if (!owner || !repo) throw new Error(`Invalid repo format: "${repoFullName}". Use owner/repo.`);
        this.owner = owner;
        this.repo = repo;
        this.octokit = new Octokit({ auth: token || process.env.GITHUB_TOKEN });
    }

    async scanRepository(): Promise<TestFile[]> {
        console.log(`[GitHub] Fetching file tree for ${this.owner}/${this.repo}...`);

        // Get default branch
        const { data: repoData } = await this.octokit.rest.repos.get({
            owner: this.owner,
            repo: this.repo,
        });
        const defaultBranch = repoData.default_branch;

        // Get full file tree in one API call
        const { data: treeData } = await this.octokit.rest.git.getTree({
            owner: this.owner,
            repo: this.repo,
            tree_sha: defaultBranch,
            recursive: 'true',
        });

        // Filter for test files
        const testPaths: { path: string; layer: TestLayer }[] = [];
        for (const item of treeData.tree) {
            if (item.type !== 'blob' || !item.path) continue;
            if (IGNORE_PATTERNS.some(p => p.test(item.path!))) continue;

            const layer = this.classifyTestFile(item.path);
            if (layer) {
                testPaths.push({ path: item.path, layer });
            }
        }

        console.log(`[GitHub] Found ${testPaths.length} test files out of ${treeData.tree.length} total files`);

        // Fetch content for each test file (with concurrency limit)
        const files: TestFile[] = [];
        const batchSize = 10;

        for (let i = 0; i < testPaths.length; i += batchSize) {
            const batch = testPaths.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async ({ path, layer }) => {
                    try {
                        const content = await this.fetchFileContent(path);
                        return { path, content, type: layer } as TestFile;
                    } catch (error) {
                        console.warn(`[GitHub] Failed to fetch ${path}:`, error);
                        return null;
                    }
                })
            );
            files.push(...results.filter((f): f is TestFile => f !== null));
        }

        console.log(`[GitHub] Successfully fetched ${files.length} test files`);
        return files;
    }

    private classifyTestFile(filePath: string): TestLayer | null {
        for (const { regex, layer } of TEST_PATTERNS) {
            if (regex.test(filePath)) return layer;
        }
        return null;
    }

    private async fetchFileContent(filePath: string): Promise<string> {
        const { data } = await this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: filePath,
        });

        if ('content' in data && data.encoding === 'base64') {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }

        throw new Error(`Unexpected response for ${filePath}`);
    }
}
