"use server";

import fs from "fs";
import path from "path";
import * as Papa from "papaparse";
import { TanitaParser } from "../tanita-parser";

export type CsvRecord = Record<string, any>;

export async function uploadCsv(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) {
        throw new Error("No file uploaded");
    }

    // 1. Audit Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[Upload] Starting upload for file: ${file.name}, size: ${bytes.byteLength} bytes`);

    // Use the mounted data volume which we know is writable
    const uploadsDir = path.join(process.cwd(), "data", "uploads");
    const fileName = `${Date.now()}-${file.name}`;

    try {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);
        console.log(`[Upload] Audit file saved to: ${filePath}`);
    } catch (saveError) {
        // Critical: Don't block the actual parsing if audit storage fails (common in RO filesystems)
        console.error("[Upload] Failed to save audit file, proceeding with parsing anyway:", saveError);
    }

    // 2. CSV Parsing
    const csvContent = buffer.toString();
    const parsed = Papa.parse<string[]>(csvContent, {
        header: false, // Tanita uses Tag-Value pairs in a single row
        skipEmptyLines: true,
    });

    // 3. Transform & Validate
    const data: CsvRecord[] = parsed.data
        .map(row => TanitaParser.parseRawRow(row))
        .filter(record => record.date && record.weight !== undefined);

    // Basic validation: Check if we got at least some data
    if (data.length === 0) {
        throw new Error("No data found in CSV");
    }

    // Check if first row has valid date/weight (essential fields)
    if (!data[0].date || !data[0].weight) {
        // It might be that the parser failed or format is wrong
        // But let's allow it to pass for now, the UI will just show empties if logic fails
        console.warn("Parsed data might be missing core fields", data[0]);
    }

    return {
        fileName,
        data: data,
    };
}
