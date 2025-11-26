# HR Request APIs Documentation

API untuk mengelola pengajuan karyawan (Izin, Lembur, Klaim/Reimbursement).

## Base URL
```
http://localhost:4004/api/v1
```

## Authentication
Semua endpoint memerlukan JWT token di header:
```
Authorization: Bearer <token>
```

---

## 1. Permission Requests (Izin)

### Create Permission Request
```http
POST /permissions
Content-Type: application/json

{
  "permission_type": "PERSONAL",
  "start_time": "2024-11-17T09:00:00Z",
  "end_time": "2024-11-17T12:00:00Z",
  "duration_hours": 3,
  "reason": "Keperluan pribadi"
}
```

Gunakan salah satu nilai berikut untuk `permission_type`:

- PERSONAL
- MEDICAL
- FAMILY_EMERGENCY
- OFFICIAL_BUSINESS
- OTHER

### Get My Permissions
```http
GET /permissions/my?status=PENDING
```

### Get All Permissions (HR/Manager)
```http
GET /permissions?status=PENDING&page=1&limit=20
```

### Get Permission by ID
```http
GET /permissions/:id
```

### Approve/Reject Permission
```http
PUT /permissions/:id/status
Content-Type: application/json

{
  "status": "APPROVED",
  "rejection_reason": "Optional reason if rejected"
}

Nilai `status` yang valid: `APPROVED` atau `REJECTED`.
```

### Cancel Permission
```http
POST /permissions/:id/cancel
```

---

## 2. Overtime Requests (Lembur)

### Overtime Codes
- **L1**: Lembur Weekday 8 jam
- **L2**: Lembur Weekday 4 jam
- **L3**: Lembur Weekend 8 jam
- **L4**: Lembur Weekend 4 jam

### Create Overtime Request
```http
POST /overtimes
Content-Type: application/json

{
  "overtime_code": "L1",
  "overtime_date": "2024-11-17",
  "start_time": "2024-11-17T17:00:00Z",
  "end_time": "2024-11-18T01:00:00Z",
  "duration_hours": 8,
  "description": "Menyelesaikan project urgent"
}
```

**Note**: Duration harus sesuai dengan kode lembur (tolerance ±0.5 jam):
- L1 & L3: ~8 jam
- L2 & L4: ~4 jam

### Get My Overtimes
```http
GET /overtimes/my?status=PENDING
```

### Get All Overtimes (HR/Manager)
```http
GET /overtimes?status=PENDING&page=1&limit=20
```

### Get Overtime by ID
```http
GET /overtimes/:id
```

### Approve/Reject Overtime
```http
PUT /overtimes/:id/status
Content-Type: application/json

{
  "status": "APPROVED",
  "rejection_reason": "Optional reason if rejected"
}

Nilai `status` yang valid: `APPROVED` atau `REJECTED`.
```

### Cancel Overtime
```http
POST /overtimes/:id/cancel
```

### Get Overtime Summary (for Payroll)
```http
GET /overtimes/summary?month=2024-11&employeeId=xxx
```

**Response**:
```json
{
  "success": true,
  "data": {
    "month": "2024-11",
    "employee_id": "xxx",
    "summary": {
      "L1": { "count": 2, "total_hours": 16 },
      "L2": { "count": 1, "total_hours": 4 },
      "L3": { "count": 0, "total_hours": 0 },
      "L4": { "count": 0, "total_hours": 0 }
    },
    "total_overtime_hours": 20
  }
}
```

---

## 3. Reimbursement Requests (Klaim)

### Reimbursement Types
- TRANSPORTATION
- MEALS
- ACCOMMODATION
- COMMUNICATION
- MEDICAL
- OFFICE_SUPPLIES
- TRAINING
- OTHER

### Create Reimbursement Request
```http
POST /reimbursements
Content-Type: application/json

{
  "reimbursement_type": "TRANSPORTATION",
  "claim_date": "2024-11-17",
  "amount": 150000,
  "currency": "IDR",
  "description": "Transport ke client meeting",
  "receipt_file": "optional-file-url"
}
```

Daftar tipe yang valid: TRANSPORTATION, MEALS, ACCOMMODATION, COMMUNICATION, MEDICAL, OFFICE_SUPPLIES, TRAINING, OTHER.

### Get My Reimbursements
```http
GET /reimbursements/my?status=PENDING
```

### Get All Reimbursements (HR/Manager)
```http
GET /reimbursements?status=PENDING&page=1&limit=20
```

### Get Reimbursement by ID
```http
GET /reimbursements/:id
```

### Approve/Reject Reimbursement
```http
PUT /reimbursements/:id/status
Content-Type: application/json

{
  "status": "APPROVED",
  "rejection_reason": "Optional reason if rejected"
}

Nilai `status` yang valid: `APPROVED` atau `REJECTED`.
```

### Mark as Paid (Finance)
```http
POST /reimbursements/:id/paid
```

### Cancel Reimbursement
```http
POST /reimbursements/:id/cancel
```

### Get Reimbursement Summary (for Finance)
```http
GET /reimbursements/summary?month=2024-11&employeeId=xxx
```

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "2024-11",
    "total_requests": 15,
    "total_amount": 2500000,
    "paid_count": 10,
    "unpaid_count": 5,
    "by_type": {
      "TRANSPORTATION": { "count": 8, "total": 1200000 },
      "MEALS": { "count": 5, "total": 800000 },
      "MEDICAL": { "count": 2, "total": 500000 }
    }
  }
}
```

---

## Status Values
- **PENDING**: Menunggu approval
- **APPROVED**: Disetujui
- **REJECTED**: Ditolak
- **CANCELLED**: Dibatalkan oleh karyawan

---

## Error Response Format
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Notes for Implementation

### Migration
Migration SQL sudah dibuat di:
```
prisma/migrations/20251117_add_hr_requests_models/migration.sql
```

Untuk menjalankan migration:
```bash
# Option 1: Via psql (manual)
psql -h localhost -U your_user -d minierp_unais -f prisma/migrations/20251117_add_hr_requests_models/migration.sql

# Option 2: Via Prisma (recommended jika DB bersih)
npx prisma migrate deploy
```

### Testing
1. Start HR service:
```bash
cd services/hr-service
npm run dev
```

2. Test dengan curl atau Postman
3. Login dulu untuk dapat JWT token
4. Gunakan token untuk hit endpoints di atas

### Future Enhancements
- [ ] File upload untuk receipt reimbursement
- [ ] Email notification saat approval/rejection
- [ ] Dashboard summary untuk HR
- [ ] Export to Excel untuk payroll data
- [ ] Approval workflow (multi-level approval)
