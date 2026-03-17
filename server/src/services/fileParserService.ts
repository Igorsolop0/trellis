import { parseTestsFromCode } from './astParserService';

export interface ParsedTestFile {
    name: string;
    filepath: string;
    body: string;
}

export class FileParserService {
    static parseTestsFromContent(content: string, filePath: string = 'uploaded-file.ts'): ParsedTestFile[] {
        const parsedData = parseTestsFromCode(content, filePath);

        return parsedData.map(astTest => {
            const fullName = astTest.describeBlocks.length > 0
                ? `${astTest.describeBlocks.join(' > ')} > ${astTest.testName}`
                : astTest.testName;

            return {
                name: fullName,
                filepath: filePath,
                body: astTest.body,
            };
        });
    }
}
