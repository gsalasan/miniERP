# 🎨 Visual Data Flow - HR System miniERP

## Gambaran Keseluruhan Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                         miniERP HR SYSTEM                        │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   EMPLOYEE   │    │   MANAGER    │    │   HR ADMIN   │     │
│  │   Dashboard  │    │   Approvals  │    │   Reports    │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                   │                    │              │
│         └───────────────────┴────────────────────┘              │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │  REACT FRONTEND │                         │
│                    │  (Port 5173)    │                         │
│                    └────────┬────────┘                         │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │   HR SERVICE    │                         │
│                    │  Backend API    │                         │
│                    │   (Port 4004)   │                         │
│                    └────────┬────────┘                         │
│                             │                                   │
│                    ┌────────▼────────┐                         │
│                    │   PostgreSQL    │                         │
│                    │    Database     │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📍 Contoh 1: Flow Check-In Absensi

### Langkah demi Langkah:

**09:00 AM - Employee Buka Dashboard**
```
┌─────────────────────────────────┐
│ Dashboard Employee              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  Attendance Widget          │ │
│ │                             │ │
│ │  Status: Belum Check-in     │ │
│ │                             │ │
│ │  [Absen Masuk]              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**09:15 AM - Employee Klik "Absen Masuk"**
```
Browser: "Allow location access?"
         ┌───────────────┐
         │  [Allow] [Block] │
         └───────┬───────────┘
                 │
                 ▼
         GPS Coordinates:
         Lat: -6.865799
         Lng: 107.574603
```

**Request dikirim ke Backend:**
```javascript
POST http://localhost:4004/api/v1/attendances/check-in

Headers:
  Authorization: Bearer eyJhbGc...

Body:
{
  "employee_id": "uuid-raisa-123",
  "latitude": -6.865799,
  "longitude": 107.574603
}
```

**Backend Process (HR Service):**
```
1. ✓ Validasi Token JWT
2. ✓ Check employee exists
3. ✓ Reverse Geocode koordinat:
   
   API Call ke Nominatim/Google Maps:
   https://nominatim.openstreetmap.org/reverse?
   lat=-6.865799&lon=107.574603
   
   Response:
   {
     "display_name": "Jalan Geger Kalong Hilir, 
                      Ciwarga, Bandung, 40154"
   }

4. ✓ Simpan ke Database
```

**Database Insert:**
```sql
INSERT INTO hr_attendances (
  id,
  employee_id,
  date,
  check_in_time,
  check_in_latitude,
  check_in_longitude,
  check_in_location,
  status,
  created_at
) VALUES (
  'att-001',
  'uuid-raisa-123',
  '2025-11-20',
  '2025-11-20 09:15:00',
  -6.865799,
  107.574603,
  'Jalan Geger Kalong Hilir, Ciwarga, Bandung',
  'PRESENT',
  NOW()
);
```

**Response ke Frontend:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "id": "att-001",
    "check_in_time": "2025-11-20T09:15:00Z",
    "check_in_location": "Jalan Geger Kalong Hilir, Ciwarga, Bandung",
    "status": "PRESENT"
  }
}
```

**UI Update:**
```
┌─────────────────────────────────┐
│ ✓ Toast Notification            │
│                                 │
│  Absen Masuk Berhasil!          │
│  Jam: 09:15                     │
│  📍 Jl. Geger Kalong Hilir      │
└─────────────────────────────────┘

Dashboard Widget berubah:
┌─────────────────────────────────┐
│  Status: Sudah Check-in         │
│  Jam Masuk: 09:15               │
│  [Absen Keluar]                 │
└─────────────────────────────────┘
```

---

## 📝 Contoh 2: Flow Pengajuan Cuti

### Timeline Lengkap:

**DAY 1 - 10:00 AM: Employee Submit**

