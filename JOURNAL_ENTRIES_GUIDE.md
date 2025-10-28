# Journal Entries Integration Guide

## Overview
Journal Entries adalah fitur untuk mencatat semua transaksi keuangan dalam sistem akuntansi. Setiap entry memiliki relasi dengan Chart of Accounts (COA) dan menggunakan sistem double-entry bookkeeping (debit dan credit).

## Database Schema

### Table: `journal_entries`

```sql
CREATE TABLE "journal_entries" (
    "id" BIGSERIAL PRIMARY KEY,
    "transaction_date" DATE NOT NULL,
    "description" TEXT,
    "account_id" INTEGER NOT NULL,
    "debit" DECIMAL(15,2),
    "credit" DECIMAL(15,2),
    "reference_id" UUID,
    "reference_type" VARCHAR(50),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "journal_entries_account_id_fkey" FOREIGN KEY ("account_id") 
        REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
```

### Indexes
- `journal_entries_account_id_idx` - For filtering by account
- `journal_entries_transaction_date_idx` - For date range queries
- `journal_entries_reference_id_idx` - For linking to source documents

### Relationships
- **account_id** → `ChartOfAccounts.id` (Many-to-One)
  - Setiap journal entry harus terkait dengan satu akun di COA

## Prisma Model

```prisma
model JournalEntry {
  id               BigInt           @id @default(autoincrement())
  transaction_date DateTime         @db.Date
  description      String?          @db.Text
  account_id       Int
  debit            Decimal?         @db.Decimal(15, 2)
  credit           Decimal?         @db.Decimal(15, 2)
  reference_id     String?          @db.Uuid
  reference_type   String?          @db.VarChar(50)
  created_by       String?
  created_at       DateTime         @default(now())
  updated_at       DateTime         @updatedAt
  account          ChartOfAccounts  @relation(fields: [account_id], references: [id])

  @@index([account_id])
  @@index([transaction_date])
  @@index([reference_id])
  @@map("journal_entries")
}
```

## Installation Steps

### 1. Update Prisma Schema
Schema sudah diupdate di `prisma/schema.prisma`

### 2. Run Migration
```bash
# Run the migration script
node run-journal-entries-migration.mjs
```

### 3. Generate Prisma Client
```bash
cd services/finance-service
npx prisma generate
```

### 4. Restart Finance Service
```bash
cd services/finance-service
npm run dev
# atau
node src/utils/server.ts
```

## API Endpoints

Base URL: `http://localhost:3012/api/journal-entries`

### 1. Get All Journal Entries
```http
GET /api/journal-entries
```

**Query Parameters:**
- `account_id` (optional) - Filter by account ID
- `start_date` (optional) - Filter by start date (YYYY-MM-DD)
- `end_date` (optional) - Filter by end date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "message": "Journal entries retrieved successfully",
  "data": [
    {
      "id": "1",
      "transaction_date": "2024-01-15",
      "description": "Cash payment for office supplies",
      "account_id": 1100,
      "debit": "500000.00",
      "credit": null,
      "reference_id": "uuid-here",
      "reference_type": "payment",
      "created_by": "admin",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      "account": {
        "id": 1100,
        "account_code": "1100",
        "account_name": "Cash",
        "account_type": "Asset"
      }
    }
  ]
}
```

### 2. Get Journal Entries by Account
```http
GET /api/journal-entries/account/:accountId
```

**Response:** Same as Get All

### 3. Get Single Journal Entry
```http
GET /api/journal-entries/:id
```

### 4. Create Journal Entry
```http
POST /api/journal-entries
Content-Type: application/json

{
  "transaction_date": "2024-01-15",
  "description": "Cash payment for office supplies",
  "account_id": 1100,
  "debit": 500000.00,
  "credit": null,
  "reference_id": "uuid-optional",
  "reference_type": "payment",
  "created_by": "admin"
}
```

**Validation Rules:**
- `transaction_date` - Required, DATE format
- `account_id` - Required, must exist in ChartOfAccounts
- Either `debit` OR `credit` must be filled (not both, not neither)
- `debit` and `credit` must be positive numbers

### 5. Update Journal Entry
```http
PUT /api/journal-entries/:id
Content-Type: application/json

