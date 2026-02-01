import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const clients = sqliteTable("clients", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    username: text("username").unique(),
    age: integer("age"),
    email: text("email"),
    phone: text("phone"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const measurements = sqliteTable("measurements", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id").references(() => clients.id).notNull(),
    date: text("date").notNull(), // ISO date string
    weight: real("weight").notNull(),
    height: real("height"),
    fatPercent: real("fat_percent"),
    muscleMass: real("muscle_mass"),
    waterPercent: real("water_percent"),
    boneMass: real("bone_mass"),
    visceralFat: real("visceral_fat"),
    dciKcal: integer("dci_kcal"), // Daily Caloric Intake (rD)
    bmr: real("bmr"), // Calculated BMR
    metabolicAge: real("metabolic_age"),
    physiqueRatingScale: integer("physique_rating_scale"),
    bodyType: integer("body_type"),
    gender: integer("gender"),
    activityLevel: integer("activity_level"),
    bmi: real("bmi"),

    // Segmental Fat %
    fatArmRight: real("fat_arm_right"),
    fatArmLeft: real("fat_arm_left"),
    fatLegRight: real("fat_leg_right"),
    fatLegLeft: real("fat_leg_left"),
    fatTrunk: real("fat_trunk"),

    // Segmental Muscle Mass (kg)
    muscleArmRight: real("muscle_arm_right"),
    muscleArmLeft: real("muscle_arm_left"),
    muscleLegRight: real("muscle_leg_right"),
    muscleLegLeft: real("muscle_leg_left"),
    muscleTrunk: real("muscle_trunk"),

    notes: text("notes"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
