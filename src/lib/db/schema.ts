import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const clients = sqliteTable("clients", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const measurements = sqliteTable("measurements", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id").references(() => clients.id).notNull(),
    date: text("date").notNull(), // ISO date string
    weight: real("weight").notNull(),
    fatPercent: real("fat_percent"),
    muscleMass: real("muscle_mass"),
    waterPercent: real("water_percent"),
    boneMass: real("bone_mass"),
    visceralFat: real("visceral_fat"),
    bmr: real("bmr"),
    metabolicAge: real("metabolic_age"),
    notes: text("notes"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
