"use server";

import fs from "fs";
import path from "path";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { TanitaParser } from "../tanita-parser";
import { Logger } from "../logger";

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

        await Logger.info(`Starting upload for file: ${file.name}, size: ${bytes.byteLength} bytes`, { fileName: file.name, size: bytes.byteLength }, "CSV_UPLOAD");

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
            await Logger.info(`Audit file saved to: ${filePath}`, { filePath: filePath }, "CSV_UPLOAD");
        } catch (saveError) {
            console.error("[Upload] Failed to save audit file, proceeding with parsing anyway:", saveError);
            await Logger.warn(`Failed to save audit file for ${file.name}: ${saveError}`, { fileName: file.name, error: saveError }, "CSV_UPLOAD");
        }

        // 2. Multi-Format Parsing (CSV/XLSX)
        let rawRows: string[][] = [];

        const extension = file.name.split(".").pop()?.toLowerCase();

        // We use the 'xlsx' library for both CSV and Excel files.
        // It provides much better encoding detection (UTF-8, UTF-16, etc.) 
        // and handles different CSV delimiters automatically.
        console.log(`[Upload] Parsing ${extension?.toUpperCase()} file using SheetJS`);
        await Logger.info(`Parsing ${extension?.toUpperCase()} file using SheetJS`, { fileName: file.name, extension: extension }, "CSV_UPLOAD");

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
        const records: CsvRecord[] = rawRows
            .map(row => TanitaParser.parseRawRow(row))
            .filter(record => record.date && record.weight !== undefined);

        if (records.length > 0) {
            await Logger.success(`Successfully parsed ${records.length} valid records from ${file.name}`, { count: records.length }, "CSV_UPLOAD");
            return {
                success: true,
                message: `Successfully parsed ${records.length} valid records`,
                records
            };
        } else {
            await Logger.warn("No valid data found in the uploaded file", { fileName: file.name }, "CSV_UPLOAD");
            return {
                success: false,
                message: "No valid data found in the file. Please check the format."
            };
        }

    } catch (error: any) {
        const file = formData.get("file") as File;
        const name = file?.name || "unknown";
        await Logger.error(`Upload error: ${error.message}`, { error: error.stack, fileName: name }, "CSV_UPLOAD");
        return {
            success: false,
            message: error.message || "Failed to process file"
        };
    }
}
