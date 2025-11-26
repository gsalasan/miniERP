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
Employee API testing documentation removed from identity-service.
Employee CRUD now belongs to the HR service (`services/hr-service`).
Refer to `services/hr-service/README.md` or `services/hr-service/src/routes/employee.routes.ts` for endpoints and examples.