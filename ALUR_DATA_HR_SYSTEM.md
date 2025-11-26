# 📊 Alur Data Sistem HR miniERP

## 🎯 Overview
Dokumen ini menjelaskan alur data lengkap untuk semua pengajuan HR (Cuti, Izin, Lembur, Reimbursement) dari awal hingga akhir.

---

## 📍 1. ABSENSI (Check-In/Check-Out)

### Alur Data Absensi:

```
┌─────────────────┐
│  EMPLOYEE       │
│  (Dashboard)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 1. Klik "Absen Masuk"           │
│    - Browser meminta lokasi GPS │
│    - Latitude & Longitude       │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 2. Frontend mengirim POST request:   │
│    POST /api/v1/attendances/check-in │
│                                      │
│    Body: {                           │
│      employee_id: "uuid",            │
│      latitude: -6.865799,            │
│      longitude: 107.574603           │
│    }                                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 3. Backend (HR Service - Port 4004)  │
│    a. Validasi employee_id           │
│    b. Reverse geocode koordinat      │
│       → Jadi alamat lengkap          │
│       "Jalan Geger Kalong Hilir..."  │
│    c. Simpan ke database             │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ 4. Database (PostgreSQL)                     │
│    Table: hr_attendances                     │
│                                              │
│    INSERT INTO hr_attendances (              │
│      id,                                     │
│      employee_id,                            │
│      date,                                   │
│      check_in_time,         ← Waktu sekarang │
│      check_in_latitude,     ← -6.865799      │
│      check_in_longitude,    ← 107.574603     │
│      check_in_location,     ← "Jl. Geger..." │
│      status                 ← "PRESENT"      │
│    )                                         │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 5. Response ke Frontend          │
│    {                             │
│      success: true,              │
│      data: {                     │
│        check_in_time: "09:15",   │
│        location: "Jl. Geger..."  │
│      }                           │
│    }                             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 6. Toast Notification            │
│    "Absen Masuk Berhasil!"       │
│    Jam: 09:15                    │
└──────────────────────────────────┘
```

### Lokasi Data Tersimpan:
- **Database**: `hr_attendances` table
- **Kolom Penting**:
  - `check_in_location`: Alamat lengkap hasil reverse geocoding
  - `check_in_latitude`: Koordinat latitude
  - `check_in_longitude`: Koordinat longitude
  - `check_in_time`: Waktu absen masuk

---

## 📝 2. PENGAJUAN CUTI (Leave Request)

### Alur Data Pengajuan Cuti:

```
┌─────────────────┐
│  EMPLOYEE       │
│  (My Requests)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Klik "Ajukan Cuti"               │
│    Form input:                      │
│    - Tipe Cuti: ANNUAL              │
│    - Tanggal Mulai: 25 Nov 2025     │
│    - Tanggal Selesai: 27 Nov 2025   │
│    - Durasi: 3 hari                 │
│    - Alasan: "Liburan keluarga"     │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 2. Frontend mengirim POST request:   │
│    POST /api/v1/leaves               │
│                                      │
│    Body: {                           │
│      leave_type: "ANNUAL",           │
│      start_date: "2025-11-25",       │
│      end_date: "2025-11-27",         │
│      duration_days: 3,               │
│      reason: "Liburan keluarga"      │
│    }                                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 3. Backend (HR Service)              │
│    a. Ambil employee_id dari token   │
│    b. Validasi saldo cuti            │
│    c. Map duration_days → total_days │
│    d. Set status = PENDING           │
│    e. Simpan ke database             │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ 4. Database (PostgreSQL)                     │
│    Table: hr_leave_requests                  │
│                                              │
│    INSERT INTO hr_leave_requests (           │
│      id,                   ← UUID baru       │
│      employee_id,          ← Dari token      │
│      leave_type,           ← "ANNUAL"        │
│      start_date,           ← "2025-11-25"    │
│      end_date,             ← "2025-11-27"    │
│      total_days,           ← 3               │
│      reason,               ← "Liburan..."    │
│      status,               ← "PENDING"       │
│      created_at            ← Now()           │
│    )                                         │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 5. Response ke Frontend          │
│    {                             │
│      success: true,              │
│      message: "Leave request     │
│                created",         │
│      data: {                     │
│        id: "uuid-123",           │
│        status: "PENDING"         │
│      }                           │
│    }                             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 6. Success Notification Popup    │
│    ✓ "Pengajuan Berhasil!"       │
│    "Pengajuan Cuti Anda telah    │
│     berhasil dibuat dan          │
│     menunggu persetujuan"        │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 7. Notification ke Manager       │
│    localStorage notification:    │
│    {                             │
│      userId: "manager-id",       │
│      type: "leave_request",      │
│      message: "Raisa mengajukan  │
│                cuti 3 hari"      │
│    }                             │
└──────────────────────────────────┘
```