```
┌─────────────────────────────────┐
│ My Requests Page                │
│                                 │
│ Tab: Leave                      │
│ [+ Ajukan Cuti Baru]            │
└────────┬────────────────────────┘
         │ KLIK
         ▼
┌─────────────────────────────────┐
│ Modal: Pengajuan Cuti           │
│                                 │
│ Tipe Cuti: [ANNUAL ▼]          │
│ Tgl Mulai: [25 Nov 2025]       │
│ Tgl Selesai: [27 Nov 2025]     │
│ Durasi: 3 hari                  │
│ Alasan: [Liburan keluarga___]  │
│                                 │
│ [Batal]  [Submit]               │
└─────────────────────────────────┘
```

**Submit Request:**
```javascript
POST http://localhost:4004/api/v1/leaves

Body:
{
  "leave_type": "ANNUAL",
  "start_date": "2025-11-25",
  "end_date": "2025-11-27",
  "duration_days": 3,
  "reason": "Liburan keluarga"
}
```

**Database State AFTER Submit:**
```sql
-- Table: hr_leave_requests
id          | employee_id    | leave_type | start_date | end_date   | total_days | status  | created_at
------------|----------------|------------|------------|------------|------------|---------|------------------
leave-001   | raisa-uuid     | ANNUAL     | 2025-11-25 | 2025-11-27 | 3          | PENDING | 2025-11-20 10:00
```

**Notifications Created:**
```javascript
// localStorage untuk Manager
{
  id: "notif-001",
  userId: "manager-budi-uuid",  // ← PENTING!
  type: "leave_request",
  title: "New Leave Request",
  message: "Raisa mengajukan cuti ANNUAL untuk 3 hari",
  isRead: false,
  requestId: "leave-001",
  timestamp: "2025-11-20T10:00:00Z"
}

// localStorage untuk Employee (konfirmasi)
{
  id: "notif-002",
  userId: "raisa-uuid",  // ← PENTING!
  type: "request_submitted",
  title: "Pengajuan Berhasil",
  message: "Cuti Anda telah diajukan dan menunggu persetujuan",
  isRead: false,
  timestamp: "2025-11-20T10:00:00Z"
}
```

**UI untuk Employee (Raisa):**
```
┌────────────────────────────────────┐
│ ✓ Success Popup                    │
│                                    │
│  Pengajuan Berhasil!               │
│  Pengajuan Cuti Anda telah         │
│  berhasil dibuat dan menunggu      │
│  persetujuan                       │
│                                    │
│  [OK]                              │
└────────────────────────────────────┘

My Requests - Tab Leave:
┌────────────────────────────────────┐
│ Status   | Date           | Days  │
├──────────┼────────────────┼───────┤
│ PENDING  | 25-27 Nov 2025 | 3     │  ← NEW!
└────────────────────────────────────┘
```

**UI untuk Manager (Budi):**
```
Dashboard - Bell Icon berubah:
┌────────────────┐
│   🔔 (1)       │  ← Badge muncul
└────────────────┘

Approvals Page - Tab Pending:
┌──────────────────────────────────────────────────┐
│ Employee | Type  | Date           | Action       │
├──────────┼───────┼────────────────┼──────────────┤
│ Raisa    | Cuti  | 25-27 Nov 2025 | [Review]     │  ← NEW!
└──────────────────────────────────────────────────┘
```

---

**DAY 1 - 14:00 PM: Manager Review & Approve**

```
Manager Budi klik [Review]:

┌─────────────────────────────────────────┐
│ Leave Request Details                   │
│                                         │
│ Employee: Raisa                         │
│ Position: Software Engineer             │
│ ─────────────────────────────────────   │
│ Leave Type: ANNUAL                      │
│ Date: 25 Nov 2025 - 27 Nov 2025        │
│ Total Days: 3 days                      │
│ Reason: Liburan keluarga                │
│ ─────────────────────────────────────   │
│ Rejection Reason (if rejected):         │
│ [_________________________________]     │
│                                         │
│ [Cancel]  [Reject]  [Approve]           │
└─────────────────────────────────────────┘
```

