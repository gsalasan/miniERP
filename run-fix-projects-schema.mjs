import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    console.log('\n📝 Running migration script...');
    const sql = readFileSync('./fix-projects-schema.sql', 'utf-8');
    
    const result = await client.query(sql);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('Result:', result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
