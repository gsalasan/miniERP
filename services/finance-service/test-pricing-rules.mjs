// Test pricing_rules table and migration
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: '192.168.1.72',
  port: 5432,
  user: 'postgres',
  password: 'anisa252502',
  database: 'minierp_unais'
});

async function test() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'pricing_rules'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ Table pricing_rules not found. Creating...');
      
      // Create table
      await client.query(`
        CREATE TABLE IF NOT EXISTS pricing_rules (
          id SERIAL PRIMARY KEY,
          category VARCHAR(100) UNIQUE NOT NULL,
          markup_percentage DECIMAL(5, 2) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Insert sample data
      await client.query(`
        INSERT INTO pricing_rules (category, markup_percentage) VALUES
        ('Hardware', 15.00),
        ('Software', 25.00),
        ('Consulting', 40.00),
        ('Cloud Services', 20.00),
        ('Training', 30.00)
        ON CONFLICT (category) DO NOTHING
      `);
      
      console.log('✅ Table created and seeded');
    } else {
      console.log('✅ Table pricing_rules exists');
    }
    
    // Get count
    const count = await client.query('SELECT COUNT(*) as count FROM pricing_rules');
    console.log(`📊 Total records: ${count.rows[0].count}`);
    
    // Get all records
    const records = await client.query('SELECT * FROM pricing_rules ORDER BY id');
    console.log('\n📋 Pricing Rules:');
    records.rows.forEach(row => {
      console.log(`  ${row.id}. ${row.category}: ${row.markup_percentage}%`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

test();
