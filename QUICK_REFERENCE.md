# 📚 Ringkasan Alur Data Pengajuan HR - SIMPLE VERSION

## 🎯 Apa yang Terjadi Saat Employee Submit Request?

### 1️⃣ EMPLOYEE SUBMIT CUTI
```
Employee (Raisa) klik "Ajukan Cuti"
         ↓
Form diisi: Tanggal, Alasan, dll
         ↓
Klik "Submit"
         ↓
Data dikirim ke Backend (HR Service Port 4004)
         ↓
Backend simpan ke Database (status: PENDING)
         ↓
Notification dikirim ke Manager
         ↓
Employee dapat konfirmasi "Berhasil diajukan!"
```

**Kemana Datanya?**
- **Tersimpan**: Database PostgreSQL, table `hr_leave_requests`
- **Status**: PENDING (tunggu approval)
- **Notifikasi ke**: Manager Raisa saja (BUKAN ke semua user!)

---

### 2️⃣ MANAGER APPROVE/REJECT
```
Manager (Budi) buka halaman Approvals
         ↓
Lihat Tab "Pending" → Ada request dari Raisa
         ↓
Klik "Review" → Modal detail terbuka
         ↓
Manager putuskan: APPROVE atau REJECT
         ↓
Klik "Approve" (atau "Reject" + tulis alasan)
         ↓
Backend update status di Database
         ↓
Notification dikirim ke Employee (Raisa)
         ↓
Request pindah ke Tab "History"
```

**Kemana Datanya?**
- **Database**: Status berubah dari PENDING → APPROVED/REJECTED
- **Field tambahan**: 
  - `approved_by`: ID manager yang approve
  - `approved_at`: Waktu approve
  - `rejection_reason`: Alasan jika ditolak
- **Notifikasi ke**: Employee yang mengajukan (Raisa) SAJA!

---

## 💰 REIMBURSEMENT - Sama Tapi Ada Bukti & Lokasi

### Submit Reimbursement:
```
Employee isi form:
- Tipe: TRANSPORTATION
- Jumlah: Rp 150,000
- Upload Bukti: receipt.jpg  ← File di-upload dulu
- Lokasi: Otomatis ambil GPS/alamat saat ini
         ↓
Backend simpan:
- File receipt → Cloud Storage
- Data request → Database
- Lokasi → Disimpan di field "location"
```

### Manager Review:
```
Manager buka detail request:
- Bisa lihat jumlah uang
- Bisa lihat deskripsi
- Bisa KLIK "View Receipt" → Buka bukti foto
- Bisa lihat LOKASI (alamat lengkap + pin merah)
         ↓
Approve atau Reject
```

**Yang Baru:** 
- Field `location` disimpan (alamat lengkap)
- UI tampilkan dengan icon pin merah 📍
- Read-only (tidak bisa geser/zoom seperti map biasa)
- Ada badge "✓ Verified"

---

## 🔔 KENAPA NOTIFIKASI HANYA KE ORANG TERTENTU?

### System Design:
```javascript
Setiap notification punya field "userId"
Saat user buka dashboard, ambil userId dari login
Filter notifikasi: tampilkan HANYA yang userId match
```

### Contoh:
```
Employee Raisa (userId: "raisa-123") submit cuti
  → Notification dibuat dengan userId: "manager-budi-456"
  
Raisa buka dashboard:
  → getCurrentUserId() = "raisa-123"
  → getNotifications() filter where userId = "raisa-123"
  → Result: TIDAK ADA notif tentang request sendiri
  
Manager Budi buka dashboard:
  → getCurrentUserId() = "manager-budi-456"
  → getNotifications() filter where userId = "manager-budi-456"
  → Result: ADA notif "Raisa mengajukan cuti"
  
Employee Nadia (userId: "nadia-789") buka dashboard:
  → getCurrentUserId() = "nadia-789"
  → getNotifications() filter where userId = "nadia-789"
  → Result: TIDAK ADA notif (bukan request dia, bukan manager dia)
```

**Kesimpulan:** Setiap notif ditargetkan ke 1 user spesifik!

---

## 📊 Database Tables - Apa Isinya?

### Table: `hr_leave_requests`
| Column | Isi Data Contoh | Keterangan |
|--------|-----------------|------------|
| id | leave-001 | Unique ID |
| employee_id | raisa-uuid | Siapa yang ngajuin |
| leave_type | ANNUAL | Jenis cuti |
| start_date | 2025-11-25 | Tanggal mulai |
| end_date | 2025-11-27 | Tanggal selesai |
| total_days | 3 | Jumlah hari |
| reason | Liburan keluarga | Alasan |
| status | PENDING → APPROVED | Status perubahan |
| approved_by | manager-uuid | Siapa yang approve |
| approved_at | 2025-11-20 14:00 | Kapan di-approve |
| rejection_reason | NULL (kalau approved) | Alasan ditolak |

