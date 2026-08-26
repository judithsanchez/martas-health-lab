"use server";

import { db } from "@/lib/db";
import { measurements, clients } from "@/lib/db/schema";
import { CsvRecord } from "./csv-upload";
import { revalidatePath } from "next/cache";
import { logger } from "../logger";

export type RowAssignment = {
    record: CsvRecord;
    clientId?: number;
    newClient?: {
        name: string;
        username: string;
        age?: number;
    };
};

export type PersistAssignmentsResult =
    | { success: true; count: number }
    | { success: false; code: "DATABASE_READ_ONLY" | "DATABASE_SAVE_FAILED"; message: string };

export async function persistPerRowAssignments(assignments: RowAssignment[]): Promise<PersistAssignmentsResult> {
    try {
        await logger.info(`Starting persistence for ${assignments.length} assignments`, null, "DB_PERSIST");

        // Use synchronous transaction for better-sqlite3 compatibility
        db.transaction((tx: any) => {
            for (const assignment of assignments) {
                let finalClientId = assignment.clientId;

                // 1. Create new client if needed
                if (!finalClientId && assignment.newClient) {
                    const newClientResult = tx.insert(clients).values({
                        name: assignment.newClient.name,
                        username: assignment.newClient.username,
                        age: assignment.newClient.age,
                    }).returning();
                    finalClientId = newClientResult[0].id;
                }

                // 2. Persist measurement if we have a client ID
                if (finalClientId) {
                    tx.insert(measurements).values({
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
                    }).run();
                }
            }
        });

        await logger.success(`Successfully persisted ${assignments.length} assignments`, { count: assignments.length }, "DB_PERSIST");
        revalidatePath("/");
        return { success: true, count: assignments.length };
    } catch (error: any) {
        await logger.error(`Persistence error: ${error.message}`, { error: error.stack }, "DB_PERSIST");

        if (error?.code === "SQLITE_READONLY" || error?.message?.includes("readonly database")) {
            return {
                success: false,
                code: "DATABASE_READ_ONLY",
                message: "El archivo se procesó correctamente, pero la base de datos no tiene permisos de escritura. No se guardó ninguna medición. Contacta con soporte antes de volver a intentarlo.",
            };
        }

        return {
            success: false,
            code: "DATABASE_SAVE_FAILED",
            message: "El archivo se procesó correctamente, pero ocurrió un error al guardar. No se guardó ninguna medición. Contacta con soporte antes de volver a intentarlo.",
        };
    }
}
