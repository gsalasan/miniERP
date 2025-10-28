# miniERP

Repositori miniERP — panduan lengkap untuk menjalankan proyek ini secara lokal dengan npm.

## 🚀 Quick Start

### **Prerequisites**
- Node.js v18+ 
- npm v8+
- Docker (untuk database PostgreSQL)
- Git

### **1. Clone dan Setup**
```bash
# Clone repositori
git clone <url-repo>
cd miniERP

# Install semua dependencies
npm run install:all
```

### **2. Database Setup**
```bash
# Start PostgreSQL dengan Docker
docker run --name minierp-postgres \
  -e POSTGRES_PASSWORD=anisa252502 \
  -e POSTGRES_DB=minierp_unais \
  -p 5432:5432 \
  -d postgres:15

# Setup database schema
npx prisma migrate dev
npx prisma generate
```

### **3. Environment Configuration**
```bash
# File .env sudah tersedia dengan konfigurasi:
DATABASE_URL="postgresql://postgres:anisa252502@localhost:5432/minierp_unais?schema=public"
JWT_SECRET=minierpsecret
PORT=3001
```

### **4. Start Development**
```bash
# Terminal 1: Start Identity Service
npm run dev:identity

# Terminal 2: Start Main Frontend (Login Page)
cd frontend/apps/main-frontend
npm run dev
```

**⚠️ Important Note:** 
- Use `cd frontend/apps/main-frontend && npm run dev` to start the login page
- The `npm run dev:frontend` command starts other frontend apps, not the main login page

### **5. Access Applications**
- **Main Frontend (Login)**: http://localhost:3000
- **Identity Service API**: http://localhost:3001
- **Test Login Credentials**:
  - Email: `admin@minierp.com`
  - Password: `admin123`

### **6. Code Quality (Opsional)**
```bash
npm run lint            # Lint dan fix code
npm run format          # Format code
npm run type-check      # Check TypeScript errors
```

## Aturan Kontribusi

1. **Selalu lakukan `git pull` dari branch `main` sebelum mulai bekerja**  
   Pastikan branch lokal kamu sudah update dengan perubahan terbaru dari `main`.

2. **Buat branch baru sesuai ticket**  
   Format nama branch: `namabranch[MIN-12]`  
   Contoh: `fitur-auth[MIN-12]`

3. **Commit perubahan secara teratur**  
   Gunakan pesan commit yang jelas dan deskriptif.

4. **Push branch ke remote**  
   Setelah commit, lakukan `git push` ke branch yang sudah dibuat.

5. **Buat Pull Request (PR) ke branch `main`**  
   Sertakan deskripsi singkat tentang perubahan dan referensi ticket (misal: MIN-12).

6. **Tunggu review dan approval sebelum merge**  
   Jangan merge PR sendiri tanpa persetujuan reviewer.


## 🛠️ Teknologi yang Digunakan

### **Frontend**
- **React 18** dengan TypeScript
- **Vite** untuk build tool
- **Material-UI (MUI)** untuk UI components
- **Tailwind CSS** untuk styling
- **React Router** untuk routing
- **Framer Motion** untuk animasi

### **Backend**
- **Node.js** dengan TypeScript
- **Express.js** untuk web framework
- **Prisma** untuk ORM dan database management
- **JWT** untuk authentication
- **CORS** untuk cross-origin requests

### **Development Tools**
- **ESLint** untuk code linting
- **Prettier** untuk code formatting
- **TypeScript** untuk type safety
- **npm workspaces** untuk monorepo management
- **Docker** untuk containerization

### **Database**
- **PostgreSQL** (primary database)
- **Prisma Migrate** untuk database migrations

## Persyaratan
- Node.js (disarankan v18+)
- npm atau yarn
- Database (Postgres/MySQL) atau gunakan Docker untuk lingkungan yang sudah dikemas
- Git

## Struktur Proyek

Proyek ini menggunakan **monorepo** dengan struktur sebagai berikut:

