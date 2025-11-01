import pkg from 'pg';
const { Client } = pkg;

async function seedInvoices() {
  // Support both DATABASE_URL and individual environment variables
  let dbConfig;
  
  if (process.env.DATABASE_URL) {
    // Parse DATABASE_URL format: postgresql://user:password@host:port/database
    const url = new URL(process.env.DATABASE_URL);
    dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading '/'
      user: url.username,
      password: url.password
    };
  } else {
    // Fallback to individual environment variables or defaults
    dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'minierp',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.DB_ROOT_PASSWORD || 'postgres'
    };
  }
  
  const client = new Client(dbConfig);

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
