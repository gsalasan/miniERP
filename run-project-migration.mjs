import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    const sql = fs.readFileSync('add-project-user-columns.sql', 'utf8');
    
    console.log('Running migration...');
    const result = await client.query(sql);
    
    console.log('✓ Migration completed!');
    console.log('Result:', result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