```
miniERP/
├── frontend/                    # Frontend applications
│   ├── apps/                   # Individual frontend apps
│   │   ├── main-frontend/      # Portal utama
│   │   ├── crm-frontend/       # CRM module
│   │   ├── hr-frontend/        # HR module
│   │   ├── finance-frontend/   # Finance module
│   │   ├── project-frontend/   # Project module
│   │   ├── procurement-frontend/ # Procurement module
│   │   ├── engineering-frontend/ # Engineering module
│   │   └── identity-frontend/  # Identity module
│   └── shared/                 # Shared components & configs
├── services/                   # Backend services
│   ├── identity-service/       # Authentication service
│   ├── crm-service/           # CRM service
│   ├── hr-service/            # HR service
│   ├── finance-service/       # Finance service
│   ├── project-service/       # Project service
│   ├── procurement-service/   # Procurement service
│   ├── engineering-service/   # Engineering service
│   └── inventory-service/     # Inventory service
├── gateway/                   # API Gateway (Nginx)
└── prisma/                    # Database schema & migrations
```

## Instalasi & Konfigurasi

### **1. Clone dan Setup**
```bash
# Clone repositori
git clone <url-repo>
cd miniERP

# Install dependencies
npm install
```

### **2. Environment Configuration**
```bash
# Salin file konfigurasi lingkungan
cp .env.example .env

# Edit .env sesuai kebutuhan
nano .env  # atau editor favorit Anda
```

### **3. Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Opsional) Seed database
npx prisma db seed
```

### **4. Development Setup**
```bash
# Install semua dependencies
npm run install:all

# Check code quality
npm run lint
npm run format
npm run type-check
```

### **5. Start Development**
```bash
# Start frontend apps
npm run dev:frontend

# Start identity service (di terminal terpisah)
npm run dev:identity
```

### **6. Verify Setup**
```bash
# Check semua services berjalan
npm run lint:check
npm run format:check
npm run type-check
```

### **7. Development Workflow**
```bash
# Sebelum mulai coding
git pull origin main
npm run install:all

# Selama coding
npm run dev:frontend    # Terminal 1
npm run dev:identity    # Terminal 2

# Sebelum commit
npm run lint
npm run format
npm run type-check
```

### **8. Troubleshooting Setup**
```bash
# Jika ada masalah dengan dependencies
rm -rf node_modules package-lock.json
npm install
npm run install:all

# Jika ada masalah dengan linting
npm run lint
npm run format

# Jika ada masalah dengan TypeScript
npm run type-check
```

Contoh `.env` minimal:
```
PORT=3000
NODE_ENV=development
# Database (atau DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=mini_erp
# Token/JWT
JWT_SECRET=change_this_secret
```

> Catatan: Periksa file `package.json` untuk script yang tersedia (mis. dev, start, migrate, seed, test). Sesuaikan perintah migrasi/seeding dengan stack proyek (Prisma, TypeORM, Sequelize, dll).

## Instal dependensi
- npm:
  - npm install
- yarn:
  - yarn install

## 📋 NPM Commands Guide

### **Root Level Scripts**
```bash
# Development
npm run dev:frontend        # Start semua frontend apps
npm run dev:identity        # Start identity service

# Build
npm run build:frontend      # Build semua frontend apps
npm run build:services      # Build semua backend services

# Code Quality
npm run lint                # Lint semua workspace
npm run lint:fix            # Lint dan fix semua workspace
npm run format              # Format semua code
npm run format:check        # Check formatting
npm run type-check          # Type check semua workspace

# Utilities
npm run install:all         # Install dependencies untuk semua workspace
```

### **Database Commands**
```bash
# Prisma Commands
npx prisma migrate dev      # Run database migrations
npx prisma generate         # Generate Prisma client
npx prisma studio           # Open Prisma Studio (database GUI)
npx prisma db seed          # Seed database with sample data

# Docker Database Commands
docker start minierp-postgres    # Start database
docker stop minierp-postgres     # Stop database
docker restart minierp-postgres  # Restart database
docker logs minierp-postgres     # View database logs
```

### **Individual App/Service Commands**
```bash
# Frontend Apps (dalam folder frontend/apps/*)
cd frontend/apps/main-frontend
npm run dev                 # Start development server
npm run build               # Build untuk production
npm run preview             # Preview production build

