import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Database connection
  const client = new Client({
    connectionString: "postgresql://postgres:anisa252502@192.168.1.72:5432/minierp_unais?schema=public"
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'prisma', 'migrations', 'add_tax_and_exchange_rates.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');

    // Optional: Insert seed data
    console.log('\nDo you want to insert sample data? (You can run seed_tax_and_exchange_rates.sql separately)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

runMigration();