**Manager Klik "Approve":**
```javascript
PUT http://localhost:4004/api/v1/leaves/leave-001/approve

Headers:
  Authorization: Bearer manager-token

Response:
{
  "success": true,
  "message": "Leave request approved",
  "data": {
    "id": "leave-001",
    "status": "APPROVED",
    "approved_by": "manager-budi-uuid",
    "approved_at": "2025-11-20T14:00:00Z"
  }
}
```

**Database State AFTER Approve:**
```sql
-- Table: hr_leave_requests (UPDATED)
id        | status   | approved_by        | approved_at
----------|----------|-------------------|------------------
leave-001 | APPROVED | manager-budi-uuid | 2025-11-20 14:00
```

**Notifications Created (AFTER Approve):**
```javascript
// Notification untuk Employee (Raisa)
{
  id: "notif-003",
  userId: "raisa-uuid",  // ← Hanya untuk Raisa
  type: "leave_approved",
  title: "Cuti Disetujui",
  message: "Pengajuan cuti Anda untuk 25-27 Nov telah disetujui oleh Manager",
  isRead: false,
  timestamp: "2025-11-20T14:00:00Z"
}

// TIDAK ADA notif untuk Nadia atau user lain!
```

**UI untuk Manager (Budi):**
```
┌────────────────────────────────────┐
│ ✓ Success Popup                    │
│                                    │
│  Berhasil!                         │
│  Pengajuan cuti telah disetujui    │
└────────────────────────────────────┘

Approvals - Tab Pending:
┌──────────────────────────────────────────┐
│ (Kosong - request sudah pindah ke History)│
└──────────────────────────────────────────┘

Approvals - Tab History:
┌──────────────────────────────────────────────────────┐
│ Employee | Type | Date          | Status   | When   │
├──────────┼──────┼───────────────┼──────────┼────────┤
│ Raisa    | Cuti | 25-27 Nov '25 | APPROVED | 14:00  │  ← MOVED!
└──────────────────────────────────────────────────────┘
```

**UI untuk Employee (Raisa):**
```
Dashboard - Bell Icon:
┌────────────────┐
│   🔔 (1)       │  ← New notification
└────────────────┘

Klik Bell:
┌────────────────────────────────────┐
│ Notifications                      │
│                                    │
│ ✓ Cuti Disetujui                   │
│   Pengajuan cuti Anda untuk        │
│   25-27 Nov telah disetujui        │
│   14:00 PM                         │
└────────────────────────────────────┘

My Requests - Tab Leave:
┌────────────────────────────────────┐
│ Status   | Date           | Days  │
├──────────┼────────────────┼───────┤
│ APPROVED | 25-27 Nov 2025 | 3     │  ← STATUS CHANGED!
└────────────────────────────────────┘
```

**UI untuk Employee Lain (Nadia):**
```
Dashboard - Bell Icon:
┌────────────────┐
│   🔔           │  ← NO badge (tidak ada notif)
└────────────────┘

TIDAK ADA notifikasi tentang cuti Raisa!
```

---

## 💰 Contoh 3: Flow Reimbursement (dengan Lokasi & Receipt)

### Lengkap dengan Alamat Lokasi

**Employee Submit Reimbursement:**
```
┌─────────────────────────────────────┐
│ My Requests - Tab Reimbursement     │
│                                     │
│ [+ Ajukan Reimbursement Baru]       │
└────────┬────────────────────────────┘
         │ KLIK
         ▼
┌─────────────────────────────────────┐
│ Modal: Pengajuan Reimbursement      │
│                                     │
│ Tipe: [TRANSPORTATION ▼]           │
│ Tanggal: [20 Nov 2025]             │
│ Jumlah: [Rp 150,000_________]      │
│ Deskripsi: [Transport ke client__] │
│                                     │
│ Upload Bukti:                       │
│ ┌─────────────────────────────┐    │
│ │ [📎 Choose File] receipt.jpg│    │
│ └─────────────────────────────┘    │
│                                     │
│ 📍 Lokasi Saat Ini:                │
│ Jl. Sudirman No. 123, Jakarta      │
│                                     │
│ [Batal]  [Submit]                   │
└─────────────────────────────────────┘
```

