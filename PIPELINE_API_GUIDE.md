# Pipeline API Documentation

## Overview

API untuk mengelola Sales Pipeline (Kanban Visual) dalam sistem CRM. Menyediakan endpoint untuk melihat dan memindahkan opportunity/project dalam tahapan penjualan.

## Authentication

Semua endpoint memerlukan JWT authentication dengan header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. GET /api/v1/pipeline

Mengambil data pipeline yang dikelompokkan berdasarkan status.

#### Request

```http
GET /api/v1/pipeline
Authorization: Bearer <token>
```

#### Authorization

- **Sales**: Hanya melihat project yang ditugaskan kepada mereka
- **Sales Manager/CEO**: Melihat semua project

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "pipeline": {
      "PROSPECT": {
        "items": [
          {
            "id": "uuid",
            "project_name": "Instalasi CCTV PT. ABC",
            "description": "Proyek instalasi sistem keamanan",
            "customer": {
              "id": "customer-uuid",
              "name": "PT. ABC Sejahtera",
              "city": "Jakarta"
            },
            "estimated_value": 50000000,
            "contract_value": null,
            "lead_score": 7,
            "estimation_status": "PENDING",
            "priority": "HIGH",
            "expected_close_date": "2025-12-31T00:00:00.000Z",
            "sales_user_id": "sales-uuid",
            "created_at": "2025-11-01T00:00:00.000Z",
            "updated_at": "2025-11-04T00:00:00.000Z"
          }
        ],
        "totalValue": 50000000
      },
      "MEETING_SCHEDULED": {
        "items": [],
        "totalValue": 0
      },
      "PRE_SALES": {
        "items": [],
        "totalValue": 0
      },
      "PROPOSAL_DELIVERED": {
        "items": [],
        "totalValue": 0
      },
      "NEGOTIATION": {
        "items": [],
        "totalValue": 0
      }
    },
    "summary": {
      "totalOpportunities": 1,
      "totalValue": 50000000,
      "currency": "IDR"
    }
  }
}
```

#### Response Error (401)

```json
{
  "error": "Unauthorized"
}
```

#### Response Error (403)

```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 2. PUT /api/v1/pipeline/move

Memindahkan project card dari satu kolom ke kolom lain dalam pipeline.

#### Request

```http
PUT /api/v1/pipeline/move
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "uuid-project-id",
  "newStatus": "MEETING_SCHEDULED"
}
```

#### Request Body

| Field     | Type   | Required | Description                 |
| --------- | ------ | -------- | --------------------------- |
| projectId | string | Yes      | UUID of the project to move |
| newStatus | string | Yes      | New status for the project  |

#### Valid Status Values

- `PROSPECT`
- `MEETING_SCHEDULED`
- `PRE_SALES`
- `PROPOSAL_DELIVERED`
- `NEGOTIATION`
- `WON`
- `LOST`
- `ON_HOLD`

#### Authorization

- **Sales**: Hanya dapat memindahkan project yang ditugaskan kepada mereka
- **Sales Manager/CEO**: Dapat memindahkan semua project

#### Business Rules

- Tidak dapat memindahkan status dari `PRE_SALES` ke `PROPOSAL_DELIVERED` jika `estimation_status` bukan `APPROVED`

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_name": "Instalasi CCTV PT. ABC",
    "description": "Proyek instalasi sistem keamanan",
    "customer": {
      "id": "customer-uuid",
      "name": "PT. ABC Sejahtera",
      "city": "Jakarta"
    },
    "status": "MEETING_SCHEDULED",
    "estimated_value": 50000000,
    "contract_value": null,
    "lead_score": 7,
    "estimation_status": "PENDING",
    "priority": "HIGH",
    "expected_close_date": "2025-12-31T00:00:00.000Z",
    "updated_at": "2025-11-04T10:30:00.000Z"
  },
  "message": "Project status successfully updated from PROSPECT to MEETING_SCHEDULED"
}
```

#### Response Error (400)

```json
{
  "error": "Bad Request",
  "message": "projectId and newStatus are required"
}
```

#### Response Error (400) - Invalid Status

```json
{
  "error": "Bad Request",
  "message": "Invalid status provided"
}
```

#### Response Error (400) - Business Rule

```json
{
  "error": "Business Rule Violation",
  "message": "Tidak bisa membuat proposal sebelum estimasi disetujui"
}
```

#### Response Error (403)

```json
{
  "error": "Forbidden: You can only move your own projects"
}
```

#### Response Error (404)

```json
{
  "error": "Project not found"
}
```

## Database Models

### Project Model

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name VARCHAR NOT NULL,
  description TEXT,
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_user_id UUID NOT NULL,
  status ProjectStatus DEFAULT 'PROSPECT',
  estimated_value DECIMAL(15,2),
  contract_value DECIMAL(15,2),
  lead_score INTEGER DEFAULT 0,
  estimation_status EstimationStatus DEFAULT 'PENDING',
  priority ProjectPriority DEFAULT 'MEDIUM',
  start_date TIMESTAMP,
  expected_close_date TIMESTAMP,
  actual_close_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);
```

### Project Activity Model

```sql
CREATE TABLE project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity_type ActivityType NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

## Testing

### Using HTML Test Page

Open `test-pipeline-api.html` in your browser and:

1. Enter your JWT token
2. Set the base URL (default: http://localhost:3002)
3. Test GET pipeline endpoint
4. Create sample project data
5. Test PUT pipeline move endpoint

### Using PowerShell Script

```powershell
# Run with token parameter
.\test-pipeline-api.ps1 -Token "your-jwt-token"

# Or run and enter token interactively
.\test-pipeline-api.ps1
```

### Using cURL

```bash
# Get pipeline
curl -X GET "http://localhost:3002/api/v1/pipeline" \
  -H "Authorization: Bearer your-jwt-token"

# Move project
curl -X PUT "http://localhost:3002/api/v1/pipeline/move" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"uuid","newStatus":"MEETING_SCHEDULED"}'
```

## Implementation Notes

1. **Activity Logging**: Setiap perubahan status akan tercatat di `project_activities` table
2. **Role-based Access**: Sales hanya bisa melihat/mengubah project mereka sendiri
3. **Business Rules**: Validasi business logic saat perpindahan status
4. **Performance**: Query menggunakan include untuk mengurangi N+1 queries
5. **Error Handling**: Comprehensive error responses dengan status codes yang tepat

## Next Steps

1. Generate Prisma migration: `npx prisma migrate dev`
2. Seed sample data untuk testing
3. Implementasi frontend Kanban board dengan react-beautiful-dnd
4. Tambahkan endpoint untuk CRUD project
5. Implementasi real-time updates dengan WebSocket