### Table: `hr_reimbursement_requests`
| Column | Isi Data Contoh | Keterangan |
|--------|-----------------|------------|
| id | reimb-001 | Unique ID |
| employee_id | raisa-uuid | Siapa yang klaim |
| reimbursement_type | TRANSPORTATION | Jenis reimburse |
| claim_date | 2025-11-20 | Tanggal klaim |
| amount | 150000.00 | Jumlah uang |
| currency | IDR | Mata uang |
| description | Transport ke klien | Deskripsi |
| receipt_file | https://storage/... | URL bukti foto |
| location | Jl. Sudirman No. 123 | **ALAMAT LENGKAP** ← NEW! |
| status | PENDING → APPROVED | Status |
| paid_at | NULL (belum dibayar) | Kapan dibayar |

### Table: `hr_attendances`
| Column | Isi Data Contoh | Keterangan |
|--------|-----------------|------------|
| id | att-001 | Unique ID |
| employee_id | raisa-uuid | Siapa yang absen |
| date | 2025-11-20 | Tanggal |
| check_in_time | 09:15:00 | Jam masuk |
| check_in_latitude | -6.865799 | Koordinat GPS |
| check_in_longitude | 107.574603 | Koordinat GPS |
| check_in_location | Jl. Geger Kalong Hilir | **ALAMAT LENGKAP** |
| check_out_time | 17:30:00 | Jam keluar |
| check_out_location | Jl. Geger Kalong Hilir | Alamat keluar |
| status | PRESENT | Status hadir |

---

## 🚀 API Endpoints - Apa Yang Dipanggil?

### For Employee:
```
POST /api/v1/leaves              → Submit cuti baru
GET  /api/v1/leaves/my           → List cuti saya
POST /api/v1/permissions         → Submit izin baru
POST /api/v1/overtime            → Submit lembur baru
POST /api/v1/reimbursements      → Submit reimburse baru
GET  /api/v1/attendances/my      → Riwayat absensi saya
POST /api/v1/attendances/check-in → Absen masuk
POST /api/v1/attendances/check-out → Absen keluar
```

### For Manager:
```
GET  /api/v1/approvals/team      → Pending requests dari team
GET  /api/v1/approvals/history   → History approved/rejected
PUT  /api/v1/leaves/:id/approve  → Approve cuti
PUT  /api/v1/leaves/:id/reject   → Reject cuti
(Similar untuk permission, overtime, reimbursement)
```

---

## 🎨 UI Components - Apa Yang Berubah?

### 1. SuccessNotification.tsx (POPUP)
**Kapan muncul:**
- Setelah submit request berhasil
- Setelah approve/reject berhasil

**Tampilannya:**
```
┌────────────────────────────────┐
│ ✓ Pengajuan Berhasil!          │
│                                │
│ Pengajuan Cuti Anda telah      │
│ berhasil dibuat dan menunggu   │
│ persetujuan                    │
│                                │
│ [Progress bar 4 detik...]      │
└────────────────────────────────┘
```

### 2. AttendanceToast.tsx (MODAL)
**Kapan muncul:**
- Setelah check-in berhasil
- Setelah check-out berhasil

**Tampilannya:**
```
┌────────────────────────────────┐
│  Absen Masuk Berhasil!         │
│                                │
│  ⏰ Jam: 09:15                 │
│  📍 Jl. Geger Kalong Hilir     │
└────────────────────────────────┘
```

### 3. Location Display (di Approvals Detail)
**Untuk reimbursement:**
```
┌────────────────────────────────────┐
│ Location:                          │
│ ┌────────────────────────────────┐ │
│ │ 📍  Jl. Sudirman No. 123,      │ │
│ │     Jakarta Pusat              │ │
│ │                                │ │
│ │ Submitted location  [✓ Verified]│ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Style:**
- Background gradient abu-abu
- Pin merah bulat dengan shadow
- Icon verified biru
- Read-only (tidak bisa diklik/drag)
- Menampilkan alamat lengkap hasil geocoding

---

## ✅ CHECKLIST - Apa Yang Sudah Dibuat?

- ✅ Alur data lengkap dari submit → approve
- ✅ Notification system dengan userId filtering
- ✅ Success popup untuk semua submit/approval
- ✅ Attendance toast untuk check-in/out
- ✅ Location display untuk reimbursement (dengan alamat)
- ✅ Receipt upload & view untuk reimbursement
- ✅ Database schema yang sesuai
- ✅ API endpoints untuk semua operations
- ✅ Role-based access (Employee vs Manager)

---

## 📖 Dokumentasi Lengkap

Ada 2 file dokumentasi detail:

1. **ALUR_DATA_HR_SYSTEM.md** 
   - Penjelasan teknis lengkap
   - Database schema
   - API endpoints
   - Security & validation

2. **VISUAL_DATA_FLOW.md**
   - Visual flow diagram
   - Contoh step-by-step
   - Screenshot UI mockup
   - Code examples

---

**🎉 SELESAI! Sistem HR miniERP dengan alur data yang jelas dan notification yang tepat sasaran!**
