# Identity Service API Testing Guide

## Server Information
- Service: Identity Service
- Port: 3001
- Health Check: http://localhost:3001/health
- Base API URL: http://localhost:3001/api/v1/auth

## Available Endpoints

### 1. Health Check
```
GET http://localhost:3001/health
```

### 2. User Registration
```
POST http://localhost:3001/api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "roles": ["EMPLOYEE"],
  "employee_id": "EMP001"
}
```

### 3. User Login
```
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 4. Get Current User (Protected)
```
GET http://localhost:3001/api/v1/auth/me
Authorization: Bearer <your-jwt-token>
```

## Testing with cURL Commands

### Health Check
```bash
curl -X GET http://localhost:3001/health
```

### Register User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "roles": ["EMPLOYEE"]
  }'
```

### Login User
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get User Profile (replace TOKEN with actual token)
```bash
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Testing with PowerShell

### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
```

### Register User
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    roles = @("EMPLOYEE")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### Login User
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
```

## Available User Roles
- CEO
- FINANCE_ADMIN
- SALES
- SALES_MANAGER
- PROJECT_MANAGER
- PROJECT_ENGINEER
- HR_ADMIN
- EMPLOYEE
- PROCUREMENT_ADMIN
- ASSET_ADMIN
- SYSTEM_ADMIN

## Environment Variables
Make sure these are set in your `.env` file:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:3000)