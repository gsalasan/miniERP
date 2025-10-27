# Finance Service & Frontend Integration Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- npm atau yarn package manager

## Step 1: Setup Database

Pastikan PostgreSQL sudah running dan buat database:
```sql
CREATE DATABASE minierp;
```

## Step 2: Setup Backend (Finance Service)

1. Navigate ke folder finance-service:
```bash
cd services/finance-service
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` file dengan credentials database Anda:
```
PORT=3001
DATABASE_URL="postgresql://username:password@localhost:5432/minierp"
JWT_SECRET="your-super-secret-jwt-key-change-this"
```

5. Generate Prisma Client:
```bash
npm run prisma:generate
```

6. Run backend:
```bash
npm run dev
```

Backend akan running di `http://localhost:3001`

Test backend:
```bash
curl http://localhost:3001
```

Response:
```json
{
  "success": true,
  "message": "Finance Service API is running 🚀"
}
```

## Step 3: Setup Frontend (Finance Frontend)

1. Navigate ke folder finance-frontend:
```bash
cd frontend/apps/finance-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

Pastikan isi `.env`:
```
VITE_API_BASE_URL=http://localhost:3001
```

4. Run frontend:
```bash
npm run dev
```

Frontend akan running di `http://localhost:5173` (atau port lain yang tersedia)

## Step 4: Testing Integration

### Method 1: Manual Testing via Browser

1. **Login dulu** (gunakan identity-service atau service lain untuk dapat token)
2. **Simpan token** ke browser localStorage:
```javascript
// Di browser console:
localStorage.setItem('token', 'your-jwt-token-here');
```

3. **Akses halaman COA** di frontend
4. **Test CRUD operations**:
   - Create: Klik "Tambah Akun Baru"
   - Read: Data muncul di tabel
   - Update: Klik "Edit" pada salah satu akun
   - Delete: Klik "Hapus" pada salah satu akun

### Method 2: Testing via API (Postman/Thunder Client)

#### 1. Get All Accounts
```bash
curl -X GET http://localhost:3001/api/chart-of-accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. Create Account
```bash
curl -X POST http://localhost:3001/api/chart-of-accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_code": "1000",
    "account_name": "Cash",
    "account_type": "Asset",
    "description": "Cash in hand"
  }'
```

#### 3. Update Account
```bash
curl -X PUT http://localhost:3001/api/chart-of-accounts/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "Cash Updated",
    "description": "Updated cash account"
  }'
```

#### 4. Delete Account
```bash
curl -X DELETE http://localhost:3001/api/chart-of-accounts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Backend Issues

#### 1. Error: Cannot find module '@prisma/client'
```bash
cd services/finance-service
npm run prisma:generate
```

#### 2. Error: Port 3001 already in use
Ubah PORT di `.env` atau kill process yang menggunakan port 3001:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill
```

#### 3. Database connection error
- Pastikan PostgreSQL running
- Cek credentials di DATABASE_URL
- Test koneksi ke database

### Frontend Issues

#### 1. CORS Error
Pastikan backend sudah setup CORS di `src/utils/app.ts`

#### 2. 401 Unauthorized
- Pastikan token JWT valid
- Cek apakah token tersimpan di localStorage
- Verify token tidak expired

#### 3. Network Error
- Pastikan backend running
- Cek VITE_API_BASE_URL di `.env`
- Test manual dengan curl

### Database Migration (if needed)

Jika struktur database ChartOfAccounts belum ada:

1. Cek schema di `prisma/schema.prisma`
2. Run migration:
```bash
cd services/finance-service
npx prisma migrate dev --name init
```

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│                 │  HTTP   │                  │  Prisma │              │
│  Finance        ├────────►│  Finance         ├────────►│  PostgreSQL  │
│  Frontend       │  REST   │  Service         │  ORM    │  Database    │
│  (React)        │◄────────┤  (Express)       │◄────────┤              │
│                 │  JSON   │                  │         │              │
└─────────────────┘         └──────────────────┘         └──────────────┘
     Port 5173                   Port 3001
```

## File Structure

```
miniERP/
├── frontend/apps/finance-frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── index.ts          # API Client
│   │   ├── config/
│   │   │   └── index.ts          # Config & Constants
│   │   ├── pages/
│   │   │   └── COA.tsx           # COA Page Component
│   │   └── ...
│   ├── .env                      # Frontend env vars
│   └── package.json
│
├── services/finance-service/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── chartofaccounts.controllers.ts
│   │   ├── routes/
│   │   │   └── chartofaccounts.route.ts
│   │   ├── middlewares/
│   │   │   └── auth.middlewares.ts
│   │   └── utils/
│   │       ├── app.ts            # Express app setup
│   │       ├── server.ts         # Server entry point
│   │       └── validation.utils.ts
│   ├── .env                      # Backend env vars
│   ├── package.json
│   └── API_DOCUMENTATION.md      # API docs
│
└── prisma/
    └── schema.prisma             # Database schema
```

## Next Steps

1. ✅ Backend API sudah lengkap dengan CRUD operations
2. ✅ Frontend sudah terintegrasi dengan backend
3. ✅ Authentication middleware sudah ada
4. ✅ Error handling sudah proper
5. ✅ CORS sudah di-setup

Anda bisa:
- Tambah validasi lebih kompleks
- Tambah pagination
- Tambah search/filter
- Tambah export to Excel/PDF
- Tambah audit log
- Tambah unit tests

## Support

Jika ada pertanyaan atau issue, silakan check:
- Backend API Documentation: `services/finance-service/API_DOCUMENTATION.md`
- Frontend README: `frontend/apps/finance-frontend/README_COA.md`
