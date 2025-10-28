# HR Service Employee API Testing Guide

## Service Information
- **Service**: HR Service (Human Resources)
- **Base URL**: `http://localhost:3003/api/v1`
- **Purpose**: Manage employee data and HR operations

## Endpoint: POST /employees

Creates an HR employee record in `hr_employees` table and a corresponding user account in `users` table in a single atomic transaction.

### Request Details
- **URL**: `http://localhost:3003/api/v1/employees`
- **Method**: POST
- **Content-Type**: `application/json`

### Request Body Example
```json
{
  "employee": {
    "employee_id": "EMP001",
    "full_name": "John Doe",
    "email": "john.doe@company.com",
    "position": "Software Engineer",
    "department": "IT",
    "hire_date": "2024-01-15",
    "basic_salary": 8000000,
    "allowances": {
      "transport": 500000,
      "meal": 300000
    },
    "status": "ACTIVE"
  },
  "user": {
    "email": "john.doe@company.com",
    "password": "password123",
    "roles": ["EMPLOYEE"]
  },
  "email": "john.doe@company.com"
}
```

### Field Descriptions

#### Employee Fields (Required)
- `employee_id`: Unique employee identifier (e.g., "EMP001")
- `full_name`: Employee's full name
- `email`: Employee's email address
- `position`: Job position/title
- `department`: Department name (e.g., "IT", "Finance", "HR")
- `hire_date`: Date of hiring (YYYY-MM-DD format)
- `basic_salary`: Basic salary amount (number)
- `status`: Employee status ("ACTIVE", "INACTIVE", "TERMINATED")

#### Employee Fields (Optional)
- `allowances`: JSON object containing allowance details

#### User Fields (Required)
- `email`: Must match employee email
- `password`: Plain text password (will be hashed)
- `roles`: Array of user roles

#### Shared Fields
- `email`: Must be consistent across employee, user, and root level

### Available Roles
- Available roles: `CEO`, `FINANCE_ADMIN`, `SALES`, `SALES_MANAGER`, `PROJECT_MANAGER`, `PROJECT_ENGINEER`, `HR_ADMIN`, `EMPLOYEE`, `PROCUREMENT_ADMIN`, `ASSET_ADMIN`, `SYSTEM_ADMIN`

### Success Response (201)
```json
{
  "success": true,
  "message": "Employee and user account created successfully",
  "data": {
    "employee": {
      "employee_id": "EMP001",
      "full_name": "John Doe",
      "email": "john.doe@company.com",
      "position": "Software Engineer",
      "department": "IT",
      "hire_date": "2024-01-15T00:00:00.000Z",
      "basic_salary": 8000000,
      "allowances": {
        "transport": 500000,
        "meal": 300000
      },
      "status": "ACTIVE",
      "created_at": "2024-10-24T08:30:00.000Z",
      "updated_at": "2024-10-24T08:30:00.000Z"
    },
    "user": {
      "id": "user_123",
      "email": "john.doe@company.com",
      "roles": ["EMPLOYEE"],
      "employee_id": "EMP001",
      "is_active": true,
      "created_at": "2024-10-24T08:30:00.000Z",
      "updated_at": "2024-10-24T08:30:00.000Z"
    }
  }
}
```

## Other Available Endpoints

### GET /employees/list/all
- **Purpose**: Get all employees with user information
- **URL**: `http://localhost:3003/api/v1/employees/list/all`
- **Method**: GET

### GET /employees/:id
- **Purpose**: Get specific employee by ID
- **URL**: `http://localhost:3003/api/v1/employees/EMP001`
- **Method**: GET

### PUT /employees/:id
- **Purpose**: Update employee information
- **URL**: `http://localhost:3003/api/v1/employees/EMP001`
- **Method**: PUT

### PUT /employees/:id/user
- **Purpose**: Update employee user roles and status
- **URL**: `http://localhost:3003/api/v1/employees/EMP001/user`
- **Method**: PUT

### DELETE /employees/:id
- **Purpose**: Delete employee and associated user
- **URL**: `http://localhost:3003/api/v1/employees/EMP001`
- **Method**: DELETE

## Testing with PowerShell

```powershell
# Create new employee
$body = @{
    employee = @{
        employee_id = "EMP001"
        full_name = "John Doe"
        email = "john.doe@company.com"
        position = "Software Engineer"
        department = "IT"
        hire_date = "2024-01-15"
        basic_salary = 8000000
        allowances = @{
            transport = 500000
            meal = 300000
        }
        status = "ACTIVE"
    }
    user = @{
        email = "john.doe@company.com"
        password = "password123"
        roles = @("EMPLOYEE")
    }
    email = "john.doe@company.com"
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3003/api/v1/employees" -Method POST -Body $body -ContentType "application/json"
```

## Important Notes

1. **Database Tables**: Uses `hr_employees` table (not `employees`)
2. **Employee ID**: Must be unique across all HR employees
3. **Email Consistency**: Email must be the same in employee, user, and root level
4. **Transaction Safety**: Employee and user creation happens in a single transaction
5. **Department**: Free text field for department names
6. **Salary**: Stored as decimal/float for precise calculations
7. **Status**: Enum with ACTIVE, INACTIVE, TERMINATED values