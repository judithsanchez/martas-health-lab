import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { clients, measurements } from "../src/lib/db/schema";
import { eq, desc, like } from "drizzle-orm";

const sqlite = new Database("data/dev.db");
const db = drizzle(sqlite);

async function seedHistory() {
    console.log("🌱 Starting seed for Yuyi's history...");

    // 1. Find the client "Yuyi"
    const clientList = db.select().from(clients).all();
    const yuyi = clientList.find(c => c.name.toLowerCase().includes("yuyi"));

    if (!yuyi) {
        console.error("❌ Client 'Yuyi' not found!");
        process.exit(1);
    }

    console.log(`✅ Found client: ${yuyi.name} (ID: ${yuyi.id})`);

    // 2. Get their most recent measurement
    const lastMeasurement = db.select()
        .from(measurements)
        .where(eq(measurements.clientId, yuyi.id))
        .orderBy(desc(measurements.date))
        .limit(1)
        .get();

    if (!lastMeasurement) {
        console.error("❌ No existing measurement found to base history on.");
        process.exit(1);
    }

    console.log(`✅ Reference Measurement: Date=${lastMeasurement.date}, Weight=${lastMeasurement.weight}kg, Fat=${lastMeasurement.fatPercent}%`);

    // 3. Generate 10 prior records
    const newRecords = [];
    const NUM_RECORDS = 10;
    const INTERVAL_DAYS = 14; // Every 2 weeks

    // Base values (Target is current, Start is "Bad Shape")
    const target = {
        weight: lastMeasurement.weight,
        fatPercent: lastMeasurement.fatPercent || 25,
        muscleMass: lastMeasurement.muscleMass || 40,
        visceralFat: lastMeasurement.visceralFat || 5,
        metabolicAge: lastMeasurement.metabolicAge || 30,
        waterPercent: lastMeasurement.waterPercent || 50,
        bmi: lastMeasurement.bmi || 22,
        boneMass: lastMeasurement.boneMass || 2.5
    };

    const start = {
        weight: target.weight + 8,      // Started 8kg heavier
        fatPercent: target.fatPercent + 6, // Started with 6% more fat
        muscleMass: target.muscleMass - 3, // Started with 3kg less muscle
        visceralFat: target.visceralFat + 3,
        metabolicAge: target.metabolicAge + 12, // Started "older"
        waterPercent: target.waterPercent - 4,
        bmi: target.bmi + 3,
        boneMass: target.boneMass - 0.1
    };

    const currentDate = new Date(lastMeasurement.date);

    for (let i = 1; i <= NUM_RECORDS; i++) {
        // Go backwards in time
        const recordDate = new Date(currentDate);
        recordDate.setDate(currentDate.getDate() - (i * INTERVAL_DAYS));

        // Interpolate values (Linear progress)
        // i=1 (closest to now) -> close to target
        // i=10 (furthest) -> close to start
        const progress = i / NUM_RECORDS; // 0.1 to 1.0

        const interpolate = (startVal: number, targetVal: number) => {
            return Number((targetVal - (targetVal - startVal) * progress).toFixed(1));
        };

        const weight = interpolate(start.weight, target.weight);
        const fatPercent = interpolate(start.fatPercent, target.fatPercent);
        const muscleMass = interpolate(start.muscleMass, target.muscleMass);
        const bmi = interpolate(start.bmi, target.bmi);

        // Segmental Distribution Logic
        // We assume symmetry for simplicity, allocating total muscle/fat roughly

        // Fat distribution: Trunk ~50%, Legs ~35%, Arms ~15% (Rough heuristics)
        const fatTrunk = Number((fatPercent * 0.55).toFixed(1));
        const fatLeg = Number((fatPercent * 0.18).toFixed(1));
        const fatArm = Number((fatPercent * 0.08).toFixed(1));

        // Muscle distribution: Trunk ~45%, Legs ~35%, Arms ~10-15%
        const muscleTrunk = Number((muscleMass * 0.55).toFixed(1));
        const muscleLeg = Number((muscleMass * 0.18).toFixed(1));
        const muscleArm = Number((muscleMass * 0.08).toFixed(1));

        newRecords.push({
            clientId: yuyi.id,
            date: recordDate.toISOString().split('T')[0],
            weight: weight,
            height: lastMeasurement.height,
            fatPercent: fatPercent,
            muscleMass: muscleMass,
            waterPercent: interpolate(start.waterPercent, target.waterPercent),
            visceralFat: Math.round(interpolate(start.visceralFat, target.visceralFat)),
            boneMass: interpolate(start.boneMass, target.boneMass),
            metabolicAge: Math.round(interpolate(start.metabolicAge, target.metabolicAge)),
            bmi: bmi,
            dciKcal: lastMeasurement.dciKcal ? lastMeasurement.dciKcal - (i * 50) : 2000, // Consumed less/more? Assume improvement means higher metabolism or lower intake needs properly managed. Let's vary slightly.
            bmr: lastMeasurement.bmr ? lastMeasurement.bmr - (i * 20) : 1400,

            // Segmental
            fatArmRight: fatArm,
            fatArmLeft: fatArm,
            fatLegRight: fatLeg,
            fatLegLeft: fatLeg,
            fatTrunk: fatTrunk,

            muscleArmRight: muscleArm,
            muscleArmLeft: muscleArm,
            muscleLegRight: muscleLeg,
            muscleLegLeft: muscleLeg,
            muscleTrunk: muscleTrunk,

            notes: "Historical data generated for chart testing",
            gender: yuyi.gender || 'female',
            age: yuyi.age ? yuyi.age - (i > 25 ? 1 : 0) : 30 // Rough age adjustment
        });
    }

    // Insert records
    // Reverse to insert oldest first? Doesn't strictly matter for SQL, but logical.
    console.log(`📝 Preparing to insert ${newRecords.length} records...`);

    for (const record of newRecords) {
        try {
            db.insert(measurements).values(record).run();
            console.log(`   + Inserted record for ${record.date}: ${record.weight}kg, ${record.fatPercent}% Fat`);
        } catch (e) {
            console.error(`   ! Failed to insert record for ${record.date}`, e);
        }
    }

    console.log("✅ Seed complete!");
}

seedHistory();
