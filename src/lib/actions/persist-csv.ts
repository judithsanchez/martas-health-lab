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
    await db.transaction(async (tx: any) => {
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
                    date: assignment.record.date || new Date().toISOString(),
                    weight: assignment.record.weight,
                    height: assignment.record.height,
                    fatPercent: assignment.record.fatPercent,
                    muscleMass: assignment.record.muscleMass,
                    waterPercent: assignment.record.waterPercent,
                    boneMass: assignment.record.boneMass,
                    visceralFat: assignment.record.visceralFat,
                    bmr: assignment.record.bmr,
                    metabolicAge: assignment.record.metabolicAge,
                    dciKcal: assignment.record.dciKcal,
                    physiqueRatingScale: assignment.record.physiqueRatingScale,
                    bodyType: assignment.record.bodyType,
                    gender: assignment.record.gender,
                    activityLevel: assignment.record.activityLevel,
                    bmi: assignment.record.bmi,

                    // Segmental - Arms
                    fatArmRight: assignment.record.fatArmRight,
                    fatArmLeft: assignment.record.fatArmLeft,
                    muscleArmRight: assignment.record.muscleArmRight,
                    muscleArmLeft: assignment.record.muscleArmLeft,

                    // Segmental - Legs
                    fatLegRight: assignment.record.fatLegRight,
                    fatLegLeft: assignment.record.fatLegLeft,
                    muscleLegRight: assignment.record.muscleLegRight,
                    muscleLegLeft: assignment.record.muscleLegLeft,

                    // Segmental - Trunk
                    fatTrunk: assignment.record.fatTrunk,
                    muscleTrunk: assignment.record.muscleTrunk,

                    notes: `Imported from CSV. Model: ${assignment.record.modelName || 'Unknown'}`,
                });
            }
        }
    });

    revalidatePath("/");
}
