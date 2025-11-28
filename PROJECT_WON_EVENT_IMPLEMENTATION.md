# Project.Won Event Listener - Implementation Summary

## ✅ Status: COMPLETED

Implementasi event listener untuk mendengarkan event `project.won` dan otomatis membuat Project Workspace telah selesai dikerjakan.

---

## 📋 Requirements

**Original Request:**
> "Implementasikan event listener di Project Management Service yang 'mendengarkan' event project.won. Saat event diterima, buat logika untuk secara otomatis membuat Project Workspace (bisa berupa record baru di tabel projects dengan status 'Planning')."

---

## ✅ Implementation Details

### 1. Event Listener Class
**File:** `services/project-service/src/events/projectEventListener.ts`

**Features Implemented:**
- ✅ Menerima event `project.won` dari CRM service atau service lain
- ✅ **Otomatis membuat Project Workspace** dengan status `'Planning'`
- ✅ Generate project number otomatis (format: `PRJ-YYYYMMDD-XXX`)
- ✅ Support update project existing (jika projectId dikirim) atau create new
- ✅ Menyimpan semua data relevan: customer, sales user, SO details, value
- ✅ Create activity log untuk audit trail
- ✅ Kirim notifikasi ke Operational Managers untuk PM assignment
- ✅ Comprehensive error handling dan logging

### 2. Event Interface
```typescript
interface ProjectWonEvent {
  projectId?: string;        // Optional - untuk update scenario
  projectName: string;        // Required
  customerId: string;         // Required
  salesUserId: string;        // Required
  salesOrderId: string;       // Required
  soNumber: string;           // Required
  estimationId?: string;      // Optional
  totalValue?: number;        // Optional
  description?: string;       // Optional
}
```

### 3. HTTP Endpoint
**URL:** `POST /events/project-won`
**Service:** Project Management Service (port 4007)

**Request Example:**
```json
{
  "projectName": "New Construction Project",
  "customerId": "customer-uuid",
  "salesUserId": "sales-user-uuid",
  "salesOrderId": "so-uuid",
  "soNumber": "SO-2025-001",
  "totalValue": 5000000,
  "description": "Project from won sales order"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Event processed"
}
```

### 4. Workflow Logic

```
1. Event Received → project.won
   ↓
2. Check if projectId exists
   ├─ YES → Update existing project to 'Planning' status
   └─ NO  → Create new Project Workspace
   ↓
3. Generate Project Number
   Format: PRJ-YYYYMMDD-XXX
   Example: PRJ-20251121-001
   ↓
4. Create Project Record with:
   - status: 'Planning' ✅
   - project_number: auto-generated
   - customer_id: from event
   - sales_user_id: from event
   - sales_order_id: from event
   - total_value: from event
   ↓
5. Create Activity Log
   - activity_type: 'STATUS_CHANGE'
   - description: "Project won! Sales Order created..."
   - metadata: event details
   ↓
6. Send Notifications
   - To: All Operational Managers
   - Message: "New project needs PM assignment"
   - Link: /projects/{id}
   ↓
7. Return Success Response
```

### 5. Database Schema Updates

**Migration Applied:**
- ✅ Added column `pm_user_id` (VARCHAR)
- ✅ Added column `sales_user_id` (TEXT)
- ✅ Added column `sales_order_id` (VARCHAR)
- ✅ Added column `total_value` (DECIMAL)
- ✅ Added foreign key constraints
- ✅ Added indexes for performance

**Migration File:** `fix-projects-schema.sql`

---

## 🧪 Testing

### Method 1: Using Node.js Test Script
```bash
node test-event-listener-simple.mjs
```

### Method 2: Using PowerShell Script
```bash
powershell -ExecutionPolicy Bypass -File test-event-ps1.ps1
```

### Method 3: Using curl
```bash
curl -X POST http://localhost:4007/events/project-won \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Project",
    "customerId": "your-customer-uuid",
    "salesUserId": "your-sales-user-uuid",
    "salesOrderId": "SO-123",
    "soNumber": "SO-2025-001",
    "totalValue": 5000000,
    "description": "Test project"
  }'
```

