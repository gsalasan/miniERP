# HR Requests API Testing Guide

Complete guide for testing HR Requests endpoints in Postman.

## Prerequisites

1. **HR Service** must be running on port `4004`
   ```bash
   npm run dev:hr
   ```

2. **Get Authentication Token** first by logging in:
   - **POST** `http://localhost:4001/api/v1/auth/login`
   - Body:
     ```json
     {
       "email": "nadia.omara@minierp.com",
       "password": "password123"
     }
     ```
   - Copy the `token` from response

3. **Add Token to Headers** for all requests below:
   - Key: `Authorization`
   - Value: `Bearer <your_token_here>`

---

## 1. PERMISSION REQUESTS

### 1.1 Create Permission Request
**POST** `http://localhost:4004/api/v1/permissions`

**Body:**
```json
{
  "permission_type": "PERSONAL",
  "start_time": "2024-11-18T09:00:00Z",
  "end_time": "2024-11-18T12:00:00Z",
  "duration_hours": 3,
  "reason": "Keperluan pribadi"
}
```

**Permission Types:**
- `PERSONAL` - Keperluan pribadi
- `MEDICAL` - Ke dokter/rumah sakit
- `FAMILY_EMERGENCY` - Darurat keluarga
- `OFFICIAL_BUSINESS` - Urusan kantor
- `OTHER` - Lainnya

---

### 1.2 Get My Permission Requests
**GET** `http://localhost:4004/api/v1/permissions/my`

**Optional Query Params:**
- `?status=PENDING` - Filter by status
- `?status=APPROVED`
- `?status=REJECTED`

---

### 1.3 Get All Permission Requests (HR/Manager)
**GET** `http://localhost:4004/api/v1/permissions`

**Optional Query Params:**
- `?status=PENDING` - Filter by status
- `?page=1` - Page number
- `?limit=10` - Items per page

---

### 1.4 Get Permission by ID
**GET** `http://localhost:4004/api/v1/permissions/<permission_id>`

Replace `<permission_id>` with actual ID from create response.

---

### 1.5 Approve Permission Request
**PUT** `http://localhost:4004/api/v1/permissions/<permission_id>/status`

**Body:**
```json
{
  "status": "APPROVED"
}
```

---

### 1.6 Reject Permission Request
**PUT** `http://localhost:4004/api/v1/permissions/<permission_id>/status`

**Body:**
```json
{
  "status": "REJECTED",
  "rejection_reason": "Jadwal tidak memungkinkan"
}
```

---

### 1.7 Cancel Permission Request
**POST** `http://localhost:4004/api/v1/permissions/<permission_id>/cancel`

No body required. Only employee who created the request can cancel.

---

## 2. OVERTIME REQUESTS

### 2.1 Create Overtime Request
**POST** `http://localhost:4004/api/v1/overtimes`

**Body:**
```json
{
  "overtime_code": "L2",
  "overtime_date": "2024-11-18",
  "start_time": "2024-11-18T18:00:00Z",
  "end_time": "2024-11-18T22:00:00Z",
  "duration_hours": 4,
  "description": "Menyelesaikan laporan bulanan"
}
```

**Overtime Codes:**
- `L1` - Lembur Weekday 8 jam (duration_hours must be 8)
- `L2` - Lembur Weekday 4 jam (duration_hours must be 4)
- `L3` - Lembur Weekend 8 jam (duration_hours must be 8)
- `L4` - Lembur Weekend 4 jam (duration_hours must be 4)

**Important:** Duration must match the overtime code!

---

### 2.2 Get My Overtime Requests
**GET** `http://localhost:4004/api/v1/overtimes/my`

**Optional Query Params:**
- `?status=PENDING`
- `?status=APPROVED`
- `?status=REJECTED`

---

### 2.3 Get All Overtime Requests (HR/Manager)
**GET** `http://localhost:4004/api/v1/overtimes`

**Optional Query Params:**
- `?status=PENDING`
- `?page=1`
- `?limit=10`

---

### 2.4 Get Overtime by ID
**GET** `http://localhost:4004/api/v1/overtimes/<overtime_id>`

---

### 2.5 Approve Overtime Request
**PUT** `http://localhost:4004/api/v1/overtimes/<overtime_id>/status`

**Body:**
```json
{
  "status": "APPROVED"
}
```

---

### 2.6 Reject Overtime Request
**PUT** `http://localhost:4004/api/v1/overtimes/<overtime_id>/status`

**Body:**
```json
{
  "status": "REJECTED",
  "rejection_reason": "Budget lembur bulan ini sudah habis"
}
```

---

### 2.7 Cancel Overtime Request
**POST** `http://localhost:4004/api/v1/overtimes/<overtime_id>/cancel`

