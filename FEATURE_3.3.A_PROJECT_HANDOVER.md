# FITUR 3.3.A: Proses Handover & Perencanaan Awal Proyek

## 📋 Gambaran Umum

Fitur ini mengimplementasikan proses handover proyek dari CRM ke Project Management setelah proyek WON, termasuk penugasan Project Manager dan pembuatan Bill of Materials (BoM) dari estimasi.

## 🎯 Fitur Utama

### 1. **Penugasan Project Manager**
- Operational Manager atau CEO dapat menugaskan PM ke proyek baru
- PM menerima notifikasi setelah ditugaskan
- Status proyek otomatis berubah dari "New" ke "Planning"

### 2. **Bill of Materials (BoM) Management**
- Lihat BoQ (Bill of Quantity) dari estimasi (read-only)
- Buat BoM dengan menyalin dari BoQ atau menambah manual
- Edit quantity dan hapus item
- Hanya PM yang ditugaskan yang bisa edit BoM

## 🚀 Cara Menggunakan

### A. Penugasan Project Manager

1. **Akses Project Workspace**
   - Buka: `http://localhost:3016/projects/{projectId}`
   - Login sebagai Operational Manager atau CEO

2. **Tugaskan PM**
   - Klik tombol **"Tugaskan PM"** di header
   - Pilih Project Manager dari dropdown
   - Klik **"Konfirmasi"**

3. **Verifikasi**
   - Status proyek berubah ke "Planning"
   - PM ditampilkan di header
   - PM menerima notifikasi (lihat console log)

### B. Pembuatan Bill of Materials (BoM)

1. **Akses Tab BoQ vs BoM**
   - Login sebagai PM yang ditugaskan
   - Buka project workspace
   - Klik tab **"BoQ vs. BoM"**

2. **Lihat BoQ**
   - Panel kiri menampilkan BoQ dari estimasi (read-only)
   - Berisi data material/service, quantity, dan HPP

3. **Buat BoM**
   
   **Opsi 1: Salin dari BoQ**
   - Klik tombol **"Salin BoQ"**
   - Semua item BoQ otomatis disalin ke BoM
   
   **Opsi 2: Tambah Manual**
   - Klik tombol **"Tambah"**
   - Edit item_id, item_type, dan quantity
   - Ulangi untuk item lainnya

4. **Edit BoM**
   - Double-click cell untuk edit
   - Ubah quantity sesuai kebutuhan
   - Klik icon 🗑️ untuk hapus item

5. **Simpan**
   - Klik tombol **"Simpan BoM"**
   - Verifikasi success message

## 📡 API Endpoints

### 1. Get Project Detail
```http
GET /api/v1/projects/{projectId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_number": "PRJ-2024-001",
    "project_name": "Instalasi Sistem CCTV",
    "status": "New",
    "pm_user_id": null,
    "customer": { ... },
    "estimations": [ ... ],
    "project_boms": [ ... ]
  }
}
```

### 2. Assign Project Manager
```http
PUT /api/v1/projects/{projectId}/assign-pm
Authorization: Bearer {token}
Content-Type: application/json

{
  "pmUserId": "uuid-pm"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Planning",
    "pm_user_id": "uuid-pm",
    "pm_user": { ... }
  },
  "message": "Project Manager assigned successfully"
}
```

### 3. Create/Update BoM
```http
POST /api/v1/projects/{projectId}/bom
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "itemId": "material-001",
      "itemType": "MATERIAL",
      "quantity": 10
    },
    {
      "itemId": "service-002",
      "itemType": "SERVICE",
      "quantity": 5
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "message": "BoM saved successfully"
}
```

### 4. Get Project Managers List
```http
GET /api/v1/projects/project-managers
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "pm@example.com",
      "roles": ["PROJECT_MANAGER"],
      "employee": {
        "full_name": "John Doe",
        "position": "Senior PM"
      }
    }
  ]
}
```

## 🔒 Permissions

### Assign PM
- ✅ CEO
- ✅ OPERATIONAL_MANAGER
- ❌ Lainnya

### Edit BoM
- ✅ PM yang ditugaskan pada proyek
- ❌ Lainnya (view only)

## 🗂️ File Structure

### Backend (Project Service)
```
services/project-service/src/
├── routes/
│   └── projectRoutes.ts          # Route definitions
├── controllers/
│   └── projectController.ts      # Request handlers
├── services/
│   └── projectService.ts         # Business logic
├── middlewares/
│   └── authMiddleware.ts         # Auth & authorization
└── utils/
    ├── prisma.ts                 # Prisma client
    └── notifications.ts          # Notification service
```

### Frontend (Project Frontend)
```
frontend/apps/project-frontend/src/
├── pages/
│   ├── ProjectsListPage.tsx      # List all projects
│   └── ProjectDetailPage.tsx     # Project workspace (main page)
├── components/
│   ├── AssignPmModal.tsx         # PM assignment modal
│   ├── BoqVsBomTab.tsx           # BoQ vs BoM tab
│   └── ProjectOverviewTab.tsx    # Overview tab
├── api/
│   └── projectApi.ts             # API client
├── contexts/
│   └── AuthContext.tsx           # Auth & permissions
└── types/
    └── index.ts                  # TypeScript types
```

## 🧪 Testing

### Manual Testing Steps

1. **Test Assign PM**
   ```bash
   # Login as Operational Manager
   # Navigate to project detail
   # Click "Tugaskan PM"
   # Select a PM
   # Verify status changes to "Planning"
   # Verify PM appears in header
   ```

2. **Test BoM Creation**
   ```bash
   # Login as assigned PM
   # Open BoQ vs BoM tab
   # Click "Salin BoQ"
   # Verify items copied
   # Edit quantity
   # Click "Simpan BoM"
   # Verify success message
   ```

