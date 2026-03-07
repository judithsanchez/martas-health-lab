const Database = require('better-sqlite3');
const path = require('path');

function queryDb(dbPath) {
    console.log(`--- Querying ${dbPath} ---`);
    try {
        const db = new Database(dbPath, { readonly: true });
        const rows = db.prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 10').all();
        console.log(JSON.stringify(rows, null, 2));
        db.close();
    } catch (err) {
        console.error(`Error querying ${dbPath}: ${err.message}`);
    }
}

const devDb = path.join(process.cwd(), 'data/dev.db');
const prodDb = path.join(process.cwd(), 'data/prod.db');

queryDb(devDb);
queryDb(prodDb);
