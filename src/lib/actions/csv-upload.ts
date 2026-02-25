"use server";

import fs from "fs";
import path from "path";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { TanitaParser } from "../tanita-parser";
import { logger } from "../logger";

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

        // 1. Audit Storage
        const uploadsDir = path.join(process.cwd(), "data", "uploads");
        const storedFileName = `${Date.now()}-${file.name}`;

        try {
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const filePath = path.join(uploadsDir, storedFileName);
            fs.writeFileSync(filePath, buffer);
            await logger.info(`Audit file saved to: ${filePath}`, { filePath }, "uploadCsv");
        } catch (saveError) {
            await logger.warn("Failed to save audit file, proceeding with parsing anyway", saveError, "uploadCsv");
        }

        // 2. Multi-Format Parsing (CSV/XLSX)
        let rawRows: string[][] = [];
        const extension = file.name.split(".").pop()?.toLowerCase();

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
            await logger.info(`Parsing ${extension?.toUpperCase()} file using SheetJS`, { extension }, "uploadCsv");
            const workbook = XLSX.read(buffer, {
                type: "buffer",
                codepage: 65001 // Default to UTF-8 if unknown
            });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Get data as array of arrays (stringified)
            rawRows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
                header: 1,
                raw: false,
                defval: ""
            });
        }

        // 3. Transform & Validate
        console.log(`[Upload] Total rows found: ${rawRows.length}`);

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

        if (data.length === 0) {
            const msg = `No valid measurement data found in the ${extension?.toUpperCase() || 'file'}. Please ensure it follows the Tanita export format.`;
            await logger.warn(msg, { extension, dataLength: data.length }, "uploadCsv");
            throw new Error(msg);
        }

        await logger.success(`Successfully parsed ${data.length} records from ${file.name}`, { count: data.length }, "uploadCsv");

        return {
            success: true,
            message: `Successfully parsed ${data.length} records.`,
            data,
            fileName: file.name
        };

    } catch (error: any) {
        await logger.error("CRITICAL ERROR during upload/parsing", { error: error.message, stack: error.stack }, "uploadCsv");
        return {
            success: false,
            message: error.message || "An unexpected error occurred during file processing."
        };
    }
}
