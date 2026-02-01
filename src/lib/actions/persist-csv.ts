"use server";

import { db } from "@/lib/db";
import { measurements } from "@/lib/db/schema";
import { CsvRecord } from "./csv-upload";
import { revalidatePath } from "next/cache";

export async function persistMeasurements(clientId: number, records: CsvRecord[]) {
    const values = records.map(record => ({
        clientId,
        date: new Date().toISOString(), // Defaulting to now, we can refine this
        weight: parseFloat(record.number) || 0, // Mapping 'number' to 'weight' as a test case
        notes: `Imported from CSV. Age: ${record.age}`,
    }));

    if (values.length === 0) return;

    await db.insert(measurements).values(values);
    revalidatePath("/");
}
