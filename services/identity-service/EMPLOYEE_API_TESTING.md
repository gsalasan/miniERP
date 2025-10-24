# Employee API Testing Guide

## Endpoint: POST /employees

Creates an employee record in `employees` table and a corresponding user account in `users` table in a single atomic transaction.

### API Details
- **URL**: `http://localhost:3001/api/v1/employees`
- **Method**: POST
- **Content-Type**: application/json

### Example Request Payload

```json
{
  "email": "john.doe@company.com",
  "employee": {
    "full_name": "John Doe",
    "position": "HR Admin",
    "hire_date": "2025-10-23",
    "basic_salary": "10000000",
    "allowances": {
      "transport": 500000,
      "meal": 300000
    }
  },
  "user": {
    "email": "john.doe@company.com",
    "password": "SecurePass123!",
    "roles": ["EMPLOYEE"]
  }
}
```

### Position vs Roles Concept

**Position (Jabatan Nyata):**
- Bebas sesuai struktur organisasi perusahaan
- Contoh: "Manajer Keuangan", "Staff IT", "Direktur Utama", "Supervisor Gudang", "Sekretaris", "Driver", dll

**Roles (Akses Sistem):**
- Fixed list sesuai permission sistem
- Available roles: `CEO`, `FINANCE_ADMIN`, `SALES`, `SALES_MANAGER`, `PROJECT_MANAGER`, `PROJECT_ENGINEER`, `HR_ADMIN`, `EMPLOYEE`, `PROCUREMENT_ADMIN`, `ASSET_ADMIN`, `SYSTEM_ADMIN`

### Example Real-World Scenarios

**Contoh 1: Manajer Keuangan**
```json
{
  "email": "manajer.keuangan@company.com",
  "employee": {
    "full_name": "Budi Santoso",
    "position": "Manajer Keuangan",
    "hire_date": "2025-10-23",
    "basic_salary": "15000000",
    "allowances": { "transport": 800000, "management": 1000000 }
  },
  "user": {
    "email": "manajer.keuangan@company.com",
    "password": "SecurePass123!",
    "roles": ["FINANCE_ADMIN"]
  }
}
```

**Contoh 2: Direktur yang Handle Finance & Sales**
```json
{
  "email": "direktur@company.com",
  "employee": {
    "full_name": "Siti Rahayu",
    "position": "Direktur Operasional",
    "hire_date": "2025-10-23",
    "basic_salary": "25000000",
    "allowances": { "transport": 1500000, "directorial": 3000000 }
  },
  "user": {
    "email": "direktur@company.com",
    "password": "SecurePass123!",
    "roles": ["FINANCE_ADMIN", "SALES_MANAGER", "PROJECT_MANAGER"]
  }
}
```

**Contoh 3: Staff IT**
```json
{
  "email": "staff.it@company.com",
  "employee": {
    "full_name": "Ahmad Teknisi",
    "position": "Staff IT",
    "hire_date": "2025-10-23",
    "basic_salary": "8000000",
    "allowances": { "transport": 500000 }
  },
  "user": {
    "email": "staff.it@company.com",
    "password": "SecurePass123!",
    "roles": ["SYSTEM_ADMIN", "EMPLOYEE"]
  }
}
```

**Contoh 4: Sekretaris dengan Akses Basic**
```json
{
  "email": "sekretaris@company.com",
  "employee": {
    "full_name": "Maria Sekretaris",
    "position": "Sekretaris Direktur",
    "hire_date": "2025-10-23",
    "basic_salary": "6000000",
    "allowances": { "transport": 400000 }
  },
  "user": {
    "email": "sekretaris@company.com",
    "password": "SecurePass123!",
    "roles": ["EMPLOYEE"]
  }
}
```

### Testing Steps

1. **Start the service:**
   ```bash
   cd c:\Users\PC\miniERP\services\identity-service
   npm run dev
   ```

2. **Test successful creation (201):**
   Use the payload above in Postman

3. **Test duplicate email (409):**
   Run the same request again - should return conflict error

4. **Test invalid position (400):**
   Change position to "Software Engineer" - should return validation error

5. **Test validation errors (400):**
   Send request with missing required fields

### Expected Responses

**Success (201):**
```json
{
  "success": true,
  "message": "Employee and user account created successfully",
  "data": {
    "employee": {
      "id": "uuid",
      "full_name": "John Doe",
      "position": "HR Admin",
      "hire_date": "2025-10-23T00:00:00.000Z",
      "basic_salary": "10000000",
      "allowances": { "transport": 500000, "meal": 300000 }
    },
    "user": {
      "id": "uuid",
      "email": "john.doe@company.com",
      "roles": ["EMPLOYEE"],
      "employee_id": "uuid",
      "is_active": true
    }
  }
}
```

**Duplicate Email (409):**
```json
{
  "success": false,
  "message": "Email sudah terdaftar sebagai user"
}
```

**Invalid Roles Error (400):**
```json
{
  "success": false,
  "message": "Invalid roles: [INVALID_ROLE]. Valid roles: [CEO, FINANCE_ADMIN, SALES, SALES_MANAGER, PROJECT_MANAGER, PROJECT_ENGINEER, HR_ADMIN, EMPLOYEE, PROCUREMENT_ADMIN, ASSET_ADMIN, SYSTEM_ADMIN]"
}
```