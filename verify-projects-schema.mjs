import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

async function verifySchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check projects table columns
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'projects'
      AND column_name IN ('pm_user_id', 'sales_user_id', 'sales_order_id', 'total_value')
      ORDER BY column_name;
    `;
    
    const result = await client.query(columnsQuery);
    
    console.log('📋 Projects table columns:');
    console.table(result.rows);
    
    if (result.rows.length === 0) {
      console.log('⚠️  No matching columns found. Migration may have failed.');
    } else if (result.rows.length < 4) {
      console.log(`⚠️  Only ${result.rows.length}/4 columns found. Some columns missing.`);
    } else {
      console.log('✅ All required columns exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifySchema();