### Lokasi Data Tersimpan:
- **Database**: `hr_leave_requests` table
- **Status Possible**: 
  - `PENDING` → Menunggu approval
  - `APPROVED` → Disetujui manager
  - `REJECTED` → Ditolak manager
  - `CANCELLED` → Dibatalkan employee

---

## ⏰ 3. PENGAJUAN LEMBUR (Overtime Request)

### Alur Data Pengajuan Lembur:

```
┌─────────────────┐
│  EMPLOYEE       │
│  (My Requests)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Klik "Ajukan Lembur"             │
│    Form input:                      │
│    - Kode Lembur: L1 (Weekday 8jam) │
│    - Tanggal: 20 Nov 2025           │
│    - Jam Mulai: 17:00               │
│    - Jam Selesai: 21:00             │
│    - Deskripsi: "Selesaikan laporan"│
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 2. Frontend POST /api/v1/overtime    │
│                                      │
│    Body: {                           │
│      overtime_code: "L1",            │
│      overtime_date: "2025-11-20",    │
│      start_time: "17:00",            │
│      end_time: "21:00",              │
│      duration_hours: 4,              │
│      description: "Selesaikan..."    │
│    }                                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ 3. Database: hr_overtime_requests            │
│                                              │
│    INSERT INTO hr_overtime_requests (        │
│      id,                                     │
│      employee_id,                            │
│      overtime_code,      ← "L1"             │
│      overtime_date,      ← "2025-11-20"     │
│      start_time,         ← "17:00"          │
│      end_time,           ← "21:00"          │
│      duration_hours,     ← 4.00             │
│      description,        ← "Selesaikan..."  │
│      status              ← "PENDING"         │
│    )                                         │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 4. Success Popup + Notif Manager │
└──────────────────────────────────┘
```

### Kode Lembur (OvertimeCode):
- **L1**: Lembur Weekday 8 jam (bayaran 1x)
- **L2**: Lembur Weekday 4 jam (bayaran 0.5x)
- **L3**: Lembur Weekend 8 jam (bayaran 2x)
- **L4**: Lembur Weekend 4 jam (bayaran 1x)

---

## 💰 4. PENGAJUAN REIMBURSEMENT

### Alur Data Reimbursement:

```
┌─────────────────┐
│  EMPLOYEE       │
│  (My Requests)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Klik "Ajukan Reimbursement"      │
│    Form input:                      │
│    - Tipe: TRANSPORTATION           │
│    - Tanggal Klaim: 20 Nov 2025     │
│    - Jumlah: Rp 150,000             │
│    - Deskripsi: "Transportasi ke    │
│                  klien PT ABC"      │
│    - Upload Bukti: receipt.jpg      │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 2. Upload File (jika ada)            │
│    POST /api/v1/upload               │
│    Response: {                       │
│      file_url: "https://storage/..." │
│    }                                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 3. POST /api/v1/reimbursements       │
│                                      │
│    Body: {                           │
│      reimbursement_type:             │
│        "TRANSPORTATION",             │
│      claim_date: "2025-11-20",       │
│      amount: 150000,                 │
│      currency: "IDR",                │
│      description: "Transport...",    │
│      receipt_url: "https://..."      │
│    }                                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ 4. Database: hr_reimbursement_requests       │
│                                              │
│    INSERT INTO hr_reimbursement_requests (   │
│      id,                                     │
│      employee_id,                            │
│      reimbursement_type, ← "TRANSPORTATION"  │
│      claim_date,         ← "2025-11-20"      │
│      amount,             ← 150000.00         │
│      currency,           ← "IDR"             │
│      description,        ← "Transport..."    │
│      receipt_file,       ← "https://..."     │
│      status              ← "PENDING"         │
│    )                                         │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 5. Success Popup + Notif Manager │
└──────────────────────────────────┘
```

### Tipe Reimbursement:
- **TRANSPORTATION**: Biaya transport
- **MEALS**: Biaya makan
- **ACCOMMODATION**: Biaya penginapan
- **COMMUNICATION**: Pulsa/internet
- **MEDICAL**: Biaya kesehatan
- **OFFICE_SUPPLIES**: Alat tulis
- **TRAINING**: Biaya pelatihan
- **OTHER**: Lainnya

---

## ✅ 5. PROSES APPROVAL (Manager/HR)

### Alur Approval:

