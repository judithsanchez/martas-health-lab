"use server";

import { db } from "@/lib/db";
import { measurements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Logger } from "../logger";

export type MeasurementData = {
    clientId: number;
    date: string;
    weight: number;
    height?: number;
    fatPercent?: number;
    muscleMass?: number;
    waterPercent?: number;
    boneMass?: number;
    visceralFat?: number;
    dciKcal?: number;
    bmr?: number;
    metabolicAge?: number;
    physiqueRatingScale?: number;
    bodyType?: number;
    activityLevel?: number;
    bmi?: number;
    waist?: number;
    gender?: string;

    // Segmental Fat
    fatArmRight?: number;
    fatArmLeft?: number;
    fatLegRight?: number;
    fatLegLeft?: number;
    fatTrunk?: number;

    // Segmental Muscle
    muscleArmRight?: number;
    muscleArmLeft?: number;
    muscleLegRight?: number;
    muscleLegLeft?: number;
    muscleTrunk?: number;

    notes?: string;
};

export async function getRecord(id: number) {
    const result = await db.select().from(measurements).where(eq(measurements.id, id)).limit(1);
    return result[0] || null;
}

export async function createRecord(data: MeasurementData) {
    try {
        const result = await db.insert(measurements).values(data as any).returning();
        await Logger.success(`Created measurement for client ID: ${data.clientId}`, { id: result[0].id }, "RECORD_ACTION");
        revalidatePath("/");
        return result[0];
    } catch (error: any) {
        await Logger.error(`Failed to create measurement for client ID: ${data.clientId}`, { error: error.message }, "RECORD_ACTION");
        throw error;
    }
}

export async function updateRecord(id: number, data: Partial<MeasurementData>) {
    try {
        const result = await db.update(measurements)
            .set(data)
            .where(eq(measurements.id, id))
            .returning();

        await Logger.info(`Updated measurement ID: ${id}`, { changes: data }, "RECORD_ACTION");
        revalidatePath("/");
        return result[0];
    } catch (error: any) {
        await Logger.error(`Failed to update measurement ID: ${id}`, { error: error.message }, "RECORD_ACTION");
        throw error;
    }
}

export async function deleteRecord(id: number) {
    try {
        const result = await db.delete(measurements)
            .where(eq(measurements.id, id))
            .returning();

        await Logger.success(`Deleted measurement ID: ${id}`, { id }, "RECORD_ACTION");
        revalidatePath("/");
        return result[0];
    } catch (error: any) {
        await Logger.error(`Failed to delete measurement ID: ${id}`, { error: error.message }, "RECORD_ACTION");
        throw error;
    }
}
