import Database from "better-sqlite3";

const devDbPath = "data/dev.db";
const db = new Database(devDbPath);

console.log("🔍 Starting Metabolic Age & DCI Correction Simulation (Dry Run)...");

// 1. Fetch all measurements with client info
const rows = db.prepare(`
    SELECT 
        m.id,
        m.date,
        m.weight,
        m.fat_percent,
        m.metabolic_age as old_met_age,
        m.dci_kcal as old_dci,
        c.name,
        c.lastname,
        c.birthday,
        c.gender,
        c.height,
        c.activity_level
    FROM measurements m
    JOIN clients c ON m.client_id = c.id
    WHERE c.birthday IS NOT NULL AND c.gender IS NOT NULL
`).all() as any[];

let totalFixed = 0;
let anomaliesFound = 0;

const changes: any[] = [];

for (const r of rows) {
    const measDate = new Date(r.date.split(' ')[0]);
    const birthDate = new Date(r.birthday);

    // Chronological Age calculation
    let chronAge = measDate.getFullYear() - birthDate.getFullYear();
    const m_diff = measDate.getMonth() - birthDate.getMonth();
    if (m_diff < 0 || (m_diff === 0 && measDate.getDate() < birthDate.getDate())) {
        chronAge--;
    }

    // 1. DCI (Mifflin-St Jeor)
    const baseBmr = (10 * r.weight) + (6.25 * r.height) - (5 * chronAge);
    const bmr = r.gender === 'male' ? baseBmr + 5 : baseBmr - 161;
    const activityFactor = r.activity_level === 3 ? 1.725 : (r.activity_level === 2 ? 1.55 : 1.2);
    const newDci = Math.round(bmr * activityFactor);

    // 2. Metabolic Age (Educated Guess)
    const healthyFat = r.gender === 'female' ? 23 : 15;
    const rawMetAge = chronAge + (r.fat_percent - healthyFat) * 0.5;

    // Capping at +/- 15 years, minimum 12
    let newMetAge = Math.round(Math.max(12, Math.min(chronAge + 15, Math.max(chronAge - 15, rawMetAge))));

    const dciDiff = Math.abs(newDci - (r.old_dci || 0));
    const ageDiff = Math.abs(newMetAge - (r.old_met_age || 0));

    if (ageDiff > 5 || dciDiff > 50) {
        totalFixed++;
        if (ageDiff > 20) anomaliesFound++;

        changes.push({
            id: r.id,
            name: `${r.name} ${r.lastname}`,
            date: r.date.split(' ')[0],
            chronAge,
            fat: r.fat_percent,
            oldMet: r.old_met_age,
            newMet: newMetAge,
            oldDci: r.old_dci,
            newDci: newDci,
            critical: ageDiff > 20
        });
    }
}

// Group by name for better readability
const grouped = changes.reduce((acc: any, curr: any) => {
    if (!acc[curr.name]) acc[curr.name] = [];
    acc[curr.name].push(curr);
    return acc;
}, {});

console.log(`\n📊 SUMMARY:`);
console.log(`- Total measurements analyzed: ${rows.length}`);
console.log(`- Measurements needing adjustment: ${totalFixed}`);
console.log(`- Extreme anomalies (>20 years) found: ${anomaliesFound}`);

console.log(`\n🔎 EXAMPLES OF PROPOSED CHANGES:`);

// Show specific examples user mentioned
const namesToShow = ['Noemi Carranza', 'Natasha Farias', 'Dayana Calderon'];
namesToShow.forEach(name => {
    if (grouped[name]) {
        console.log(`\n👤 ${name.toUpperCase()}:`);
        console.table(grouped[name].slice(0, 3).map((v: any) => ({
            Fecha: v.date,
            'Edad Real': v.chronAge,
            'Grasa %': v.fat,
            'Edad Met. Tanita': v.oldMet,
            'Edad Met. PROPUESTA': v.newMet,
            'DCI Anterior': v.oldDci,
            'DCI NUEVO': v.newDci
        })));
    }
});

if (process.argv.includes('--apply')) {
    console.log(`\n🚀 APPLYING ${changes.length} CHANGES TO DATABASE...`);
    const updateStmt = db.prepare(`
        UPDATE measurements 
        SET metabolic_age = ?, dci_kcal = ? 
        WHERE id = ?
    `);

    const transaction = db.transaction((measurementsToUpdate) => {
        for (const m of measurementsToUpdate) {
            updateStmt.run(m.newMet, m.newDci, m.id);
        }
    });

    transaction(changes);
    console.log("✅ Update complete.");
} else {
    console.log("\n✅ Simulation complete. No changes were made. Run with --apply to commit.");
}

db.close();
