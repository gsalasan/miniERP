# FITUR 3.3.A: Proses Handover & Perencanaan Awal Proyek

## Overview

Fitur ini mengimplementasikan proses handover dari tim Sales ke tim Operasional setelah Sales Order dibuat, termasuk penugasan Project Manager dan pembuatan Bill of Materials (BoM) dari Bill of Quantity (BoQ).

## Aktor

- **Operational Manager** (Irsyad/Fajar): Menugaskan PM
- **Project Manager (PM)**: Mengelola proyek, membuat BoM dari BoQ
- **Sales**: Melakukan handover ke operasional
- **Sistem**: Memicu event project.won otomatis

## Alur Kerja

### 1. Trigger Event (Otomatis)
Ketika Sales Order dibuat di CRM Service (Fitur 3.1.F):
- Status proyek berubah dari "PROPOSAL_DELIVERED" ke "WON"
- Event `project.won` dipicu
- CRM Service mengirim HTTP POST ke Project Service endpoint `/events/project-won`
- Notifikasi dikirim ke semua Operational Manager

### 2. Penugasan Project Manager
**Dilakukan oleh**: Operational Manager (Irsyad/Fajar)

1. Operational Manager membuka halaman `/projects/{projectId}`
2. Melihat status proyek "New" dan PM "Belum Ditugaskan"
3. Klik tombol "Tugaskan PM"
4. Modal terbuka dengan dropdown berisi daftar user dengan role `PROJECT_MANAGER`
5. Pilih PM dan klik "Konfirmasi"
6. Status proyek berubah menjadi "Planning"
7. Notifikasi dikirim ke PM yang ditugaskan

### 3. Membuat BoM dari BoQ
**Dilakukan oleh**: Project Manager yang ditugaskan

1. PM membuka halaman proyek dan masuk ke tab "BoQ vs. BoM"
2. Panel kiri menampilkan BoQ (read-only) dari estimasi PE
3. Panel kanan untuk BoM (editable), awalnya kosong
4. Klik "Salin dari BoQ" untuk menyalin semua item dari BoQ
5. Modifikasi BoM sesuai kebutuhan (edit kuantitas, hapus item, tambah item)
6. Klik "Simpan Rencana BoM"
7. Data BoM disimpan ke database

## Implementasi Backend

### Database Schema (Prisma)

#### Project Model
```prisma
model Project {
  id                  String             @id @default(uuid())
  project_name        String
  project_number      String             @unique
  customer_id         String
  contract_value      Decimal            @db.Decimal(18, 2)
  pm_user_id          String?            // BARU: Foreign key ke users
  sales_user_id       String?
  status              String             @default("PROSPECT") @db.VarChar(100)
  
  pm_user             users?             @relation("ProjectManager", fields: [pm_user_id], references: [id])
  sales_user          users?             @relation("SalesUser", fields: [sales_user_id], references: [id])
  project_boms        ProjectBOM[]
  // ... fields lainnya
}
```

#### Users Model (Updated)
```prisma
model users {
  id                    String        @id @default(uuid())
  email                 String        @unique
  roles                 UserRole[]    @default([EMPLOYEE])
  projects_as_pm        Project[]     @relation("ProjectManager")  // BARU
  projects_as_sales     Project[]     @relation("SalesUser")       // BARU
  // ... fields lainnya
}
```

### API Endpoints

