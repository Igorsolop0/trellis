import { glob } from 'glob';
import fs from 'fs-extra';
import path from 'path';
import { TestLayer } from '../types';
import { FileParserService, ParsedTestFile } from './fileParserService';

export interface TestFile {
    path: string;
    content: string;
    type: TestLayer;
}

export class IngestionService {
    private repoPath: string;

    constructor(repoPath: string) {
        this.repoPath = repoPath;
    }

    async scanRepository(): Promise<TestFile[]> {
        const files: TestFile[] = [];

        const patterns = {
            unit: '**/*.test.{ts,js,tsx,jsx}',
            api: '**/tests/**/*.spec.{ts,js}',
            e2e: '**/e2e/**/*.spec.{ts,js}'
        };

        const commonIgnores = [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/server/dummy_repo/**'
        ];

        const unitFiles = await glob(patterns.unit, {
            cwd: this.repoPath,
            ignore: [...commonIgnores, '**/e2e/**']
        });
        for (const file of unitFiles) {
            files.push(await this.readFile(file, 'unit'));
        }

        const apiFiles = await glob(patterns.api, { cwd: this.repoPath, ignore: commonIgnores });
        for (const file of apiFiles) {
            files.push(await this.readFile(file, 'api'));
        }

        const e2eFiles = await glob(patterns.e2e, { cwd: this.repoPath, ignore: commonIgnores });
        for (const file of e2eFiles) {
            files.push(await this.readFile(file, 'e2e'));
        }

        return files;
    }

    private async readFile(relativePath: string, type: TestLayer): Promise<TestFile> {
        const fullPath = path.join(this.repoPath, relativePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        return { path: relativePath, content, type };
    }

    parseTestsFromFile(file: TestFile): ParsedTestFile[] {
        return FileParserService.parseTestsFromContent(file.content, file.path);
    }
}
