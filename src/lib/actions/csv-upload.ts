"use server";

import fs from "fs";
import path from "path";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { TanitaParser } from "../tanita-parser";
<<<<<<< HEAD
import { Logger } from "../logger";
=======
import { logger } from "../logger";
>>>>>>> 11dfda8 (fix: resolve upload delimiter mismatch, 2-digit year parsing, and missing logs table)

export type CsvRecord = Record<string, any>;

export async function uploadCsv(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            throw new Error("No file uploaded");
        }

        await logger.info(`Received file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`, null, "uploadCsv");

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
<<<<<<< HEAD
            console.log(`[Upload] Audit file saved to: ${filePath}`);
            await Logger.info(`Audit file saved to: ${filePath}`, { filePath: filePath }, "CSV_UPLOAD");
        } catch (saveError) {
            console.error("[Upload] Failed to save audit file, proceeding with parsing anyway:", saveError);
            await Logger.warn(`Failed to save audit file for ${file.name}: ${saveError}`, { fileName: file.name, error: saveError }, "CSV_UPLOAD");
=======
            await logger.info(`Audit file saved to: ${filePath}`, { filePath }, "uploadCsv");
        } catch (saveError) {
            await logger.warn("Failed to save audit file, proceeding with parsing anyway", saveError, "uploadCsv");
>>>>>>> 11dfda8 (fix: resolve upload delimiter mismatch, 2-digit year parsing, and missing logs table)
        }

        // 2. Multi-Format Parsing (CSV/XLSX)
        let rawRows: string[][] = [];
        const extension = file.name.split(".").pop()?.toLowerCase();

<<<<<<< HEAD
        // We use the 'xlsx' library for both CSV and Excel files.
        // It provides much better encoding detection (UTF-8, UTF-16, etc.) 
        // and handles different CSV delimiters automatically.
        console.log(`[Upload] Parsing ${extension?.toUpperCase()} file using SheetJS`);
        await Logger.info(`Parsing ${extension?.toUpperCase()} file using SheetJS`, { fileName: file.name, extension: extension }, "CSV_UPLOAD");
=======
        if (extension === "csv" || extension === "txt") {
            await logger.info(`Parsing ${extension.toUpperCase()} file using PapaParse`, { extension }, "uploadCsv");
            const csvString = buffer.toString("utf8");
            const parseResult = Papa.parse<string[]>(csvString, {
                header: false,
                skipEmptyLines: true,
                dynamicTyping: false,
            });
            rawRows = parseResult.data;
        } else {
            // Excel/XLSX
            // We use the 'xlsx' library for both CSV and Excel files.
            // It provides much better encoding detection (UTF-8, UTF-16, etc.) 
            // and handles different CSV delimiters automatically.
            await logger.info(`Parsing ${extension?.toUpperCase()} file using SheetJS`, { extension }, "uploadCsv");
>>>>>>> 11dfda8 (fix: resolve upload delimiter mismatch, 2-digit year parsing, and missing logs table)

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
        }

        // 3. Transform & Validate
        console.log(`[Upload] Total rows found: ${rawRows.length}`);
<<<<<<< HEAD
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
=======

        // 3a. Detect Date Format across all rows
        let detectedFormat: 'auto' | 'DMY' | 'MDY' = 'auto';
        for (const row of rawRows) {
            // Find "DT" tag index
            const dtIndex = row.indexOf("DT");
            if (dtIndex !== -1 && row[dtIndex + 1]) {
                const dateVal = row[dtIndex + 1];
                const parts = dateVal.split('/');
                if (parts.length === 3) {
                    const p0 = parseInt(parts[0], 10);
                    const p1 = parseInt(parts[1], 10);
                    if (p0 > 12) {
                        detectedFormat = 'DMY';
                        break;
                    }
                    if (p1 > 12) {
                        detectedFormat = 'MDY';
                        break;
                    }
                }
            }
        }
        console.log(`[Upload] Detected date format: ${detectedFormat}`);

        const data: CsvRecord[] = rawRows
            .map(row => TanitaParser.parseRawRow(row, detectedFormat))
            .filter(record => record.date && record.weight !== undefined);

        console.log(`[Upload] Successfully parsed ${data.length} valid records`);

        // Basic validation
        if (data.length === 0) {
            const msg = `No valid measurement data found in the ${extension?.toUpperCase() || 'file'}. Please ensure it follows the Tanita export format.`;
            await logger.warn(msg, { extension, dataLength: data.length }, "uploadCsv");
            throw new Error(msg);
>>>>>>> 11dfda8 (fix: resolve upload delimiter mismatch, 2-digit year parsing, and missing logs table)
        }

    } catch (error: any) {
<<<<<<< HEAD
        const file = formData.get("file") as File;
        const name = file?.name || "unknown";
        await Logger.error(`Upload error: ${error.message}`, { error: error.stack, fileName: name }, "CSV_UPLOAD");
        return {
            success: false,
            message: error.message || "Failed to process file"
        };
=======
        await logger.error("CRITICAL ERROR during upload/parsing", { error: error.message, stack: error.stack }, "uploadCsv");
        throw new Error(error.message || "An unexpected error occurred during file processing.");
>>>>>>> 11dfda8 (fix: resolve upload delimiter mismatch, 2-digit year parsing, and missing logs table)
    }
}