**Data yang Dikirim:**
```javascript
// Step 1: Upload file
POST http://localhost:4004/api/v1/upload
FormData: receipt.jpg

Response:
{
  "file_url": "https://storage.googleapis.com/miniERP/receipts/receipt-uuid-123.jpg"
}

// Step 2: Submit reimbursement
POST http://localhost:4004/api/v1/reimbursements

Body:
{
  "reimbursement_type": "TRANSPORTATION",
  "claim_date": "2025-11-20",
  "amount": 150000,
  "currency": "IDR",
  "description": "Transport ke klien PT ABC",
  "receipt_url": "https://storage.../receipt-uuid-123.jpg",
  "location": "Jl. Sudirman No. 123, Jakarta Pusat"
}
```

**Database State:**
```sql
INSERT INTO hr_reimbursement_requests (
  id,
  employee_id,
  reimbursement_type,
  claim_date,
  amount,
  currency,
  description,
  receipt_file,
  location,           -- ← NEW FIELD!
  status,
  created_at
) VALUES (
  'reimb-001',
  'raisa-uuid',
  'TRANSPORTATION',
  '2025-11-20',
  150000.00,
  'IDR',
  'Transport ke klien PT ABC',
  'https://storage.../receipt-uuid-123.jpg',
  'Jl. Sudirman No. 123, Jakarta Pusat',
  'PENDING',
  NOW()
);
```

**Manager Review - TAMPILAN LOKASI:**
```
┌──────────────────────────────────────────────┐
│ Reimbursement Request Details                │
│                                              │
│ Employee: Raisa                              │
│ ──────────────────────────────────────────   │
│ Type: TRANSPORTATION                         │
│ Date: 20 Nov 2025                            │
│ Amount: Rp 150,000                           │
│ Description: Transport ke klien PT ABC       │
│                                              │
│ Location: ✓                                  │
│ ┌──────────────────────────────────────────┐ │
│ │  📍                                       │ │
│ │  Jl. Sudirman No. 123,                   │ │
│ │  Jakarta Pusat                           │ │
│ │                                          │ │
│ │  Submitted location         [✓ Verified] │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Receipt: [View Receipt] →                    │
│                                              │
│ [Cancel]  [Reject]  [Approve]                │
└──────────────────────────────────────────────┘
```

**Klik "View Receipt":**
```
Opens new tab:
┌──────────────────────────────────┐
│ https://storage.../receipt.jpg   │
│                                  │
│  [Image of receipt appears]      │
│                                  │
│  ┌────────────────────────────┐  │
│  │ NOTA                       │  │
│  │ Transport: Rp 150,000      │  │
│  │ Date: 20/11/2025          │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## 🔄 Notification Routing Logic

### Kenapa Notif Hanya ke Orang yang Tepat?

**Code Logic dalam `notifications.ts`:**

```typescript
// Function untuk get current user
function getCurrentUserId(): string {
  const userData = localStorage.getItem('user');
  if (!userData) return '';
  const user = JSON.parse(userData);
  return user.id || user.employee_id || '';
}