3. **Test Permissions**
   ```bash
   # Login as Sales (not PM)
   # Try to edit BoM
   # Verify "View Only" message
   # Verify edit buttons disabled
   ```

### API Testing (Postman/curl)

```bash
# 1. Get project detail
curl -X GET http://localhost:4007/api/v1/projects/{projectId} \
  -H "Authorization: Bearer {token}"

# 2. Assign PM
curl -X PUT http://localhost:4007/api/v1/projects/{projectId}/assign-pm \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"pmUserId": "uuid-pm"}'

# 3. Create BoM
curl -X POST http://localhost:4007/api/v1/projects/{projectId}/bom \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"itemId": "mat-001", "itemType": "MATERIAL", "quantity": 10}]}'
```

## 📊 Database Schema

### projects Table
```sql
id                  UUID PRIMARY KEY
project_number      VARCHAR UNIQUE
project_name        VARCHAR
customer_id         UUID
contract_value      DECIMAL
pm_user_id          UUID (FK to users)
sales_user_id       UUID (FK to users)
status              VARCHAR
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### project_boms Table
```sql
id          UUID PRIMARY KEY
project_id  UUID (FK to projects)
item_id     VARCHAR
item_type   ENUM('MATERIAL', 'SERVICE')
quantity    DECIMAL
```

### estimations & estimation_items Tables
```sql
-- estimations
id              UUID PRIMARY KEY
project_id      UUID (FK to projects)
version         INTEGER
status          VARCHAR
total_hpp       DECIMAL

-- estimation_items
id                       UUID PRIMARY KEY
estimation_id            UUID (FK to estimations)
item_id                  VARCHAR
item_type                ENUM('MATERIAL', 'SERVICE')
quantity                 DECIMAL
hpp_at_estimation        DECIMAL
sell_price_at_estimation DECIMAL
```

## 🔧 Configuration

### Environment Variables (project-service/.env)
```env
DATABASE_URL="postgresql://user:pass@host:5432/minierp"
JWT_SECRET="your-secret-key"
PORT=4007
NODE_ENV=development
```

### Environment Variables (project-frontend/.env)
```env
VITE_PROJECT_SERVICE_URL=http://localhost:4007
VITE_IDENTITY_SERVICE_URL=http://localhost:4001
```

## 🐛 Troubleshooting

### "Unauthorized" Error
- Pastikan token valid di localStorage
- Cek cross_app_token dari main dashboard
- Verify JWT_SECRET sama di semua services

### "Forbidden: Only PM can modify BoM"
- Pastikan user login adalah PM yang ditugaskan
- Cek `project.pm_user_id === user.id`

### BoQ Items Tidak Muncul
- Pastikan proyek punya estimasi dengan status APPROVED
- Cek `estimations[].items` tidak kosong
- Verify foreign key `project_id` benar

### PM List Kosong
- Pastikan ada user dengan role PROJECT_MANAGER
- Cek `users.roles` array contains 'PROJECT_MANAGER'
- Verify `users.is_active = true`

## 📝 Notes

1. **Notification Service**: Saat ini hanya console.log. Untuk production, integrate dengan WebSocket/Email service.

2. **Activity Log**: BOM update menggunakan `activity_type = 'NOTE_ADDED'` karena `BOM_UPDATE` belum ada di enum. Tambahkan ke schema jika perlu:
   ```sql
   ALTER TYPE "ActivityType" ADD VALUE 'BOM_UPDATE';
   ```

3. **BoM Validation**: Frontend validasi basic (item_id required). Backend bisa tambah validasi item existence dari inventory service.

4. **Performance**: Untuk proyek dengan ribuan items, pertimbangkan pagination di DataGrid.

## 🎨 UI Screenshots

### Project Workspace Header
- Menampilkan project number, nama, status chip, customer chip
- Panel info: Sales PIC, PM (atau "Belum Ditugaskan"), Nilai Kontrak
- Tombol "Tugaskan PM" (jika belum ada PM dan user punya permission)

### Tab BoQ vs BoM
- **Panel Kiri**: BoQ read-only dengan DataGrid
- **Panel Kanan**: BoM editable dengan tombol Salin/Tambah/Simpan
- Color coding: Material (blue), Service (purple)

## 🔄 Integration Points

### With CRM Service
- Event `project.won` → creates project record
- Get customer data for display

### With Engineering Service
- Get estimation data (BoQ)
- Get estimation_items for BoQ display

### With Identity Service
- User authentication
- Get PM list with role filter
- Verify permissions

## ✅ Checklist Implementation

- [x] Backend: GET /projects/{id}
- [x] Backend: PUT /projects/{id}/assign-pm
- [x] Backend: POST /projects/{id}/bom
- [x] Backend: GET /projects/project-managers
- [x] Frontend: ProjectDetailPage (Project Workspace)
- [x] Frontend: Header dengan status & customer chip
- [x] Frontend: Panel info Sales PIC & PM
- [x] Frontend: AssignPmModal
- [x] Frontend: BoqVsBomTab dengan 2 panel
- [x] Frontend: Permission checking
- [x] Frontend: API integration
- [x] Types & interfaces
- [x] AuthContext permissions
- [x] Documentation

## 🚀 Next Steps

1. Implement actual notification service (WebSocket/Email)
2. Add timeline & tasks tab
3. Add document management tab
4. Add reporting tab
5. Add team performance tab
6. Integrate with procurement for material sourcing
7. Add milestone tracking
8. Add budget vs actual tracking

---

**Developed for miniERP System**  
*Last Updated: November 24, 2025*
