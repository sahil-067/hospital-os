
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('Reading migration.sql...');
    const sqlPath = path.join(__dirname, '..', 'migration.sql');

    if (!fs.existsSync(sqlPath)) {
        console.error('migration.sql not found!');
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Executing SQL schema update...');

    // Split by semicolon and run one by one to avoid huge transaction blocks if unsupported
    const statements = sql.split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const stmt of statements) {
        try {
            // Check if it's a valid statement (skip empty)
            if (stmt.length < 5) continue;
            await prisma.$executeRawUnsafe(stmt);
            console.log('Executed statement.');
        } catch (e) {
            console.warn('Warning executing stmt (might be duplicate):', e.message);
        }
    }

    console.log('Schema deployment finished.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
