"use server";

import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
