"use server";

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";
import { TanitaParser } from "../tanita-parser";
import { logger } from "../logger";

export type CsvRecord = Record<string, any>;

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["csv", "txt", "xls", "xlsx"]);
class UploadValidationError extends Error {}

export async function uploadCsv(formData: FormData) {
    try {
        const file = formData.get("file");
        if (!file) {
            throw new UploadValidationError("No file uploaded");
        }
        if (typeof file === "string") {
            throw new UploadValidationError("Please select a CSV, TXT, XLS or XLSX file.");
        }
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        if (!ALLOWED_EXTENSIONS.has(extension)) {
            throw new UploadValidationError("Unsupported file type. Use CSV, TXT, XLS or XLSX.");
        }
        if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
            throw new UploadValidationError("The file must contain data and be no larger than 4 MiB.");
        }
        const bytes = await file.arrayBuffer();
        if (bytes.byteLength === 0 || bytes.byteLength > MAX_UPLOAD_BYTES) {
            throw new UploadValidationError("The file must contain data and be no larger than 4 MiB.");
        }
        const buffer = Buffer.from(bytes);
        await logger.info("Received measurement upload", { extension, size: buffer.length }, "uploadCsv");

        // 1. Audit Storage
        const uploadsDir = path.join(process.cwd(), "data", "uploads");
        // Never derive a filesystem path from the supplied filename.
        const storedFileName = `${randomUUID()}.${extension}`;

        try {
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o700 });
            }
            const filePath = path.join(uploadsDir, storedFileName);
            fs.writeFileSync(filePath, buffer, { flag: "wx", mode: 0o600 });
            await logger.info("Upload audit copy saved", null, "uploadCsv");
        } catch {
            await logger.warn("Failed to save audit file, proceeding with parsing anyway", null, "uploadCsv");
        }

        // 2. Multi-Format Parsing (CSV/XLSX)
        let rawRows: string[][] = [];

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

        // 3a. Detect Date Format across all rows
        let detectedFormat: 'auto' | 'DMY' | 'MDY' = 'auto';
        for (const rawRow of rawRows) {
            const row = TanitaParser.splitWrappedRow(rawRow);
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

        const data: CsvRecord[] = rawRows.map((rawRow) => {
            const split = TanitaParser.splitWrappedRow(rawRow);
            const parsed = TanitaParser.parseRawRow(split, detectedFormat);
            return parsed;
        }).filter(record => record.date && record.weight !== undefined);


        if (data.length === 0) {
            const msg = `No valid measurement data found in the ${extension?.toUpperCase() || 'file'}. Please ensure it follows the Tanita export format.`;
            await logger.warn(msg, { extension, dataLength: data.length }, "uploadCsv");
            throw new UploadValidationError(msg);
        }

        await logger.success(`Successfully parsed ${data.length} records`, { count: data.length }, "uploadCsv");

        return {
            success: true,
            message: `Successfully parsed ${data.length} records.`,
            data,
            fileName: file.name
        };

    } catch (error: unknown) {
        await logger.error("Upload rejected or could not be parsed", null, "uploadCsv");
        return {
            success: false,
            message: error instanceof UploadValidationError
                ? error.message
                : "The file could not be processed. Please check its format and try again."
        };
    }
}