// Function untuk add notification (HARUS ada userId!)
export function addNotification(notification: {
  userId: string;  // ← WAJIB! Menentukan siapa yang lihat
  type: string;
  title: string;
  message: string;
}) {
  const notifications = getAllNotifications();
  
  const newNotif = {
    id: generateId(),
    userId: notification.userId,  // ← Disimpan!
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: false,
    timestamp: new Date().toISOString(),
  };
  
  notifications.push(newNotif);
  localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Function untuk get notifications (FILTER by userId!)
export function getNotifications(): Notification[] {
  const currentUserId = getCurrentUserId();
  const allNotifications = getAllNotifications();
  
  // ← FILTER: Hanya return yang userId-nya match!
  return allNotifications.filter(
    (n) => n.userId === currentUserId
  );
}
```

**Contoh Penggunaan:**

```typescript
// Di Approvals.tsx - Saat approve request
const handleApprove = async () => {
  // Approve di backend
  await approveRequest(selectedRequest.id);
  
  // Kirim notif KE EMPLOYEE yang ngajuin
  addNotification({
    userId: selectedRequest.employee_id,  // ← Raisa's ID
    type: 'leave_approved',
    title: 'Cuti Disetujui',
    message: 'Pengajuan cuti Anda telah disetujui',
  });
  
  // TIDAK kirim ke user lain!
};

// Di MyRequests.tsx - Saat submit request
const handleSubmit = async () => {
  const response = await submitLeaveRequest(formData);
  
  // Kirim notif KE MANAGER
  addNotification({
    userId: currentUser.manager_id,  // ← Manager Budi's ID
    type: 'leave_request',
    title: 'New Leave Request',
    message: `${currentUser.name} mengajukan cuti`,
  });
  
  // TIDAK kirim ke employee lain!
};
```

**localStorage Structure:**
```javascript
// localStorage.getItem('notifications')
[
  {
    id: "1",
    userId: "raisa-uuid",      // ← Raisa akan lihat ini
    message: "Cuti disetujui"
  },
  {
    id: "2",
    userId: "budi-uuid",       // ← Budi (manager) akan lihat ini
    message: "Raisa mengajukan cuti"
  },
  {
    id: "3",
    userId: "raisa-uuid",      // ← Raisa akan lihat ini
    message: "Lembur disetujui"
  }
]

// Saat Raisa login dan buka dashboard:
getCurrentUserId() → "raisa-uuid"
getNotifications() → filter where userId === "raisa-uuid"
Result: [notif 1, notif 3]  // Hanya 2 notif

// Saat Nadia login:
getCurrentUserId() → "nadia-uuid"
getNotifications() → filter where userId === "nadia-uuid"
Result: []  // Tidak ada notif!

// Saat Budi (manager) login:
getCurrentUserId() → "budi-uuid"
getNotifications() → filter where userId === "budi-uuid"
Result: [notif 2]  // Hanya 1 notif tentang request Raisa
```

---

## 📊 Database Relationships

```
┌──────────────────┐
│   employees      │
│                  │
│ id (PK)          │◄─────┐
│ full_name        │      │
│ manager_id (FK)  │──┐   │
└──────────────────┘  │   │
         ▲            │   │
         │            │   │
         │            │   │
         │            │   │
         │            │   │
         │            │   │
┌────────┴──────────────┐ │
│ hr_leave_requests     │ │
│                       │ │
│ id (PK)               │ │
│ employee_id (FK) ─────┘ │
│ leave_type            │ │
│ status                │ │
│ approved_by (FK) ─────┘
│ approved_at           │
└───────────────────────┘

Similar structure for:
- hr_permission_requests
- hr_overtime_requests
- hr_reimbursement_requests
- hr_attendances
```

---

## ✨ Summary - Siapa Lihat Apa?

### Employee (Raisa):
- ✅ Dashboard: Widget check-in/out sendiri
- ✅ My Requests: List request sendiri (PENDING/APPROVED/REJECTED)
- ✅ My Attendances: Riwayat absensi sendiri dengan lokasi
- ✅ Notifications: Approval/rejection dari manager
- ❌ TIDAK bisa lihat: Request employee lain

### Manager (Budi):
- ✅ Approvals - Pending: Request dari subordinates (team sendiri)
- ✅ Approvals - History: History approval yang sudah diproses
- ✅ Dashboard: Ringkasan team attendance
- ✅ Notifications: Ada request baru dari team
- ❌ TIDAK bisa lihat: Request dari employee di team lain (kecuali HR)

### HR Admin:
- ✅ Approvals - All: Semua request dari semua department
- ✅ Reports: Attendance/leave summary semua karyawan
- ✅ Employee Management: CRUD employee data
- ✅ Settings: Configure leave balance, overtime rates, dll

---

**Dokumentasi ini menjelaskan secara visual bagaimana data mengalir dari user → database → user lain! 🎉**
