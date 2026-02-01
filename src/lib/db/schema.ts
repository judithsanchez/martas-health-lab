import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const clients = sqliteTable("clients", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    lastname: text("lastname"),
    username: text("username").unique(),
    gender: text("gender"), // 'male' | 'female'
    age: integer("age"),
    birthday: text("birthday"),
    height: real("height"),
    activityLevel: integer("activity_level"),
    sessionsPerWeek: integer("sessions_per_week"),
    startDate: text("start_date"),
    isActive: integer("is_active", { mode: 'boolean' }).default(true),
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
    waist: real("waist"), // Manual entry for WtHR
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
    gender: text("gender"), // Keeping this for record consistency
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
