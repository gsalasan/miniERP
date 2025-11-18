# Pipeline Status Transition Rules

## Endpoint

`PUT /api/v1/pipeline/move`

## Request Body

```json
{
  "projectId": "string (required)",
  "newStatus": "string (required, alphanumeric with underscores/dashes, max 100 chars)"
}
```

## Status Transition Flow

```
PROSPECT → MEETING_SCHEDULED → PRE_SALES → PROPOSAL_DELIVERED → NEGOTIATION → WON
   ↓             ↓                  ↓              ↓                  ↓
 LOST          LOST               LOST           LOST               LOST
```

## Allowed Transitions

| From Status        | To Status (Allowed)                         |
| ------------------ | ------------------------------------------- |
| PROSPECT           | MEETING_SCHEDULED, PRE_SALES, LOST          |
| MEETING_SCHEDULED  | PROSPECT, PRE_SALES, LOST                   |
| PRE_SALES          | MEETING_SCHEDULED, PROPOSAL_DELIVERED, LOST |
| PROPOSAL_DELIVERED | PRE_SALES, NEGOTIATION, LOST                |
| NEGOTIATION        | PROPOSAL_DELIVERED, WON, LOST               |
| WON                | _None (Final state)_                        |
| LOST               | _None (Final state)_                        |

## Special Business Rules

### 1. Estimation Approval Required

**Rule:** Cannot move from `PRE_SALES` to `PROPOSAL_DELIVERED` without approved estimation.

**Validation:**

```typescript
if (
  currentStatus === 'PRE_SALES' &&
  newStatus === 'PROPOSAL_DELIVERED' &&
  project.estimation_status !== 'APPROVED'
) {
  throw Error('Tidak bisa membuat proposal sebelum estimasi disetujui');
}
```

**Error Response:**

```json
{
  "error": "Business Rule Violation",
  "message": "Tidak bisa membuat proposal sebelum estimasi disetujui. Harap selesaikan dan approve estimasi terlebih dahulu."
}
```

### 2. Won Only from Negotiation

**Rule:** Project can only be marked as `WON` from `NEGOTIATION` status.

**Validation:**

```typescript
if (newStatus === 'WON' && currentStatus !== 'NEGOTIATION') {
  throw Error('Project hanya bisa dimenangkan (WON) dari tahap negosiasi.');
}
```

### 3. Final States Cannot Be Reopened

**Rule:** Once a project reaches `WON` or `LOST`, it cannot transition to any other status.

**Validation:**

```typescript
allowedTransitions['WON'] = [];
allowedTransitions['LOST'] = [];
```

## Authorization

### Role-Based Access

- **SALES**: Can only move their own projects
- **SALES_MANAGER**: Can move any project
- **CEO**: Can move any project

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You can only move your own projects"
}
```

#### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Project not found"
}
```

#### 422 Business Rule Violation

```json
{
  "error": "Business Rule Violation",
  "message": "Transisi status tidak valid: Tidak bisa berpindah dari \"Prospek\" ke \"Negosiasi\". Status yang diizinkan: Meeting Terjadwal, Pre-Sales, Kalah"
}
```

## Examples

### Valid Transition

```bash
curl -X PUT http://localhost:3002/api/v1/pipeline/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "abc123",
    "newStatus": "MEETING_SCHEDULED"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "project_name": "New Office Building",
    "status": "MEETING_SCHEDULED",
    ...
  },
  "message": "Project status successfully updated to MEETING_SCHEDULED"
}
```

### Invalid Transition (Skipping Steps)

```bash
curl -X PUT http://localhost:3002/api/v1/pipeline/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "abc123",
    "newStatus": "NEGOTIATION"
  }'
```

**Response (422):**

```json
{
  "error": "Business Rule Violation",
  "message": "Transisi status tidak valid: Tidak bisa berpindah dari \"Prospek\" ke \"Negosiasi\". Status yang diizinkan: Meeting Terjadwal, Pre-Sales, Kalah"
}
```

### Missing Estimation Approval

```bash
curl -X PUT http://localhost:3002/api/v1/pipeline/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "abc123",
    "newStatus": "PROPOSAL_DELIVERED"
  }'
```

**Response (422):**

```json
{
  "error": "Business Rule Violation",
  "message": "Tidak bisa membuat proposal sebelum estimasi disetujui. Harap selesaikan dan approve estimasi terlebih dahulu."
}
```

## Activity Logging

Every status transition creates an activity log entry:

```typescript
{
  project_id: "abc123",
  description: "Status changed from PROSPECT to MEETING_SCHEDULED by John Doe",
  created_at: "2025-11-17T10:30:00.000Z"
}
```

## Implementation Details

### Service Layer (`pipelineServices.ts`)

**Key Methods:**

- `moveProjectCard()` - Main method for moving project status
- `validateStatusTransition()` - Validates business rules
- `getStatusDisplayName()` - Gets user-friendly status names
- `createActivityLog()` - Creates audit trail

**Status Normalization:**
All status values are normalized to UPPERCASE for consistency:

```typescript
status: newStatus.toUpperCase();
```

### Controller Layer (`pipelineController.ts`)

**Input Validation:**

- Required fields: `projectId`, `newStatus`
- Status format: Alphanumeric with underscores/dashes, max 100 characters
- Regex: `/^[A-Za-z0-9_-]{1,100}$/`

**Error Handling:**

- 400: Bad request (validation errors)
- 401: Unauthorized
- 403: Forbidden (authorization)
- 404: Not found
- 422: Business rule violation
- 500: Internal server error

## Testing Checklist

- [ ] Valid forward transitions (PROSPECT → MEETING_SCHEDULED → etc.)
- [ ] Valid backward transitions (NEGOTIATION → PROPOSAL_DELIVERED)
- [ ] Invalid skip transitions (PROSPECT → NEGOTIATION)
- [ ] Estimation approval requirement (PRE_SALES → PROPOSAL_DELIVERED)
- [ ] Won only from negotiation rule
- [ ] Final state protection (WON/LOST cannot transition)
- [ ] Authorization checks (SALES can only move own projects)
- [ ] Activity log creation
- [ ] Input validation (invalid status format)
- [ ] Error messages are user-friendly
