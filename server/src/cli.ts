#!/usr/bin/env node

import { glob } from 'glob';
import fs from 'fs-extra';
import FormData from 'form-data';
import axios from 'axios';
import path from 'path';

async function uploadFile(filePath: string, serverUrl: string) {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        console.log(`Uploading ${filePath}...`);

        const response = await axios.post(`${serverUrl}/api/upload`, formData, {
            headers: formData.getHeaders()
        });

        console.log(`✅ Success for ${filePath}: Assigned to Feature "${response.data.assignedFeature}"`);
    } catch (error: any) {
        console.error(`❌ Failed to upload ${filePath}:`, error.response?.data || error.message);
    }
}

async function run() {
    const args = process.argv.slice(2);
    const serverUrl = args.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:4000';
    const ignoreDirs = ['node_modules/**', 'dist/**', 'build/**'];

    console.log(`🔍 Scanning for test files to upload to ${serverUrl}`);

    // Find all test files
    const files = await glob('**/*.{test,spec}.{ts,js}', {
        ignore: ignoreDirs,
        nodir: true
    });

    console.log(`Found ${files.length} test files. Starting upload...`);

    for (const file of files) {
        await uploadFile(path.resolve(file), serverUrl);
    }

    console.log('🎉 Upload complete!');
}

run().catch(console.error);
