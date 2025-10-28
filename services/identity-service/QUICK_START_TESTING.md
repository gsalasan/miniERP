# 🚀 Quick Start Testing Guide - Employee API

## Prerequisites
- ✅ Identity Service running on `http://localhost:3001`
- ✅ Postman installed (https://www.postman.com/downloads/)
- ✅ Database connected (PostgreSQL)

---

## 📥 Import Postman Collection

### Method 1: Direct Import
1. Open Postman
2. Click **Import** button (top-left)
3. Select **File** tab
4. Choose file: `postman_collection.json`
5. Click **Import**

### Method 2: Manual Setup
1. Create a new Collection in Postman
2. Add the requests manually from the collection file

---

## 🧪 Testing Workflow

### Step 1: Verify Service is Running
**Request:** `GET http://localhost:3001/health`

**Expected Response:**
```json
{
  "success": true,
  "message": "Identity Service is running",
  "timestamp": "2025-10-24T...",
  "service": "identity-service"
}
```

---

### Step 2: Test Get Employees Endpoint
**Request:** `GET http://localhost:3001/api/v1/employees`

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee endpoint is working",
  "note": "This would return employee list in full implementation"
}
```

---

### Step 3: Create Valid Employees
Run these requests in order:

#### 3.1 Create Alice Smith (Finance Manager)
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "alice.smith@company.com",
  "employee": {
    "full_name": "Alice Smith",
    "position": "Finance Manager",
    "hire_date": "2025-02-01",
    "basic_salary": "18000000",
    "allowances": {
      "transport": 750000,
      "meal": 1500000,
      "communication": 300000
    }
  },
  "user": {
    "email": "alice.smith@company.com",
    "password": "Alice@2025Secure",
    "roles": ["FINANCE_ADMIN", "EMPLOYEE"]
  }
}
```

**Expected: 201 Created** ✅

#### 3.2 Create Bob Johnson (HR Admin)
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "bob.johnson@company.com",
  "employee": {
    "full_name": "Bob Johnson",
    "position": "HR Administrator",
    "hire_date": "2025-03-01",
    "basic_salary": "16000000",
    "allowances": {
      "transport": 500000,
      "meal": 1000000
    }
  },
  "user": {
    "email": "bob.johnson@company.com",
    "password": "Bob@2025Secure",
    "roles": ["HR_ADMIN", "EMPLOYEE"]
  }
}
```

**Expected: 201 Created** ✅

#### 3.3 Create Charlie Brown (Senior Engineer)
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "charlie.brown@company.com",
  "employee": {
    "full_name": "Charlie Brown",
    "position": "Senior Software Engineer",
    "hire_date": "2025-01-15",
    "basic_salary": "20000000",
    "allowances": {
      "transport": 750000,
      "meal": 1500000,
      "communication": 400000,
      "technical": 2000000
    }
  },
  "user": {
    "email": "charlie.brown@company.com",
    "password": "Charlie@2025Secure",
    "roles": ["PROJECT_ENGINEER", "PROJECT_MANAGER"]
  }
}
```

**Expected: 201 Created** ✅

#### 3.4 Create Diana Prince (Sales Manager)
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "diana.prince@company.com",
  "employee": {
    "full_name": "Diana Prince",
    "position": "Sales Manager",
    "hire_date": "2025-04-01",
    "basic_salary": "17500000",
    "allowances": {
      "transport": 600000,
      "meal": 1200000,
      "commission": 1000000
    }
  },
  "user": {
    "email": "diana.prince@company.com",
    "password": "Diana@2025Secure",
    "roles": ["SALES_MANAGER", "SALES"]
  }
}
```

**Expected: 201 Created** ✅

---

### Step 4: Test Error Cases

#### Error Case 1: Missing Email Field
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "employee": {
    "full_name": "Test User",
    "position": "Developer",
    "hire_date": "2025-01-01",
    "basic_salary": "15000000"
  },
  "user": {
    "email": "test@company.com",
    "password": "Test@2025",
    "roles": ["EMPLOYEE"]
  }
}
```

**Expected: 400 Bad Request** ❌
```json
{
  "success": false,
  "message": "Request body must contain \"employee\", \"user\", and \"email\" fields"
}
```

#### Error Case 2: Missing Required Field (full_name)
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "test@company.com",
  "employee": {
    "position": "Developer",
    "hire_date": "2025-01-01",
    "basic_salary": "15000000"
  },
  "user": {
    "email": "test@company.com",
    "password": "Test@2025",
    "roles": ["EMPLOYEE"]
  }
}
```

**Expected: 400 Bad Request** ❌
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": ["employee.full_name is required"]
}
```