```
┌─────────────────┐
│  MANAGER/HR     │
│  (Approvals)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Lihat Tab "Pending"              │
│    - List semua request PENDING     │
│    - Dari team/subordinates saja    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 2. Klik "Review" pada request       │
│    - Modal detail terbuka           │
│    - Tampilkan semua info:          │
│      • Employee name                │
│      • Request type                 │
│      • Dates, duration, amount      │
│      • Description/reason           │
│      • Receipt (untuk reimburse)    │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 3. Manager memutuskan:              │
│    A. APPROVE → Klik "Approve"      │
│    B. REJECT  → Tulis alasan +      │
│                 Klik "Reject"       │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 4A. Jika APPROVE:                    │
│     PUT /api/v1/{type}/{id}/approve  │
│                                      │
│     Backend update:                  │
│     - status = "APPROVED"            │
│     - approved_by = manager_id       │
│     - approved_at = NOW()            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 4B. Jika REJECT:                     │
│     PUT /api/v1/{type}/{id}/reject   │
│                                      │
│     Body: {                          │
│       rejection_reason: "Alasan..."  │
│     }                                │
│                                      │
│     Backend update:                  │
│     - status = "REJECTED"            │
│     - approved_by = manager_id       │
│     - approved_at = NOW()            │
│     - rejection_reason = "..."       │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 5. Database Updated                  │
│    Request dipindah dari PENDING     │
│    ke APPROVED/REJECTED              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ 6. Notification ke Employee          │
│    localStorage notification:        │
│    {                                 │
│      userId: "employee-id",          │
│      type: "approval",               │
│      message: "Pengajuan cuti Anda   │
│                telah disetujui"      │
│    }                                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 7. Success Popup untuk Manager   │
│    ✓ "Berhasil!"                 │
│    "Pengajuan telah disetujui"   │
└──────────────────────────────────┘
```

---

## 📊 6. RINGKASAN DATABASE TABLES

### Table: `hr_attendances`
**Fungsi**: Menyimpan data check-in/check-out karyawan
**Data Penting**:
- `check_in_location`: Alamat lengkap saat check-in
- `check_out_location`: Alamat lengkap saat check-out
- `check_in_latitude`, `check_in_longitude`: Koordinat GPS
- `status`: PRESENT, ABSENT, LATE, etc.

### Table: `hr_leave_requests`
**Fungsi**: Menyimpan pengajuan cuti
**Status Flow**: PENDING → APPROVED/REJECTED
**Data Penting**:
- `leave_type`: ANNUAL, SICK, MATERNITY, etc.
- `total_days`: Jumlah hari cuti
- `status`: PENDING/APPROVED/REJECTED
- `approved_by`: ID manager yang approve
- `rejection_reason`: Alasan jika ditolak

### Table: `hr_permission_requests`
**Fungsi**: Menyimpan pengajuan izin
**Status Flow**: PENDING → APPROVED/REJECTED
**Data Penting**:
- `permission_type`: PERSONAL, MEDICAL, FAMILY_EMERGENCY, etc.
- `duration_hours`: Durasi izin dalam jam
- `status`: PENDING/APPROVED/REJECTED

### Table: `hr_overtime_requests`
**Fungsi**: Menyimpan pengajuan lembur
**Status Flow**: PENDING → APPROVED/REJECTED
**Data Penting**:
- `overtime_code`: L1, L2, L3, L4
- `duration_hours`: Durasi lembur
- `status`: PENDING/APPROVED/REJECTED

### Table: `hr_reimbursement_requests`
**Fungsi**: Menyimpan pengajuan reimbursement
**Status Flow**: PENDING → APPROVED → (PAID)
**Data Penting**:
- `reimbursement_type`: TRANSPORTATION, MEALS, etc.
- `amount`: Jumlah uang yang di-reimburse
- `receipt_file`: URL file bukti
- `status`: PENDING/APPROVED/REJECTED
- `paid_at`: Kapan dibayar (null jika belum)

---

## 🔄 7. NOTIFICATION SYSTEM

### Cara Kerja Notifikasi:

```
┌──────────────────────────────────────┐
│ localStorage Structure:              │
│                                      │
│ notifications = [                    │
│   {                                  │
│     id: "notif-1",                   │
│     userId: "employee-id",    ← KEY! │
│     type: "leave_approved",          │
│     message: "Cuti disetujui",       │
│     isRead: false,                   │
│     timestamp: "2025-11-20T..."      │
│   },                                 │
│   {                                  │
│     id: "notif-2",                   │
│     userId: "manager-id",     ← KEY! │
│     type: "leave_request",           │
│     message: "Raisa mengajukan cuti",│
│     isRead: false,                   │
│     timestamp: "2025-11-20T..."      │
│   }                                  │
│ ]                                    │
└──────────────────────────────────────┘

User Raisa (employee-id) hanya melihat:
- notif-1 saja

User Manager (manager-id) hanya melihat:
- notif-2 saja
```

### Kapan Notifikasi Dikirim:

1. **Employee Submit Request**
   - Notif ke: Manager/Atasan
   - Pesan: "X mengajukan [cuti/izin/lembur/reimburse]"

2. **Manager Approve Request**
   - Notif ke: Employee yang mengajukan
   - Pesan: "Pengajuan [type] Anda telah disetujui"

