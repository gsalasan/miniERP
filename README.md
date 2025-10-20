# miniERP

Repositori miniERP — panduan singkat untuk menjalankan proyek ini secara lokal.

## 🚀 Quick Start

```bash
# 1. Clone dan install dependencies
git clone <url-repo>
cd miniERP
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# 3. Start development
npm run dev:frontend    # Start semua frontend apps
npm run dev:identity    # Start identity service

# 4. Code quality (opsional)
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

## Scripts yang Tersedia

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
npm run dev:frontend        # Start frontend apps
npm run dev:identity        # Start identity service

# Code Quality
npm run lint                # Lint dan fix
npm run format              # Format code
npm run type-check          # Check TypeScript

# Build
npm run build:frontend      # Build frontend
npm run build:services      # Build services
```

### **File Locations**
- **ESLint**: `eslint.config.js` (root)
- **Prettier**: `.prettierrc` (root)
- **TypeScript**: `tsconfig.json` (root + per app)
- **Frontend apps**: `frontend/apps/*/`
- **Backend services**: `services/*/`
- **Database**: `prisma/schema.prisma`

### **Common Issues & Solutions**
- **Linting errors**: `npm run lint`
- **Format issues**: `npm run format`
- **Type errors**: `npm run type-check`
- **Dependency issues**: `npm run install:all`
- **Port conflicts**: Check running processes

## Lisensi
Sesuaikan dengan lisensi proyek (mis. MIT) atau tambahkan file LICENSE.


