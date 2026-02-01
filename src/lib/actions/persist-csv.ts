"use server";

import { db } from "@/lib/db";
import { measurements, clients } from "@/lib/db/schema";
import { CsvRecord } from "./csv-upload";
import { revalidatePath } from "next/cache";

export type RowAssignment = {
    record: CsvRecord;
    clientId?: number;
    newClient?: {
        name: string;
        username: string;
        age?: number;
    };
};

export async function persistPerRowAssignments(assignments: RowAssignment[]) {
    await db.transaction(async (tx) => {
        for (const assignment of assignments) {
            let finalClientId = assignment.clientId;

            // 1. Create new client if needed
            if (!finalClientId && assignment.newClient) {
                const newClientResult = await tx.insert(clients).values({
                    name: assignment.newClient.name,
                    username: assignment.newClient.username,
                    age: assignment.newClient.age,
                }).returning();
                finalClientId = newClientResult[0].id;
            }

            // 2. Persist measurement if we have a client ID
            if (finalClientId) {
                await tx.insert(measurements).values({
                    clientId: finalClientId,
                    date: new Date().toISOString(),
                    weight: parseFloat(assignment.record.number) || 0,
                    notes: `Imported from CSV. Age: ${assignment.record.age}`,
                });
            }
        }
    });

    revalidatePath("/");
}
