import pkg from 'pg';
const { Client } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = new Client({
    host: '192.168.1.72',
    port: 5432,
    database: 'minierp_unais',
    user: 'postgres',
    password: 'anisa252502'
  });

  try {
    console.log('📦 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');
    
    const sqlPath = path.join(__dirname, 'prisma', 'migrations', 'add_invoice_model.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📦 Executing SQL...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