# Backend Services (dalam folder services/*)
cd services/identity-service
npm run dev                 # Start development server
npm run build               # Build untuk production
npm run start               # Start production server
```

### **Development Workflow Commands**
```bash
# Setup baru
git clone <repo-url>
cd miniERP
npm run install:all
docker run --name minierp-postgres -e POSTGRES_PASSWORD=anisa252502 -e POSTGRES_DB=minierp_unais -p 5432:5432 -d postgres:15
npx prisma migrate dev
npx prisma generate

# Daily development (CORRECT WAY)
npm run dev:identity        # Terminal 1: Start identity service
cd frontend/apps/main-frontend && npm run dev  # Terminal 2: Start login page

# Before committing
npm run lint
npm run format
npm run type-check
git add .
git commit -m "feat: your message"
```

### **⚠️ Important: Correct Startup Sequence**
```bash
# ❌ WRONG - This starts other frontend apps, not the login page
npm run dev:frontend

# ✅ CORRECT - This starts the main frontend with login page
cd frontend/apps/main-frontend
npm run dev

# Expected result:
# - Main Frontend: http://localhost:3000 (Login page)
# - Identity Service: http://localhost:3001 (API)
```

### **Stop Services Commands**
```bash
# Stop all development servers
pkill -f "ts-node.*server.ts"    # Stop identity service
pkill -f "vite"                  # Stop frontend apps
pkill -f "npm.*dev"              # Stop npm dev processes

# Stop specific ports
lsof -ti:3000,3001,5173 | xargs kill -9 2>/dev/null || true

# Stop database
docker stop minierp-postgres

# Check what's running
ps aux | grep -E "(ts-node|vite|npm.*dev)" | grep -v grep
lsof -i :3000,3001,5432
```

### **Troubleshooting Commands**
```bash
# Fix dependency issues
rm -rf node_modules package-lock.json
npm run install:all

# Fix database issues
docker restart minierp-postgres
npx prisma migrate reset
npx prisma migrate dev

# Fix code quality issues
npm run lint
npm run format
npm run type-check

# Check running processes
lsof -i :3000,3001,5432
ps aux | grep -E "(ts-node|vite|postgres)"
```

### **Per App/Service Scripts**
Setiap app dan service memiliki scripts berikut:
```bash
# Development
npm run dev                 # Start development server

# Build
npm run build               # Build untuk production
npm run start               # Start production server

# Code Quality
npm run lint                # Lint dan fix
npm run lint:check          # Check linting
npm run format              # Format code
npm run format:check        # Check formatting
npm run type-check          # Type check

# Database (untuk services)
npm run prisma:migrate      # Run database migrations
```

## Menjalankan aplikasi (pengembangan)

### **Frontend Apps**
```bash
# Start semua frontend apps
npm run dev:frontend

# Atau start individual app
cd frontend/apps/main-frontend
npm run dev
```

### **Backend Services**
```bash
# Start identity service
npm run dev:identity

# Atau start individual service
cd services/identity-service
npm run dev
```

Server biasanya tersedia di: http://localhost:3000 (atau PORT di .env)

## Migrate & Seed (contoh umum)
- Jalankan migrasi:
  - npm run migrate
- Jalankan seed:
  - npm run seed

Jika proyek menggunakan tool lain, gunakan perintah sesuai dokumentasi tool tersebut.

## Menjalankan produksi / build
- npm run build
- npm start

## Menggunakan Docker (opsional)
Jika ada Dockerfile/docker-compose.yml:
- docker-compose up --build

## Testing & Linting

### Code Quality Tools
Proyek ini menggunakan ESLint, Prettier, dan TypeScript untuk menjaga kualitas kode:

#### **ESLint** - Code Linting
- **Konfigurasi**: `eslint.config.js` (root level)
- **Scripts**:
  ```bash
  npm run lint              # Lint dan fix semua workspace
  npm run lint:check        # Check linting tanpa fix
  ```
- **Per app/service**:
  ```bash
  npm run lint              # Lint dan fix
  npm run lint:check        # Check linting
  ```

#### **Prettier** - Code Formatting
- **Konfigurasi**: `.prettierrc` (root level)
- **Scripts**:
  ```bash
  npm run format            # Format semua code
  npm run format:check      # Check formatting
  ```
- **Per app/service**:
  ```bash
  npm run format            # Format code
  npm run format:check      # Check formatting
  ```

#### **TypeScript** - Type Checking
- **Konfigurasi**: `tsconfig.json` (root level + per app/service)
- **Scripts**:
  ```bash
  npm run type-check        # Type check semua workspace
  ```
- **Per app/service**:
  ```bash
  npm run type-check        # Type check
  ```

### Development Workflow

#### **Sebelum Memulai Development**
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install/update dependencies
npm run install:all

# 3. Check code quality
npm run lint
npm run format
npm run type-check
```

