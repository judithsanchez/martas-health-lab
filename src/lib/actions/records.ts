"use server";

import { db } from "@/lib/db";
import { measurements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
    const result = await db.insert(measurements).values(data as any).returning();
    revalidatePath("/");
    return result[0];
}

export async function updateRecord(id: number, data: Partial<MeasurementData>) {
    // defined fields only to avoid overwriting with undefined if partial is passed incorrectly, 
    // but Drizzle handles partial objects in set() gracefully typically.

    // However, we must ensure clientId is not changed if it's not supposed to be, 
    // but the type allows it. Usually records don't move between clients, but manual fix might require it.

    const result = await db.update(measurements)
        .set(data)
        .where(eq(measurements.id, id))
        .returning();

    revalidatePath("/");
    return result[0];
}

export async function deleteRecord(id: number) {
    const result = await db.delete(measurements)
        .where(eq(measurements.id, id))
        .returning();

    revalidatePath("/");
    return result[0];
}
