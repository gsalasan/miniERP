# Identity Service - Quick Start

Identity Service is now focused on authentication and authorization only. Employee CRUD endpoints were moved to the HR service.

What this repo serves now:

- `GET /health` - health check for the identity service
- `POST /api/v1/auth/*` - authentication routes (login, refresh, logout)

If you need to manage employees (create, update, delete), use the HR service endpoints:

- `services/hr-service` contains the full employee CRUD implementation and routes (`/api/v1/employees`).

For developer/testing guidance on employee endpoints, see `services/hr-service/HR_EMPLOYEE_API_TESTING.md`.
3. Select **File** tab