3. **Manager Reject Request**
   - Notif ke: Employee yang mengajukan
   - Pesan: "Pengajuan [type] Anda ditolak. Alasan: ..."

---

## 🎨 8. UI/UX COMPONENTS

### Success Notification Popup
**File**: `SuccessNotification.tsx`
**Kapan muncul**:
- Setelah submit request berhasil
- Setelah approve/reject berhasil
**Fitur**:
- Auto-dismiss dalam 4 detik
- Progress bar
- Animasi slide-in dari kanan
- 4 tipe: success, info, warning, error
- Gradient background

### Attendance Toast
**File**: `AttendanceToast.tsx`
**Kapan muncul**:
- Setelah check-in berhasil
- Setelah check-out berhasil
**Fitur**:
- Modal center screen
- Tampil jam check-in/out
- Auto-dismiss

---

## 📱 9. HALAMAN-HALAMAN PENTING

### Employee Pages:

1. **Dashboard** (`/dashboard`)
   - Widget absensi (check-in/out)
   - Ringkasan attendance bulan ini
   - Notifikasi approval

2. **My Requests** (`/my-requests`)
   - Tab: Leave, Permission, Overtime, Reimbursement
   - Form submit request baru
   - List request history (PENDING/APPROVED/REJECTED)

3. **My Attendances** (`/my-attendances`)
   - Kalender view
   - Detail check-in/out per hari
   - **Tampilan alamat lengkap** (bukan hanya koordinat)

### Manager/HR Pages:

1. **Approvals** (`/approvals`)
   - Tab: Pending, History
   - List semua request dari team
   - Modal review + approve/reject
   - **Link bukti receipt** untuk reimbursement

---

## 🚀 10. BACKEND SERVICES

### HR Service (Port 4004)
**Base URL**: `http://localhost:4004/api/v1`

**Endpoints**:

#### Attendance
- `POST /attendances/check-in` - Absen masuk
- `POST /attendances/check-out` - Absen keluar
- `GET /attendances/my` - Riwayat attendance saya
- `GET /attendances/reverse-geocode` - Convert koordinat → alamat

#### Leave Requests
- `POST /leaves` - Buat pengajuan cuti
- `GET /leaves/my` - List cuti saya
- `PUT /leaves/:id/approve` - Approve cuti
- `PUT /leaves/:id/reject` - Reject cuti

#### Permission Requests
- `POST /permissions` - Buat pengajuan izin
- `GET /permissions/my` - List izin saya
- `PUT /permissions/:id/approve` - Approve izin
- `PUT /permissions/:id/reject` - Reject izin

#### Overtime Requests
- `POST /overtime` - Buat pengajuan lembur
- `GET /overtime/my` - List lembur saya
- `PUT /overtime/:id/approve` - Approve lembur
- `PUT /overtime/:id/reject` - Reject lembur

#### Reimbursement Requests
- `POST /reimbursements` - Buat pengajuan reimburse
- `GET /reimbursements/my` - List reimburse saya
- `PUT /reimbursements/:id/approve` - Approve reimburse
- `PUT /reimbursements/:id/reject` - Reject reimburse

#### Approvals (untuk Manager/HR)
- `GET /approvals/team` - List pending requests dari team
- `GET /approvals/all` - List semua pending requests (HR only)
- `GET /approvals/history` - List approved/rejected requests

---

## ✨ SUMMARY ALUR DATA

### Untuk Employee:
1. **Submit Request** → Database (status: PENDING)
2. **Notifikasi dikirim** → Manager
3. **Tunggu Approval**
4. **Terima Notifikasi** → Approved/Rejected
5. **Cek History** → My Requests page

### Untuk Manager/HR:
1. **Terima Notifikasi** → Ada request baru
2. **Buka Approvals Page** → Tab Pending
3. **Review Detail** → Modal popup
4. **Approve/Reject** → Update database
5. **Notifikasi dikirim** → Employee
6. **Request pindah** → Tab History

### Data Flow:
```
Employee → Frontend → Backend API → Database → Backend API → Frontend → Manager
                                                                    ↓
Manager Decision → Frontend → Backend API → Database → Backend API → Frontend → Employee
```

---

## 🔐 SECURITY & VALIDATION

### Authentication:
- Semua request butuh token JWT di header
- Token berisi `employee_id` dan `role`
- Backend validasi token setiap request

### Authorization:
- Employee hanya bisa lihat/submit request sendiri
- Manager bisa lihat request dari subordinates
- HR bisa lihat semua request

### Validation:
- Start date ≤ End date
- Duration > 0
- Amount > 0
- Receipt required untuk reimbursement > Rp 500,000
- Saldo cuti mencukupi

---

**Dokumentasi ini menjelaskan alur lengkap dari awal submit sampai approval selesai! 🎉**
