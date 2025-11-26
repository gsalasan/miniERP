# HR Requests API Testing Guide

Gunakan folder ini sebagai pusat dokumentasi & koleksi Postman untuk pengajuan HR (izin, lembur, klaim).

## 1. Prasyarat
- HR Service berjalan (`npm run dev:hr`)
- Auth Service berjalan (`npm run dev:identity` atau service login lain)
- Database sudah dimigrasikan (tabel `hr_permission_requests`, `hr_overtime_requests`, `hr_reimbursement_requests`)
- Akun yang dipakai login sudah dihubungkan ke record `employees` (punya `employee_id` valid). Kalau belum, buat employee-nya dulu supaya request tidak gagal karena foreign key.
- Postman / Thunder Client

## 2. Alur Testing Backend (Postman)

1. **Login & ambil token**
   - `POST http://localhost:3001/api/v1/auth/login`
   - Body JSON: `{ "email": "user@domain.com", "password": "password" }
   - Salin `token`, masukkan ke tab Authorization (Bearer) pada semua request berikutnya.

2. **Permission Requests**
   - Create: `POST http://localhost:4004/api/v1/permissions` (gunakan salah satu `permission_type`: `PERSONAL`, `MEDICAL`, `FAMILY_EMERGENCY`, `OFFICIAL_BUSINESS`, `OTHER` – jangan kopas seluruh list)
   - My list: `GET http://localhost:4004/api/v1/permissions/my`
   - Approval list: `GET http://localhost:4004/api/v1/permissions?status=PENDING`
   - Approve/Reject: `PUT http://localhost:4004/api/v1/permissions/{id}/status`
   - Cancel: `POST http://localhost:4004/api/v1/permissions/{id}/cancel`

3. **Overtime Requests**
   - Create: `POST http://localhost:4004/api/v1/overtimes` (`overtime_code` harus salah satu dari `L1`, `L2`, `L3`, `L4` sesuai tabel kode)
   - My list: `GET http://localhost:4004/api/v1/overtimes/my`
   - Approval list: `GET http://localhost:4004/api/v1/overtimes?status=PENDING`
   - Approve/Reject: `PUT http://localhost:4004/api/v1/overtimes/{id}/status`
   - Cancel: `POST http://localhost:4004/api/v1/overtimes/{id}/cancel`

4. **Reimbursement Requests**
   - Create: `POST http://localhost:4004/api/v1/reimbursements` (pilih satu `reimbursement_type`, contoh `TRANSPORTATION`, `MEALS`, dll)
   - My list: `GET http://localhost:4004/api/v1/reimbursements/my`
   - Approval list: `GET http://localhost:4004/api/v1/reimbursements?status=PENDING`
   - Approve/Reject: `PUT http://localhost:4004/api/v1/reimbursements/{id}/status`
   - Mark Paid: `POST http://localhost:4004/api/v1/reimbursements/{id}/paid`
   - Cancel: `POST http://localhost:4004/api/v1/reimbursements/{id}/cancel`

## 3. Koleksi Postman
Import file `HR Requests.postman_collection.json` di folder ini.

## 4. Setelah Backend OK
- Buka frontend `http://localhost:3000/my-requests`
- Gunakan form untuk membuat izin/lembur/klaim (harus match hasil Postman)
- Approver gunakan `/approvals`

Catatan: format datetime harus ISO-8601 (contoh `2025-11-17T00:00:00.000Z`).
