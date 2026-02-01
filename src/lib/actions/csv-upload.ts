"use server";

import fs from "fs";
import path from "path";
import * as Papa from "papaparse";
import { revalidatePath } from "next/cache";

export type CsvRecord = {
    number: string;
    age: string;
    [key: string]: string;
};

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
    const parsed = Papa.parse<CsvRecord>(csvContent, {
        header: true,
        skipEmptyLines: true,
    });

    // 3. Validation
    const headers = parsed.meta.fields || [];
    const requiredHeaders = ["number", "age"];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
        // We might want to handle this better in the UI, but for now we throw
        throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
    }

    return {
        fileName,
        data: parsed.data,
    };
}