#### **Selama Development**
```bash
# Start development servers
npm run dev:frontend    # Frontend apps
npm run dev:identity    # Identity service

# Check code quality secara berkala
npm run lint:check      # Check linting tanpa fix
npm run format:check    # Check formatting
npm run type-check      # Check TypeScript errors
```

#### **Sebelum Commit**
```bash
# 1. Fix linting issues
npm run lint

# 2. Format code
npm run format

# 3. Check TypeScript errors
npm run type-check

# 4. Commit changes
git add .
git commit -m "feat: your commit message"
```

#### **Best Practices**
- **Commit sering**: Buat commit kecil dan sering
- **Descriptive messages**: Gunakan conventional commits (feat:, fix:, docs:, etc.)
- **Test sebelum commit**: Pastikan tidak ada linting atau type errors
- **Branch naming**: Gunakan format `feature/description` atau `fix/description`

### Testing
- Jalankan test:
  - npm test

## Konfigurasi Code Quality

### **ESLint Configuration**
- **File**: `eslint.config.js` (root level)
- **Features**: 
  - TypeScript support
  - React support untuk frontend apps
  - Node.js support untuk backend services
  - Prettier integration
  - Auto-fix capabilities

### **Prettier Configuration**
- **File**: `.prettierrc` (root level)
- **Features**:
  - Consistent code formatting
  - Single quotes
  - Semicolons
  - 2-space indentation
  - 80 character line width

### **TypeScript Configuration**
- **Root**: `tsconfig.json` (untuk backend services)
- **Frontend**: Individual `tsconfig.json` per app
- **Features**:
  - Strict type checking
  - Modern ES modules
  - Path mapping untuk imports
  - React JSX support

### **Monorepo Management**
- **npm workspaces** untuk dependency management
- **Shared configurations** untuk konsistensi
- **Individual package.json** per app/service
- **Root-level scripts** untuk operasi batch

## Troubleshooting

### **Code Quality Issues**
- **Linting errors**: Jalankan `npm run lint` untuk auto-fix
- **Formatting issues**: Jalankan `npm run format` untuk format code
- **Type errors**: Jalankan `npm run type-check` untuk check TypeScript errors
- **ESLint config issues**: Pastikan `eslint.config.js` ada di root directory
- **Prettier conflicts**: Hapus `.prettierrc.js` di individual apps, gunakan root `.prettierrc`

### **Dependency Issues**
- **npm install fails**: Jalankan `npm run install:all` untuk install semua dependencies
- **Version conflicts**: Periksa `package.json` untuk version conflicts
- **Workspace issues**: Pastikan `workspaces` configuration benar di root `package.json`

### **Development Server Issues**
- **Port conflicts**: Pastikan port tidak digunakan aplikasi lain
- **Frontend tidak start**: Periksa `vite.config.ts` dan dependencies
- **Backend tidak start**: Periksa `tsconfig.json` dan TypeScript errors
- **Database connection**: Periksa `.env` variables dan database status

### **Build Issues**
- **TypeScript errors**: Jalankan `npm run type-check` untuk identify errors
- **Build fails**: Periksa `tsconfig.json` dan dependencies
- **Missing files**: Pastikan semua source files ada dan tidak di-ignore

