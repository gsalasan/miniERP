import pkg from 'pg';
const { Client } = pkg;

async function seedInvoices() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'minierp',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    console.log('📦 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');
    
    const insertSQL = `
      INSERT INTO "invoices" (
        "id", 
        "invoice_number", 
        "invoice_date", 
        "due_date", 
        "customer_name",
        "customer_address",
        "customer_phone",
        "customer_email",
        "subtotal", 
        "tax_amount",
        "discount_amount",
        "total_amount",
        "status",
        "payment_terms",
        "notes",
        "updated_at"
      ) VALUES 
      (
        gen_random_uuid()::text, 
        'INV-2024-001', 
        '2024-10-01', 
        '2024-10-15', 
        'PT. Example Company',
        'Jl. Sudirman No. 123, Jakarta',
        '021-12345678',
        'finance@example.com',
        10000000, 
        1100000,
        0,
        11100000,
        'SENT',
        'Net 30',
        'Invoice untuk project A',
        CURRENT_TIMESTAMP
      ),
      (
        gen_random_uuid()::text, 
        'INV-2024-002', 
        '2024-10-10', 
        '2024-10-24', 
        'PT. Sample Indonesia',
        'Jl. Gatot Subroto No. 456, Jakarta',
        '021-87654321',
        'accounting@sample.co.id',
        5000000, 
        550000,
        100000,
        5450000,
        'DRAFT',
        'Net 14',
        'Invoice untuk konsultasi',
        CURRENT_TIMESTAMP
      ),
      (
        gen_random_uuid()::text, 
        'INV-2024-003', 
        '2024-09-15', 
        '2024-09-29', 
        'CV. Tech Solutions',
        'Jl. HR Rasuna Said No. 789, Jakarta',
        '021-55555555',
        'billing@techsolutions.com',
        15000000, 
        1650000,
        500000,
        16150000,
        'PAID',
        'Net 30',
        'Invoice untuk development website',
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (invoice_number) DO NOTHING;
    `;
    
    console.log('📦 Inserting sample invoices...');
    await client.query(insertSQL);
    
    console.log('✅ Sample data inserted successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await client.end();
  }
}

seedInvoices();
