"use server";

import { db } from "@/lib/db";
import { clients, measurements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getMeasurements() {
    return await db.select({
        id: measurements.id,
        date: measurements.date,
        weight: measurements.weight,
        fatPercent: measurements.fatPercent,
        muscleMass: measurements.muscleMass,
        waterPercent: measurements.waterPercent,
        boneMass: measurements.boneMass,
        visceralFat: measurements.visceralFat,
        bmr: measurements.bmr,
        metabolicAge: measurements.metabolicAge,
        physiqueRatingScale: measurements.physiqueRatingScale,
        bodyType: measurements.bodyType,
        dciKcal: measurements.dciKcal,
        bmi: measurements.bmi,

        // Segmental Fat
        fatArmRight: measurements.fatArmRight,
        fatArmLeft: measurements.fatArmLeft,
        fatLegRight: measurements.fatLegRight,
        fatLegLeft: measurements.fatLegLeft,
        fatTrunk: measurements.fatTrunk,

        // Segmental Muscle
        muscleArmRight: measurements.muscleArmRight,
        muscleArmLeft: measurements.muscleArmLeft,
        muscleLegRight: measurements.muscleLegRight,
        muscleLegLeft: measurements.muscleLegLeft,
        muscleTrunk: measurements.muscleTrunk,

        notes: measurements.notes,
        clientName: clients.name,
        clientUsername: clients.username,
    })
        .from(measurements)
        .leftJoin(clients, eq(measurements.clientId, clients.id))
        .orderBy(desc(measurements.date));
}

export async function getClients() {
    return await db.select().from(clients);
}

export async function createClient(data: {
    name: string;
    lastname?: string;
    username?: string;
    birthday?: string;
    height?: number;
    activityLevel?: number;
    sessionsPerWeek?: number;
    startDate?: string;
    email?: string;
    phone?: string;
    gender?: string;
}) {
    const result = await db.insert(clients).values({
        name: data.name,
        lastname: data.lastname,
        username: data.username,
        birthday: data.birthday,
        gender: data.gender,
        height: data.height,
        activityLevel: data.activityLevel,
        sessionsPerWeek: data.sessionsPerWeek,
        startDate: data.startDate,
        email: data.email,
        phone: data.phone,
    }).returning();

    revalidatePath("/");
    return result[0];
}

export async function updateClient(
    id: number,
    data: {
        name?: string;
        lastname?: string;
        username?: string;
        birthday?: string;
        height?: number;
        activityLevel?: number;
        sessionsPerWeek?: number;
        startDate?: string;
        email?: string;
        phone?: string;
        gender?: string;
    }
) {
    const result = await db.update(clients)
        .set(data)
        .where(eq(clients.id, id))
        .returning();

    revalidatePath("/");
    return result[0];
}

export async function toggleClientStatus(id: number, isActive: boolean) {
    const result = await db.update(clients)
        .set({ isActive })
        .where(eq(clients.id, id))
        .returning();

    revalidatePath("/");
    return result[0];
}

export async function deleteClient(id: number) {
    // Check for existing measurements
    const existingRecords = await db.select({ id: measurements.id })
        .from(measurements)
        .where(eq(measurements.clientId, id))
        .limit(1);

    if (existingRecords.length > 0) {
        throw new Error("Cannot delete client with existing records. Please archive/deactivate instead.");
    }

    const result = await db.delete(clients)
        .where(eq(clients.id, id))
        .returning();

    revalidatePath("/");
    return result[0];
}

export async function getClientByUsername(username: string) {
    const result = await db.select().from(clients).where(eq(clients.username, username)).limit(1);
    return result[0];
}

export type ClientWithLatestMeasurement = Awaited<ReturnType<typeof getClientsWithLatestMeasurement>>[number];

export async function getClientsWithLatestMeasurement() {
    const allClients = await db.select().from(clients);

    // For each client, fetch latest 2 measurements to determine trend
    const clientsWithData = await Promise.all(allClients.map(async (client: any) => {
        const history = await db.select()
            .from(measurements)
            .where(eq(measurements.clientId, client.id))
            .orderBy(desc(measurements.date))
            .limit(2);

        const latest = history[0];
        const previous = history[1];

        return {
            ...client,
            latestMeasurement: latest || null,
            trends: {
                weight: calculateTrend(latest?.weight, previous?.weight),
                fatPercent: calculateTrend(latest?.fatPercent, previous?.fatPercent),
                muscleMass: calculateTrend(latest?.muscleMass, previous?.muscleMass),
            }
        };
    }));

    return clientsWithData;
}

function calculateTrend(current?: number | null, previous?: number | null): 'up' | 'down' | 'stable' | null {
    if (typeof current !== 'number' || typeof previous !== 'number') return null;
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
}