{
  "description": "Updated description",
  "debit": 550000.00
}
```

### 6. Delete Journal Entry
```http
DELETE /api/journal-entries/:id
```

### 7. Get Account Balance
```http
GET /api/journal-entries/account/:accountId/balance
```

**Response:**
```json
{
  "success": true,
  "message": "Account balance retrieved successfully",
  "data": {
    "account_id": 1100,
    "total_debit": 5000000.00,
    "total_credit": 3000000.00,
    "balance": 2000000.00
  }
}
```

## Frontend Integration

### 1. File Structure
```
frontend/apps/finance-frontend/src/
├── api/
│   └── index.ts (updated with JournalEntry types & API)
├── pages/
│   ├── COA.tsx (updated with tabs)
│   └── COA/
│       └── JournalEntriesTab.tsx (new component)
└── utils/
    └── formatters.ts (new utility)
```

### 2. Using the Journal Entries Tab

The COA page now has two tabs:
1. **Chart of Accounts** - Manage COA
2. **Journal Entries** - View and manage journal entries

Features:
- ✅ Filter by account
- ✅ Filter by date range
- ✅ Search entries
- ✅ Create/Edit/Delete entries
- ✅ Expandable rows for details
- ✅ Real-time balance calculation
- ✅ Pagination

### 3. API Usage in Frontend

```typescript
import { journalEntriesAPI } from '../api';

// Get all entries
const entries = await journalEntriesAPI.getAll();

// Get entries with filters
const filtered = await journalEntriesAPI.getAll({
  account_id: 1100,
  start_date: '2024-01-01',
  end_date: '2024-12-31'
});

// Create entry
await journalEntriesAPI.create({
  transaction_date: '2024-01-15',
  account_id: 1100,
  debit: 500000,
  description: 'Cash payment'
});
```

## Double-Entry Bookkeeping Rules

### Debit vs Credit

| Account Type | Increase | Decrease |
|-------------|----------|----------|
| Asset       | Debit    | Credit   |
| Liability   | Credit   | Debit    |
| Equity      | Credit   | Debit    |
| Revenue     | Credit   | Debit    |
| Expense     | Debit    | Credit   |

### Examples

**Example 1: Cash Sale**
- Debit: Cash (Asset) - Rp 1,000,000
- Credit: Sales Revenue (Revenue) - Rp 1,000,000

```json
[
  {
    "transaction_date": "2024-01-15",
    "account_id": 1100,
    "debit": 1000000,
    "description": "Cash sale - Invoice #001",
    "reference_type": "invoice",
    "reference_id": "invoice-uuid"
  },
  {
    "transaction_date": "2024-01-15",
    "account_id": 4000,
    "credit": 1000000,
    "description": "Cash sale - Invoice #001",
    "reference_type": "invoice",
    "reference_id": "invoice-uuid"
  }
]
```

**Example 2: Payment to Supplier**
- Debit: Accounts Payable (Liability) - Rp 500,000
- Credit: Cash (Asset) - Rp 500,000

## Testing

### 1. Test API with cURL

```bash
# Get all entries
curl http://localhost:3012/api/journal-entries

# Create entry
curl -X POST http://localhost:3012/api/journal-entries \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_date": "2024-01-15",
    "account_id": 1,
    "debit": 100000,
    "description": "Test entry"
  }'
```

### 2. Test Frontend
1. Navigate to COA page
2. Click "Journal Entries" tab
3. Test CRUD operations
4. Verify filters and search

## Troubleshooting

### Error: "Either debit or credit must be provided"
**Solution:** Fill only one field (debit OR credit), not both

### Error: "Account not found"
**Solution:** Make sure account_id exists in ChartOfAccounts table

### Error: "Cannot read properties of undefined"
**Solution:** Run Prisma generate after schema changes

### Frontend shows "Tidak ada data"
**Solution:** 
1. Check if backend is running on port 3012
2. Check browser console for CORS errors
3. Verify API endpoint in config

## Best Practices

1. **Always use reference_id and reference_type** to link entries to source documents
2. **Create entries in pairs** for proper double-entry bookkeeping
3. **Use meaningful descriptions** for audit trail
4. **Set created_by** for user tracking
5. **Validate account types** before creating entries

## Future Enhancements

- [ ] Batch journal entry creation
- [ ] Journal entry reversal
- [ ] Audit log for changes
- [ ] Export to Excel
- [ ] Trial balance report
- [ ] General ledger report
- [ ] Journal entry approval workflow

## Support

For questions or issues:
1. Check console logs in browser DevTools
2. Check backend logs in terminal
3. Verify database connection
4. Review Prisma schema and generated client