#### Error Case 3: Email Mismatch
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "alice@company.com",
  "employee": {
    "full_name": "Test User",
    "position": "Developer",
    "hire_date": "2025-01-01",
    "basic_salary": "15000000"
  },
  "user": {
    "email": "bob@company.com",
    "password": "Test@2025",
    "roles": ["EMPLOYEE"]
  }
}
```

**Expected: 400 Bad Request** ❌
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": ["email and user.email must be the same"]
}
```

#### Error Case 4: Duplicate Email (Run after creating Alice)
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "alice.smith@company.com",
  "employee": {
    "full_name": "Alice Smith 2",
    "position": "Project Manager",
    "hire_date": "2025-05-01",
    "basic_salary": "17000000"
  },
  "user": {
    "email": "alice.smith@company.com",
    "password": "Pass@2025",
    "roles": ["PROJECT_MANAGER"]
  }
}
```

**Expected: 409 Conflict** ❌
```json
{
  "success": false,
  "message": "Email sudah terdaftar sebagai user"
}
```

#### Error Case 5: Invalid Role
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "test@company.com",
  "employee": {
    "full_name": "Test User",
    "position": "Developer",
    "hire_date": "2025-01-01",
    "basic_salary": "15000000"
  },
  "user": {
    "email": "test@company.com",
    "password": "Test@2025",
    "roles": ["INVALID_ROLE"]
  }
}
```

**Expected: 400 Bad Request** ❌
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": ["Invalid roles: [INVALID_ROLE]. Valid roles: [CEO, FINANCE_ADMIN, ...]"]
}
```

#### Error Case 6: Empty Roles Array
```bash
POST http://localhost:3001/api/v1/employees
Content-Type: application/json

{
  "email": "test@company.com",
  "employee": {
    "full_name": "Test User",
    "position": "Developer",
    "hire_date": "2025-01-01",
    "basic_salary": "15000000"
  },
  "user": {
    "email": "test@company.com",
    "password": "Test@2025",
    "roles": []
  }
}
```

**Expected: 400 Bad Request** ❌
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": ["user.roles is required and must be a non-empty array"]
}
```

---

## 📋 Valid Roles List

Choose one or more from:
- `CEO`
- `FINANCE_ADMIN`
- `SALES`
- `SALES_MANAGER`
- `PROJECT_MANAGER`
- `PROJECT_ENGINEER`
- `HR_ADMIN`
- `EMPLOYEE` (default)
- `PROCUREMENT_ADMIN`
- `ASSET_ADMIN`
- `SYSTEM_ADMIN`

---

## 💾 Request/Response Examples

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Employee and user account created successfully",
  "data": {
    "employee": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "Alice Smith",
      "position": "Finance Manager",
      "hire_date": "2025-02-01T00:00:00.000Z",
      "basic_salary": 18000000,
      "allowances": {
        "transport": 750000,
        "meal": 1500000,
        "communication": 300000
      }
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "alice.smith@company.com",
      "roles": ["FINANCE_ADMIN", "EMPLOYEE"],
      "employee_id": "550e8400-e29b-41d4-a716-446655440000",
      "is_active": true,
      "created_at": "2025-10-24T10:30:45.123Z",
      "updated_at": "2025-10-24T10:30:45.123Z"
    }
  }
}
```

---

## 🔍 Troubleshooting

### Issue: Connection Refused
**Solution:** Make sure Identity Service is running
```bash
npm run dev:identity
```

### Issue: Database Error
**Ensure DATABASE_URL is set in .env:**
```
DATABASE_URL="postgresql://postgres:anisa252502@localhost:5432/minierp_unais?schema=public"
JWT_SECRET=minierpsecret
PORT=3001
```

### Issue: 500 Internal Server Error
**Check console logs** in the service terminal for error details

---

## ✅ Testing Checklist

- [ ] Health check endpoint returns 200
- [ ] Get employees endpoint returns 200
- [ ] Create Alice Smith - 201 Created
- [ ] Create Bob Johnson - 201 Created
- [ ] Create Charlie Brown - 201 Created
- [ ] Create Diana Prince - 201 Created
- [ ] Error: Missing email - 400
- [ ] Error: Missing full_name - 400
- [ ] Error: Email mismatch - 400
- [ ] Error: Duplicate email - 409
- [ ] Error: Invalid role - 400
- [ ] Error: Empty roles array - 400

---

## 📞 Support

For detailed documentation, see:
- `EMPLOYEE_API_TESTING.md` - Full API documentation
- `postman_collection.json` - Postman collection for import
- `API_TESTING.md` - General API testing guide
