# Pipeline API Testing dengan Postman

## 📋 Setup Postman

### 1. Import Collection

1. Buka Postman
2. Klik **Import** (atau Ctrl+O)
3. Pilih file: `postman-pipeline-collection.json`
4. Klik **Import**

### 2. Import Environment

1. Klik gear icon ⚙️ (Manage Environments)
2. Klik **Import**
3. Pilih file: `postman-pipeline-environment.json`
4. Pilih environment "miniERP Pipeline API Environment"

### 3. Set Variables

Di environment, update:

- `base_url`: `http://localhost:4002` (sudah benar)
- `jwt_token`: `your-valid-jwt-token` (perlu token valid)
- `project_id`: `proj-001` (untuk testing)

## 🚀 Testing Pipeline API

### ✅ **Test 1: Get Pipeline Data**

**Endpoint:** `GET /api/v1/pipeline`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "pipeline": {
      "PROSPECT": {
        "items": [...],
        "totalValue": 75000000
      },
      "MEETING_SCHEDULED": {
        "items": [...],
        "totalValue": 120000000
      },
      // ... other stages
    },
    "summary": {
      "totalOpportunities": 5,
      "totalValue": 925000000,
      "currency": "IDR"
    }
  }
}
```

### ✅ **Test 2: Move Pipeline Card**

**Endpoint:** `PUT /api/v1/pipeline/move`

**Body:**

```json
{
  "projectId": "proj-001",
  "newStatus": "MEETING_SCHEDULED"
}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj-001",
    "project_name": "Sistem CCTV Kantor Pusat",
    "status": "MEETING_SCHEDULED"
    // ... other project data
  },
  "message": "Project status successfully updated to MEETING_SCHEDULED"
}
```

### ✅ **Test 3: Create New Project**

**Endpoint:** `POST /api/v1/pipeline/projects`

**Body:**

```json
{
  "project_name": "Website E-Commerce",
  "project_number": "PRJ-2024-006",
  "description": "Pembuatan website e-commerce dengan fitur lengkap",
  "customer_id": "cust-001",
  "estimated_value": 80000000,
  "lead_score": 7,
  "priority": "MEDIUM",
  "expected_close_date": "2024-12-31",
  "notes": "Client membutuhkan integrasi payment gateway"
}
```

## 🔧 **Troubleshooting**

### Masalah Authentication

**Error:** `{"success":false,"message":"Token tidak valid"}`

**Solusi:**

1. Dapatkan JWT token yang valid dari endpoint login
2. Update variable `jwt_token` di environment
3. Pastikan format: `Bearer your-actual-jwt-token`

### Service Tidak Berjalan

**Error:** Connection refused atau timeout

**Solusi:**

```bash
cd C:\Users\acer\miniERP
npm run dev:crm
```

Pastikan service berjalan di port 4002

### Project ID Tidak Ada

**Error:** `{"error": "Project not found"}`

**Solusi:**

1. Buka Prisma Studio: `npx prisma studio`
2. Lihat tabel `projects` untuk ID yang valid
3. Update variable `project_id` di environment

## 📊 **Test Data yang Tersedia**

Dari seeding script, Anda punya:

### Customers:

- `cust-001`: PT Maju Teknologi (Jakarta)
- `cust-002`: CV Digital Solusi (Bandung)
- `cust-003`: Universitas Teknologi Indonesia (Surabaya)

### Projects:

- `proj-001`: Sistem CCTV Kantor Pusat (PROSPECT)
- `proj-002`: Upgrade Network Infrastructure (MEETING_SCHEDULED)
- `proj-003`: Smart Campus Solution (PRE_SALES)
- `proj-004`: Data Center Monitoring System (PROPOSAL_DELIVERED)
- `proj-005`: ERP Integration Project (NEGOTIATION)

## 🎯 **Test Scenarios**

### Happy Path:

1. ✅ Get pipeline data (semua stages)
2. ✅ Move project dari PROSPECT ke MEETING_SCHEDULED
3. ✅ Create project baru
4. ✅ Update project details
5. ✅ Get project activities

### Error Cases:

1. ❌ Invalid project ID
2. ❌ Invalid status
3. ❌ Business rule violation (proposal tanpa estimasi approved)
4. ❌ Unauthorized access (tanpa token)

## 🔍 **Monitoring Results**

Setelah testing, cek hasil di:

1. **Prisma Studio**: http://localhost:5555
2. **Database**: Lihat tabel `projects` dan `project_activities`
3. **Logs**: Output CRM service di terminal

## 📝 **Next Steps**

1. Implementasi JWT authentication yang proper
2. Role-based testing (Sales vs Manager permissions)
3. Frontend Kanban board untuk drag & drop
4. Real-time updates dengan WebSocket
