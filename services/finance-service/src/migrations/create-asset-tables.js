const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAssetTables() {
  console.log('🔧 Creating Asset Management Tables...');
  
  try {
    // Create fixed_assets table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
        id SERIAL PRIMARY KEY,
        asset_name VARCHAR(255) NOT NULL,
        asset_code VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        acquisition_date DATE NOT NULL,
        acquisition_cost DECIMAL(15,2) NOT NULL,
        residual_value DECIMAL(15,2) DEFAULT 0,
        useful_life_years INTEGER NOT NULL,
        depreciation_method VARCHAR(50) DEFAULT 'STRAIGHT_LINE',
        current_book_value DECIMAL(15,2) NOT NULL,
        accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
        monthly_depreciation_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        location VARCHAR(255),
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ fixed_assets table created');

    // Create depreciation_history table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS depreciation_history (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL,
        period VARCHAR(7) NOT NULL,
        depreciation_expense DECIMAL(15,2) NOT NULL,
        accumulated_depreciation DECIMAL(15,2) NOT NULL,
        book_value DECIMAL(15,2) NOT NULL,
        journal_entry_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES fixed_assets(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ depreciation_history table created');

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_depreciation_history_asset_id ON depreciation_history(asset_id);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_depreciation_history_period ON depreciation_history(period);
    `);
    console.log('✅ Indexes created');

    console.log('🎉 Asset Management tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAssetTables()
  .then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
