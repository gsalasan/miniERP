# Panduan Integrasi Backend Finance Service

## Struktur Backend yang Dibutuhkan

### Database Schema (Prisma)

```prisma
model ChartOfAccounts {
  id            Int          @id @default(autoincrement())
  account_code  String       @unique
  account_name  String
  account_type  AccountType
  description   String?
  created_at    DateTime     @default(now())
  updated_at    DateTime     @updatedAt
}

enum AccountType {
  Asset
  Liability
  Equity
  Revenue
  Expense
}
```

### API Endpoints

Base URL: `http://localhost:3001/api/chart-of-accounts`

#### 1. Get All Accounts
```
GET /
Response: {
  success: boolean;
  message: string;
  data: ChartOfAccount[];
}
```

#### 2. Get Account by ID
```
GET /:id
Response: {
  success: boolean;
  message: string;
  data: ChartOfAccount;
}
```

#### 3. Create Account
```
POST /
Body: {
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description?: string;
}
Response: {
  success: boolean;
  message: string;
  data: ChartOfAccount;
}
```

#### 4. Update Account
```
PUT /:id
Body: {
  account_code?: string;
  account_name?: string;
  account_type?: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description?: string;
}
Response: {
  success: boolean;
  message: string;
  data: ChartOfAccount;
}
```

#### 5. Delete Account
```
DELETE /:id
Response: {
  success: boolean;
  message: string;
}
```

## Setup Backend

### 1. Install Dependencies

```bash
cd services/finance-service
npm install
```

### 2. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 3. Environment Variables

Buat file `.env` di `services/finance-service/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/minierp"
PORT=3001
JWT_SECRET="your-secret-key"
NODE_ENV="development"
```

### 4. Start Service

```bash
npm run dev
```

## Contoh Controller (Express.js)

```typescript
// services/finance-service/src/controllers/chartOfAccountsController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const chartOfAccountsController = {
  // Get all accounts
  async getAll(req: Request, res: Response) {
    try {
      const accounts = await prisma.chartOfAccounts.findMany({
        orderBy: { account_code: 'asc' }
      });
      
      return res.json({
        success: true,
        message: 'Accounts retrieved successfully',
        data: accounts
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve accounts',
        error: error.message
      });
    }
  },

  // Get account by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await prisma.chartOfAccounts.findUnique({
        where: { id: parseInt(id) }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      return res.json({
        success: true,
        message: 'Account retrieved successfully',
        data: account
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve account',
        error: error.message
      });
    }
  },

  // Create account
  async create(req: Request, res: Response) {
    try {
      const { account_code, account_name, account_type, description } = req.body;

      // Validation
      if (!account_code || !account_name || !account_type) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if account code already exists
      const existing = await prisma.chartOfAccounts.findUnique({
        where: { account_code }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Account code already exists'
        });
      }

      const account = await prisma.chartOfAccounts.create({
        data: {
          account_code,
          account_name,
          account_type,
          description
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: account
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create account',
        error: error.message
      });
    }
  },

  // Update account
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { account_code, account_name, account_type, description } = req.body;

      // Check if account exists
      const existing = await prisma.chartOfAccounts.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      // Check if new account code conflicts
      if (account_code && account_code !== existing.account_code) {
        const codeExists = await prisma.chartOfAccounts.findUnique({
          where: { account_code }
        });

        if (codeExists) {
          return res.status(400).json({
            success: false,
            message: 'Account code already exists'
          });
        }
      }

      const account = await prisma.chartOfAccounts.update({
        where: { id: parseInt(id) },
        data: {
          ...(account_code && { account_code }),
          ...(account_name && { account_name }),
          ...(account_type && { account_type }),
          ...(description !== undefined && { description })
        }
      });

      return res.json({
        success: true,
        message: 'Account updated successfully',
        data: account
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update account',
        error: error.message
      });
    }
  },

  // Delete account
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if account exists
      const existing = await prisma.chartOfAccounts.findUnique({
        where: { id: parseInt(id) }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      await prisma.chartOfAccounts.delete({
        where: { id: parseInt(id) }
      });

      return res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        error: error.message
      });
    }
  }
};
```

## Contoh Routes

```typescript
// services/finance-service/src/routes/chartOfAccounts.ts

import { Router } from 'express';
import { chartOfAccountsController } from '../controllers/chartOfAccountsController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateToken, chartOfAccountsController.getAll);
router.get('/:id', authenticateToken, chartOfAccountsController.getById);
router.post('/', authenticateToken, chartOfAccountsController.create);
router.put('/:id', authenticateToken, chartOfAccountsController.update);
router.delete('/:id', authenticateToken, chartOfAccountsController.delete);

export default router;
```

## CORS Configuration

```typescript
// services/finance-service/src/app.ts

import cors from 'cors';
import express from 'express';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Routes
import chartOfAccountsRoutes from './routes/chartOfAccounts';
app.use('/api/chart-of-accounts', chartOfAccountsRoutes);

export default app;
```

## Testing API

### Menggunakan cURL

```bash
# Get all accounts
curl http://localhost:3001/api/chart-of-accounts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create account
curl -X POST http://localhost:3001/api/chart-of-accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "account_code": "1000",
    "account_name": "Cash",
    "account_type": "Asset",
    "description": "Cash on hand"
  }'

# Update account
curl -X PUT http://localhost:3001/api/chart-of-accounts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "account_name": "Cash and Cash Equivalents"
  }'

# Delete account
curl -X DELETE http://localhost:3001/api/chart-of-accounts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Menggunakan Postman/Thunder Client

Import collection dari file `api-tests.json` atau buat request manual sesuai endpoint di atas.

## Troubleshooting

### CORS Issues
- Pastikan origin frontend sudah ditambahkan di CORS config
- Check bahwa credentials: true jika menggunakan cookies

### 401 Unauthorized
- Pastikan token valid
- Check middleware authentication
- Verify JWT_SECRET sama antara service

### 404 Not Found
- Verify route configuration
- Check base path di app.ts
- Pastikan service running di port yang benar

### Database Connection
- Check DATABASE_URL di .env
- Pastikan PostgreSQL running
- Verify credentials dan database name

## Next Steps

1. ✅ Setup database schema
2. ✅ Implement controller & routes
3. ✅ Configure CORS
4. ✅ Add authentication middleware
5. ✅ Test endpoints
6. ✅ Connect frontend
7. 🔄 Add validation
8. 🔄 Add error handling
9. 🔄 Add logging
10. 🔄 Add tests