No body required.

---

## 3. REIMBURSEMENT REQUESTS

### 3.1 Create Reimbursement Request
**POST** `http://localhost:4004/api/v1/reimbursements`

**Body:**
```json
{
  "reimbursement_type": "TRANSPORTATION",
  "claim_date": "2024-11-18",
  "amount": 150000,
  "currency": "IDR",
  "description": "Transportasi untuk meeting client di Jakarta",
  "receipt_file": "receipts/transport-nov18.pdf"
}
```

**Reimbursement Types:**
- `TRANSPORTATION` - Transport
- `MEALS` - Makan
- `ACCOMMODATION` - Akomodasi/hotel
- `COMMUNICATION` - Pulsa/internet
- `MEDICAL` - Pengobatan
- `OFFICE_SUPPLIES` - Alat tulis kantor
- `TRAINING` - Pelatihan
- `OTHER` - Lainnya

**Currencies:**
- `IDR` - Indonesian Rupiah (default)
- `USD` - US Dollar
- `EUR` - Euro
- etc.

---

### 3.2 Get My Reimbursement Requests
**GET** `http://localhost:4004/api/v1/reimbursements/my`

**Optional Query Params:**
- `?status=PENDING`
- `?status=APPROVED`
- `?status=REJECTED`

---

### 3.3 Get All Reimbursement Requests (HR/Manager)
**GET** `http://localhost:4004/api/v1/reimbursements`

**Optional Query Params:**
- `?status=PENDING`
- `?page=1`
- `?limit=10`

---

### 3.4 Get Reimbursement by ID
**GET** `http://localhost:4004/api/v1/reimbursements/<reimbursement_id>`

---

### 3.5 Approve Reimbursement Request
**PUT** `http://localhost:4004/api/v1/reimbursements/<reimbursement_id>/status`

**Body:**
```json
{
  "status": "APPROVED"
}
```

---

### 3.6 Reject Reimbursement Request
**PUT** `http://localhost:4004/api/v1/reimbursements/<reimbursement_id>/status`

**Body:**
```json
{
  "status": "REJECTED",
  "rejection_reason": "Bukti pembayaran tidak lengkap"
}
```

---

### 3.7 Cancel Reimbursement Request
**POST** `http://localhost:4004/api/v1/reimbursements/<reimbursement_id>/cancel`

No body required.

---

### 3.8 Mark Reimbursement as Paid
**PUT** `http://localhost:4004/api/v1/reimbursements/<reimbursement_id>/paid`

**Body:**
```json
{
  "paid_at": "2024-11-20T10:00:00Z"
}
```

Only for Finance/HR Admin after the reimbursement has been transferred.

---

## Testing Flow Example

### Complete Flow for Permission Request:

1. **Employee creates permission request**
   - POST `/api/v1/permissions`
   - Get `permission_id` from response

2. **Employee views their own requests**
   - GET `/api/v1/permissions/my`

3. **HR/Manager views all pending requests**
   - GET `/api/v1/permissions?status=PENDING`

4. **HR/Manager views specific request details**
   - GET `/api/v1/permissions/<permission_id>`

5. **HR/Manager approves or rejects**
   - PUT `/api/v1/permissions/<permission_id>/status`

6. **Employee can cancel (only if still PENDING)**
   - POST `/api/v1/permissions/<permission_id>/cancel`

---

## Response Status Codes

- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Internal Server Error

---

## Request Status Values

All requests use these status values:
- `PENDING` - Menunggu approval
- `APPROVED` - Disetujui
- `REJECTED` - Ditolak
- `CANCELLED` - Dibatalkan oleh employee

---

## Common Error Messages

### "HR employee record not found for this user"
- User not linked to employee record
- Check if employee exists in `employees` table

### "Foreign key constraint violated"
- Employee ID doesn't exist
- Make sure you're using valid employee_id

### "Only pending requests can be cancelled"
- Request already approved/rejected
- Can only cancel PENDING requests

### "Duration mismatch" (Overtime)
- Overtime code doesn't match duration
- L1/L3 must be 8 hours, L2/L4 must be 4 hours

### "Unauthorized"
- Token missing or invalid
- Token expired (login again)

---

## Tips

1. **Always check HR service is running** before testing
2. **Use valid token** - login first to get fresh token
3. **Copy IDs from responses** - use them in subsequent requests
4. **Check response messages** - they contain helpful information
5. **Test status filters** - helps HR/Manager find specific requests
6. **Test pagination** - for listing endpoints with many records

---

## Postman Collection

You can import the provided Postman collection for easier testing:
- `docs/hr-requests/HR Requests.postman_collection.json`

---

## Contact

For issues or questions, contact the development team.