#### 1. GET /api/v1/projects/{projectId}
**Service**: project-service  
**Port**: 4007  
**Auth**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_name": "Project ABC",
    "project_number": "PRJ-2025-001",
    "status": "New",
    "pm_user_id": null,
    "sales_user_id": "uuid",
    "customer": { ... },
    "estimations": [...],
    "project_boms": []
  }
}
```

#### 2. PUT /api/v1/projects/{projectId}/assign-pm
**Service**: project-service  
**Auth**: Required (OPERATIONAL_MANAGER or CEO only)

**Request Body**:
```json
{
  "pmUserId": "uuid-of-pm"
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* updated project */ },
  "message": "Project Manager assigned successfully"
}
```

**Logika**:
1. Validasi user memiliki role OPERATIONAL_MANAGER atau CEO
2. Validasi PM user exists dan memiliki role PROJECT_MANAGER
3. Update `pm_user_id` di tabel projects
4. Update status proyek menjadi "Planning"
5. Buat activity log
6. Kirim notifikasi ke PM

#### 3. POST /api/v1/projects/{projectId}/bom
**Service**: project-service  
**Auth**: Required (PM yang ditugaskan only)

**Request Body**:
```json
{
  "items": [
    {
      "itemId": "uuid-material-or-service",
      "itemType": "MATERIAL",
      "quantity": 10.5
    },
    ...
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": [ /* created BoM items */ ],
  "message": "BoM saved successfully"
}
```

**Logika**:
1. Validasi user adalah PM yang ditugaskan untuk proyek ini
2. Dalam transaksi database:
   - Hapus semua BoM lama untuk proyek ini
   - Insert BoM items baru
3. Buat activity log

#### 4. GET /api/v1/projects/project-managers
**Service**: project-service  
**Auth**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "pm@example.com",
      "employee": {
        "full_name": "John Doe",
        "position": "Senior Project Manager"
      }
    }
  ]
}
```

#### 5. POST /events/project-won
**Service**: project-service  
**Auth**: None (internal service call)

**Request Body**:
```json
{
  "projectId": "uuid",
  "projectName": "Project ABC",
  "salesOrderId": "uuid",
  "soNumber": "SO-202511-00001"
}
```

**Logika**:
1. Update project status menjadi "New"
2. Buat activity log
3. Query semua user dengan role OPERATIONAL_MANAGER
4. Kirim notifikasi ke semua operational managers

## Implementasi Frontend

### Struktur File
```
frontend/apps/crm-frontend/src/
├── api/
│   └── projectApi.ts                    # API client untuk project service
├── pages/
│   └── projects/
│       ├── ProjectDetailPage.tsx        # Halaman detail proyek
│       └── components/
│           ├── AssignPmModal.tsx        # Modal penugasan PM
│           └── BoqVsBom.tsx            # Komponen BoQ vs BoM
└── router/
    └── index.tsx                        # Route: /projects/:projectId
```

### Komponen Utama

#### ProjectDetailPage.tsx
Halaman utama dengan struktur:
- **Header**: Nomor proyek, nama, status chips
- **Info Panel**: Sales PIC, PM (dengan tombol assign jika belum ada)
- **Tabs**:
  1. Ringkasan
  2. Timeline & Tugas (placeholder)
  3. **BoQ vs. BoM** (implemented)
  4. Dokumen (placeholder)
  5. Laporan (placeholder)
  6. Tim & Kinerja (placeholder)

#### AssignPmModal.tsx
Modal dialog untuk menugaskan PM:
- Dropdown dengan avatar dan nama PM
- Loading state saat fetch PM list
- Error handling
- Submit dengan konfirmasi

#### BoqVsBom.tsx
Komponen dua panel:
- **Panel Kiri**: DataGrid read-only untuk BoQ dari estimasi
- **Panel Kanan**: 
  - State kosong: Tombol "Salin dari BoQ" dan "Tambah Item Manual"
  - State terisi: DataGrid editable dengan tombol "Simpan Rencana BoM"

### Environment Variables
```bash
# frontend/.env
VITE_PROJECT_SERVICE_URL=http://localhost:4007
```

## Instalasi & Setup

### 1. Database Migration
```bash
cd miniERP
npx prisma migrate dev --name add_project_pm_field
```

### 2. Install Dependencies (Project Service)
```bash
cd services/project-service
npm install
```

### 3. Configure Environment
```bash
# services/project-service/.env
PROJECT_SERVICE_PORT=4007
DATABASE_URL="postgresql://user:password@localhost:5432/minierp"
JWT_SECRET="same-as-other-services"
NODE_ENV=development
```

```bash
# services/crm-service/.env
PROJECT_SERVICE_URL=http://localhost:4007
```

### 4. Start Services
```bash
# Terminal 1: Project Service
cd services/project-service
npm run dev

# Terminal 2: CRM Service (jika belum running)
cd services/crm-service
npm run dev

# Terminal 3: Frontend
cd frontend/apps/crm-frontend
npm run dev
```

## Testing

### Test Flow Lengkap:

1. **Login sebagai Sales**
   - Buat quotation dan dapatkan approval
   - Buat Sales Order
   - Verifikasi project status berubah ke "WON"

2. **Login sebagai Operational Manager**
   - Cek notifikasi bahwa ada proyek baru
   - Buka `/projects/{projectId}`
   - Verifikasi status "New"
   - Klik "Tugaskan PM"
   - Pilih PM dari dropdown
   - Submit

3. **Login sebagai PM yang ditugaskan**
   - Cek notifikasi penugasan
   - Buka `/projects/{projectId}`
   - Buka tab "BoQ vs. BoM"
   - Klik "Salin dari BoQ"
   - Edit beberapa kuantitas
   - Klik "Simpan Rencana BoM"
   - Verifikasi data tersimpan

### Test API dengan cURL:

```bash
# Get project detail
curl -X GET http://localhost:4007/api/v1/projects/{projectId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Assign PM
curl -X PUT http://localhost:4007/api/v1/projects/{projectId}/assign-pm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pmUserId":"uuid-of-pm"}'

# Save BoM
curl -X POST http://localhost:4007/api/v1/projects/{projectId}/bom \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"itemId":"uuid","itemType":"MATERIAL","quantity":10}]}'
```

## Status & Transition

### Project Status Flow:
```
PROSPECT → QUALIFICATION → PROPOSAL → PROPOSAL_DELIVERED 
→ WON (setelah SO dibuat) 
→ New (otomatis oleh event listener)
→ Planning (setelah PM ditugaskan)
→ ... (status lanjutan)
```

## Notes & Limitations

1. **Event System**: Saat ini menggunakan HTTP POST langsung. Untuk production, sebaiknya gunakan message queue (RabbitMQ, Kafka, dll)

2. **Notification Service**: Masih placeholder (console.log). Perlu implementasi actual notification service dengan WebSocket/SSE

3. **Authorization**: Frontend belum check role user secara detail. Hanya backend yang enforce permission

4. **BoM Editing**: DataGrid MUI X memiliki keterbatasan dalam editing. Untuk editing yang lebih kompleks, pertimbangkan form manual

5. **File Upload**: Tab Dokumen belum diimplementasi

6. **Timeline**: Tab Timeline & Tugas placeholder, perlu implementasi dengan Gantt chart atau timeline component

## Future Enhancements

- [ ] Implement message queue untuk event system
- [ ] Real-time notifications dengan WebSocket
- [ ] Rich BoM editor dengan drag-drop dan bulk operations
- [ ] Project timeline dengan dependencies
- [ ] Document management dengan GCS integration
- [ ] Project performance metrics dan reporting
- [ ] Team assignment dan workload balancing

## Troubleshooting

### Project Service tidak menerima event
- Pastikan PROJECT_SERVICE_URL di CRM service sudah benar
- Check logs di CRM service untuk error
- Verify project-service sedang running di port 4007

### PM tidak muncul di dropdown
- Pastikan user memiliki role PROJECT_MANAGER di database
- Check query di getProjectManagers() method
- Verify JWT token valid

### BoM tidak tersimpan
- Check browser console untuk error
- Verify PM yang login adalah PM yang ditugaskan di proyek
- Check database transaction logs

## Contact & Support

Untuk pertanyaan atau issue, hubungi:
- Backend: Project Service team
- Frontend: CRM Frontend team
- Database: DBA team