### **General Issues**
- Periksa variable .env jika koneksi DB gagal.
- Periksa log terminal untuk pesan error saat start/migrate.
- Pastikan port tidak bentrok dengan aplikasi lain.
- Pastikan semua dependencies terinstall dengan `npm run install:all`
- Restart development server jika ada perubahan konfigurasi

## Kontribusi
Buat branch baru untuk fitur/perbaikan dan ajukan pull request. Sertakan deskripsi singkat dan langkah reproduce bila relevan.

## 📋 Konfigurasi yang Telah Dibuat

### **ESLint, Prettier, TypeScript Setup**
Proyek ini telah dikonfigurasi dengan tools berikut untuk menjaga kualitas kode:

#### **ESLint Configuration**
- ✅ Root level `eslint.config.js` dengan ESLint v9 flat config
- ✅ TypeScript support dengan `@typescript-eslint`
- ✅ React support untuk frontend apps
- ✅ Node.js support untuk backend services
- ✅ Prettier integration
- ✅ Auto-fix capabilities

#### **Prettier Configuration**
- ✅ Root level `.prettierrc` dengan konsisten formatting
- ✅ Single quotes, semicolons, 2-space indentation
- ✅ 80 character line width
- ✅ JSX support

#### **TypeScript Configuration**
- ✅ Root `tsconfig.json` untuk backend services
- ✅ Individual `tsconfig.json` per frontend app
- ✅ Strict type checking
- ✅ Modern ES modules support
- ✅ Path mapping untuk clean imports

#### **Monorepo Management**
- ✅ npm workspaces configuration
- ✅ Root-level scripts untuk batch operations
- ✅ Individual package.json per app/service
- ✅ Shared dependencies management

### **Scripts yang Tersedia**
- ✅ `npm run lint` - Lint dan fix semua workspace
- ✅ `npm run format` - Format semua code
- ✅ `npm run type-check` - Type check semua workspace
- ✅ `npm run dev:frontend` - Start semua frontend apps
- ✅ `npm run dev:identity` - Start identity service
- ✅ `npm run build:frontend` - Build semua frontend apps
- ✅ `npm run build:services` - Build semua backend services

## 📚 Quick Reference

### **Most Used Commands**
```bash
# Development
cd frontend/apps/main-frontend && npm run dev  # Start main frontend (login page)
npm run dev:identity        # Start identity service

# Code Quality
npm run lint                # Lint dan fix
npm run format              # Format code
npm run type-check          # Check TypeScript

# Build
npm run build:frontend      # Build frontend
npm run build:services      # Build services

# Database
npx prisma migrate dev      # Run migrations
npx prisma generate         # Generate client
```

### **Access URLs**
- **Main Frontend**: http://localhost:3000
- **Identity API**: http://localhost:3001
- **Database**: localhost:5432

### **Test Credentials**
- **Email**: `admin@minierp.com`
- **Password**: `admin123`

### **File Locations**
- **ESLint**: `eslint.config.js` (root)
- **Prettier**: `.prettierrc` (root)
- **TypeScript**: `tsconfig.json` (root + per app)
- **Frontend apps**: `frontend/apps/*/`
- **Backend services**: `services/*/`
- **Database**: `prisma/schema.prisma`
- **Environment**: `.env`

### **Common Issues & Solutions**
- **Linting errors**: `npm run lint`
- **Format issues**: `npm run format`
- **Type errors**: `npm run type-check`
- **Dependency issues**: `npm run install:all`
- **Port conflicts**: `lsof -i :3000,3001,5432`
- **Database issues**: `docker restart minierp-postgres`
- **Service not starting**: Check logs with `DEBUG=* npm run dev:identity`
- **Login page not found**: Use `cd frontend/apps/main-frontend && npm run dev` (not `npm run dev:frontend`)
- **Wrong port (3010 instead of 3000)**: Stop current process and start main-frontend specifically

## Lisensi
Sesuaikan dengan lisensi proyek (mis. MIT) atau tambahkan file LICENSE.