### Method 4: Using PowerShell Invoke-WebRequest
```powershell
$body = @{
    projectName = "Test Project"
    customerId = "customer-uuid"
    salesUserId = "user-uuid"
    salesOrderId = "SO-123"
    soNumber = "SO-2025-001"
    totalValue = 5000000
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4007/events/project-won" `
  -Method Post -Body $body -ContentType "application/json"
```

---

## 📝 Expected Results

When event is received, the system will:

1. **Console Logs (Project Service):**
   ```
   📢 Received project.won event: {...}
   🆕 Creating new project workspace...
   ✅ Project workspace created: PRJ-20251121-001
   ✅ Project.won event processed successfully
      Project ID: abc-123-uuid
      Project Number: PRJ-20251121-001
      Status: Planning
   ```

2. **Database Record Created:**
   - New row in `projects` table
   - Status: `'Planning'` ✅
   - All event data saved
   - Project number auto-generated

3. **Activity Log Created:**
   - Record in `project_activities` table
   - Type: `STATUS_CHANGE`
   - Metadata contains event details

4. **Notifications Sent:**
   - All Operational Managers notified
   - Message: "New project needs PM assignment"
   - Link to project detail page

---

## ✅ Verification Checklist

- [x] Event listener implemented in `projectEventListener.ts`
- [x] HTTP endpoint `/events/project-won` configured
- [x] Project Workspace creation logic completed
- [x] Status set to **'Planning'** (as requested) ✅
- [x] Auto-generate project number
- [x] Create activity log
- [x] Send notifications to Operational Managers
- [x] Database schema updated (columns added)
- [x] Foreign key constraints added
- [x] Prisma client regenerated
- [x] Error handling implemented
- [x] Logging for debugging added
- [x] Test scripts created

---

## 🎯 Requirement Compliance

| Requirement | Status | Notes |
|------------|--------|-------|
| Event listener mendengarkan `project.won` | ✅ DONE | Implemented in `projectEventListener.ts` |
| Otomatis membuat Project Workspace | ✅ DONE | Auto-creates when event received |
| Record baru di tabel `projects` | ✅ DONE | New row created with all data |
| Status 'Planning' | ✅ DONE | Status set to `'Planning'` as requested |

---

## 🚀 How to Use in Production

### From CRM Service (or any service):
When a Sales Order is created/won, send HTTP POST request:

```javascript
const axios = require('axios');

// After SO created
const projectEvent = {
  projectName: salesOrder.projectName,
  customerId: salesOrder.customerId,
  salesUserId: currentUser.id,
  salesOrderId: salesOrder.id,
  soNumber: salesOrder.soNumber,
  totalValue: salesOrder.contractValue,
  description: salesOrder.description,
  estimationId: salesOrder.estimationId
};

await axios.post('http://localhost:4007/events/project-won', projectEvent);
```

### Expected Flow:
```
Sales Order Created (CRM) 
  → Send project.won event
    → Project Service receives event
      → Creates Project Workspace with status 'Planning'
        → Notifications sent to Operational Managers
          → Ready for PM assignment
```

---

## 📊 Summary

**Implementation Status:** ✅ **COMPLETE**

The event listener has been fully implemented according to requirements:
- ✅ Listens for `project.won` events
- ✅ Automatically creates Project Workspace records
- ✅ Sets status to **'Planning'**
- ✅ Includes all necessary data and relationships
- ✅ Provides audit trail and notifications
- ✅ Production-ready with error handling

**Ready for:**
- Integration testing with CRM service
- End-to-end workflow testing
- Production deployment

---

## 📞 Support

For questions or issues:
1. Check Project Service logs for event processing details
2. Verify database has required columns (`pm_user_id`, `sales_user_id`, etc.)
3. Ensure Project Service is running on port 4007
4. Use test scripts provided to verify functionality
