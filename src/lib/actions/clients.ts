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

export async function createClient(data: { name: string; username: string; age?: number; email?: string; phone?: string }) {
    const result = await db.insert(clients).values({
        name: data.name,
        username: data.username,
        age: data.age,
        email: data.email,
        phone: data.phone,
    }).returning();

    revalidatePath("/");
    return result[0];
}

export async function getClientByUsername(username: string) {
    const result = await db.select().from(clients).where(eq(clients.username, username)).limit(1);
    return result[0];
}
