import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { clients, measurements } from "../src/lib/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";

const devDbPath = "data/dev.db";
const data1Path = "migration-data/data1.sqlite";
const data2Path = "migration-data/data2.sqlite";

console.log("🚀 Starting Tanita SDF to DEV DB Migration...");

// Connect to DEV DB
const devSqlite = new Database(devDbPath);
const db = drizzle(devSqlite);

async function migrateData(sourceDbPath: string) {
    console.log(`\n🔍 Connecting to source database: ${sourceDbPath}`);
    const sourceDb = new Database(sourceDbPath, { readonly: true });

    // 1. Fetch Users
    const users = sourceDb.prepare("SELECT * FROM Users").all() as any[];
    console.log(`Found ${users.length} users in source.`);

    // 2. Map Users to Clients
    const userMap = new Map(); // Map Legacy UserID -> Local Client ID

    for (const u of users) {
        const legacyId = u.UserID;
        const firstName = u.NameFirst?.trim();
        const lastName = u.NameLast?.trim();

        // Skip empty users
        if (!firstName && !lastName) continue;

        const nameStr = firstName || "";
        const genderMapped = u.Gender === 1 ? "male" : (u.Gender === 2 ? "female" : null);

        // Find the earliest measurement date for this user to set as startDate
        const userMeasurements = sourceDb.prepare(`SELECT MeasDateTime FROM Measurements WHERE MeasUserID = '${legacyId}' ORDER BY MeasDateTime ASC LIMIT 1`).get() as any;
        const startDate = userMeasurements && userMeasurements.MeasDateTime ? String(userMeasurements.MeasDateTime).split(' ')[0] : null;

        // Check if exists
        const existing = db.select().from(clients).where(eq(clients.legacyId, legacyId)).get();

        let clientId;
        if (existing) {
            clientId = existing.id;
        } else {
            const generatedUsername = (nameStr + (lastName || "")).replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || `user${legacyId}`;
            console.log(`➕ Inserting new client: ${nameStr} ${lastName || ""} (@${generatedUsername})`);
            const result = db.insert(clients).values({
                legacyId: legacyId,
                username: generatedUsername,
                name: nameStr,
                lastname: lastName || null,
                gender: genderMapped,
                height: u.Height ? parseFloat(u.Height) : null,
                birthday: u.Birthday ? String(u.Birthday).split(' ')[0] : null,
                activityLevel: u.ActivityLevel ? parseInt(u.ActivityLevel) : null,
                sessionsPerWeek: 3,
                startDate: startDate
            }).returning({ id: clients.id }).get();

            clientId = result.id;
        }

        userMap.set(legacyId, clientId);
    }

    // 3. Fetch Measurements
    const measRows = sourceDb.prepare("SELECT * FROM Measurements").all() as any[];
    console.log(`Found ${measRows.length} measurements in source.`);

    let insertedMeasCount = 0;
    let skippedMeasCount = 0;

    for (const m of measRows) {
        const legacyId = m.MeasUserID;
        const clientId = userMap.get(legacyId);

        if (!clientId) {
            // Unmapped measurement, skip
            continue;
        }

        const dateStr = String(m.MeasDateTime);

        // We will just insert the new record. To avoid true duplicates we can check if fat percent is already set or something similar. For now just insert.
        // Or revert back to simple strict date check to avoid duplicating everything again.
        const existingMeas = db.select()
            .from(measurements)
            .where(and(
                eq(measurements.clientId, clientId),
                eq(measurements.date, dateStr)
            )).get();

        if (existingMeas) {
            skippedMeasCount++;
            continue;
        }

        try {
            const weight = parseFloat(m.Weight);
            let fatPercent = m.BodyFatPercent ? parseFloat(m.BodyFatPercent) : null;
            let muscleMass = m.MuscleMass ? parseFloat(m.MuscleMass) : null;
            let boneMass = m.BoneMass ? parseFloat(m.BoneMass) : null;
            let dciKcal = m.DCI ? parseInt(m.DCI) : null;
            let metabolicAge = m.MetabolicAge ? parseFloat(m.MetabolicAge) : null;

            // If metrics are missing, calculate them using heuristics
            if (weight && fatPercent && (muscleMass === null || boneMass === null || dciKcal === null || metabolicAge === null)) {
                const clientObj = db.select().from(clients).where(eq(clients.id, clientId)).get();
                if (clientObj && clientObj.height && clientObj.birthday && clientObj.gender) {
                    const height = clientObj.height;
                    const gender = clientObj.gender;
                    const activityLevel = clientObj.activityLevel || 1;

                    // Parse dates
                    const measDate = new Date(dateStr.split(' ')[0]);
                    const birthDate = new Date(clientObj.birthday);
                    let age = measDate.getFullYear() - birthDate.getFullYear();
                    const m_diff = measDate.getMonth() - birthDate.getMonth();
                    if (m_diff < 0 || (m_diff === 0 && measDate.getDate() < birthDate.getDate())) {
                        age--;
                    }

                    // 1. DCI / BMR (Mifflin-St Jeor)
                    if (dciKcal === null) {
                        const baseBmr = (10 * weight) + (6.25 * height) - (5 * age);
                        const bmr = gender === 'male' ? baseBmr + 5 : baseBmr - 161;
                        const factor = activityLevel === 3 ? 1.725 : (activityLevel === 2 ? 1.55 : 1.2);
                        dciKcal = Math.round(bmr * factor);
                    }

                    // 2. Bone Mass Estimation
                    if (boneMass === null) {
                        if (gender === 'female') {
                            boneMass = weight < 50 ? 1.95 : (weight <= 75 ? 2.40 : 2.95);
                        } else {
                            boneMass = weight < 65 ? 2.66 : (weight <= 95 ? 3.29 : 3.69);
                        }
                    }

                    // 3. Muscle Mass (Weight - FatMass - BoneMass)
                    if (muscleMass === null) {
                        const fatMass = weight * (fatPercent / 100);
                        muscleMass = Math.round((weight - fatMass - boneMass) * 100) / 100;
                    }

                    // 4. Metabolic Age (Heuristic)
                    if (metabolicAge === null) {
                        const healthyFat = gender === 'female' ? 23 : 15;
                        const adj = Math.max(-15, Math.min(15, (fatPercent - healthyFat) * 0.5));
                        metabolicAge = Math.max(12, Math.round(age + adj));
                    }
                }
            }

            db.insert(measurements).values({
                clientId: clientId,
                date: dateStr,
                weight: weight,
                fatPercent: fatPercent,
                muscleMass: muscleMass,
                waterPercent: m.BodyWaterPercent ? parseFloat(m.BodyWaterPercent) : null,
                boneMass: boneMass,
                visceralFat: m.VisceralFatRating ? parseFloat(m.VisceralFatRating) : null,
                dciKcal: dciKcal,
                metabolicAge: metabolicAge,
                physiqueRatingScale: m.PhysiqueRating ? parseInt(m.PhysiqueRating) : null,
                bmi: m.BodyMassIndex ? parseFloat(m.BodyMassIndex) : null,

                // Segmental Fat %
                fatArmRight: m.BodyFatPercentRA ? parseFloat(m.BodyFatPercentRA) : null,
                fatArmLeft: m.BodyFatPercentLA ? parseFloat(m.BodyFatPercentLA) : null,
                fatLegRight: m.BodyFatPercentRL ? parseFloat(m.BodyFatPercentRL) : null,
                fatLegLeft: m.BodyFatPercentLL ? parseFloat(m.BodyFatPercentLL) : null,
                fatTrunk: m.BodyFatPercentTrunk ? parseFloat(m.BodyFatPercentTrunk) : null,

                // Segmental Muscle Mass (kg)
                muscleArmRight: m.MuscleMassRA ? parseFloat(m.MuscleMassRA) : null,
                muscleArmLeft: m.MuscleMassLA ? parseFloat(m.MuscleMassLA) : null,
                muscleLegRight: m.MuscleMassRL ? parseFloat(m.MuscleMassRL) : null,
                muscleLegLeft: m.MuscleMassLL ? parseFloat(m.MuscleMassLL) : null,
                muscleTrunk: m.MuscleMassTrunk ? parseFloat(m.MuscleMassTrunk) : null,
            }).run();
            insertedMeasCount++;
        } catch (e: any) {
            console.error(`Error inserting measurement on ${dateStr} for client ${clientId}:`, e.message);
        }
    }

    console.log(`✅ Finished ${sourceDbPath}. Inserted ${insertedMeasCount} / Skipped ${skippedMeasCount} existing.`);
    sourceDb.close();
}

async function run() {
    await migrateData(data1Path);
    await migrateData(data2Path);
    console.log("\n🎉 ALL DONE!");
}

run().catch(console.error);
