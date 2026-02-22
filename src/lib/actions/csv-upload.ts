"use server";

import fs from "fs";
import path from "path";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { TanitaParser } from "../tanita-parser";

export type CsvRecord = Record<string, any>;

export async function uploadCsv(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("No file uploaded");
        }

        console.log(`[Upload] Received file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 1. Audit Storage
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
            console.error("[Upload] Failed to save audit file, proceeding with parsing anyway:", saveError);
        }

        // 2. Multi-Format Parsing (CSV/XLSX)
        let rawRows: string[][] = [];

        const extension = file.name.split(".").pop()?.toLowerCase();

        // We use the 'xlsx' library for both CSV and Excel files.
        // It provides much better encoding detection (UTF-8, UTF-16, etc.) 
        // and handles different CSV delimiters automatically.
        console.log(`[Upload] Parsing ${extension?.toUpperCase()} file using SheetJS`);

        const workbook = XLSX.read(buffer, {
            type: "buffer",
            codepage: 65001 // Default to UTF-8 if unknown
        });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Get data as array of arrays (stringified)
        // raw: false ensures all values are returned as strings (important for Tanita tags)
        rawRows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
            header: 1,
            raw: false,
            defval: ""
        });

        // 3. Transform & Validate
        console.log(`[Upload] Total rows found: ${rawRows.length}`);
        const data: CsvRecord[] = rawRows
            .map(row => TanitaParser.parseRawRow(row))
            .filter(record => record.date && record.weight !== undefined);

        console.log(`[Upload] Successfully parsed ${data.length} valid records`);

        // Basic validation
        if (data.length === 0) {
            throw new Error(`No valid measurement data found in the ${extension?.toUpperCase() || 'file'}. Please ensure it follows the Tanita export format.`);
        }

        return {
            fileName,
            data: data,
        };
    } catch (error: any) {
        console.error("[Upload] CRITICAL ERROR during upload/parsing:", error);
        // Throw a user-friendly error string that client components can display
        throw new Error(error.message || "An unexpected error occurred during file processing.");
    }
}
