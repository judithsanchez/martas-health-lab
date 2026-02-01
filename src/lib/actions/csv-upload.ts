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

    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

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
