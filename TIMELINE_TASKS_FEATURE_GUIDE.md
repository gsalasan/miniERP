# FITUR 3.3.B: Timeline & Tugas Management dengan Gantt Chart

## Overview

Fitur ini memungkinkan Project Manager (PM) untuk merencanakan dan mengelola timeline proyek dengan milestone dan tugas (tasks), serta memvisualisasikannya dalam bentuk **Gantt Chart interaktif**. Tim lapangan dapat memperbarui status dan progress tugas mereka secara mobile-friendly.

---

## 🚀 Fitur Utama

### 1. **Milestone Management**
- Apply milestone template untuk quick setup
- Create manual milestone
- Update milestone (name, dates, status)
- Visual milestone summary dengan status chips

### 2. **Task Management**
- Create tasks linked to milestones
- Assign tasks to team members
- Track task progress (0-100%)
- Status workflow: TODO → IN_PROGRESS → DONE
- Set start date and due date

### 3. **Gantt Chart Visualization**
- Interactive Gantt chart using **Frappe Gantt**
- Visual timeline representation
- Drag-and-drop date adjustment (PM only)
- Color-coded task status
- Click on task to view/edit details

### 4. **Permission Model**
- **Project Manager (PM)**:
  - Full CRUD on milestones and tasks
  - Can assign tasks to team members
  - Can edit all task fields including dates, assignee, description
  - Can drag tasks in Gantt chart to adjust dates
  
- **Field Team (Assignee)**:
  - Can view assigned tasks
  - Can update task status and progress
  - Cannot edit task name, description, dates, or assignee

### 5. **Mobile-Friendly Task Updates**
- Responsive drawer design
- Touch-friendly status selector
- Progress slider for easy updates on mobile
- Optimized for field team quick updates

---

## 📁 File Structure

### Backend (`services/project-service/`)

```
src/
├── controllers/
│   ├── milestoneController.ts      # Milestone HTTP handlers
│   └── taskController.ts            # Task HTTP handlers
├── services/
│   ├── milestoneService.ts          # Milestone business logic
│   └── taskService.ts               # Task business logic
├── routes/
│   ├── milestoneRoutes.ts           # Milestone endpoints
│   └── taskRoutes.ts                # Task endpoints
└── app.ts                           # Route registration
```

### Frontend (`frontend/apps/project-frontend/`)

```
src/
├── components/
│   ├── TimelineTab.tsx              # Main timeline interface
│   ├── GanttChartComponent.tsx      # Frappe Gantt wrapper
│   ├── TaskDetailPanel.tsx          # Task edit drawer
│   └── ApplyTemplateModal.tsx       # Template selector
├── api/
│   └── projectApi.ts                # API client methods
├── types/
│   └── index.ts                     # TypeScript types
└── pages/
    └── ProjectDetailPage.tsx        # Tab integration
```

### Database

```
prisma/
└── schema.prisma                    # ProjectTask model + TaskStatus enum
```

---

## 🔌 API Endpoints

### Milestone Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/projects/:projectId/apply-template` | Apply milestone template | PM |
| GET | `/api/v1/projects/:projectId/milestones` | Get all milestones with tasks | All |
| POST | `/api/v1/projects/:projectId/milestones` | Create manual milestone | PM |
| PUT | `/api/v1/projects/:projectId/milestones/:milestoneId` | Update milestone | PM |
| GET | `/api/v1/projects/templates` | Get available templates | All |

### Task Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/projects/:projectId/tasks` | Create task | PM |
| GET | `/api/v1/projects/:projectId/tasks` | Get tasks (with filters) | All |
| PUT | `/api/v1/projects/:projectId/tasks/:taskId` | Update task | PM/Assignee* |
| DELETE | `/api/v1/projects/:projectId/tasks/:taskId` | Delete task | PM |

**Note**: Assignee can only update `status` and `progress` fields.

---

## 💾 Database Schema

### ProjectTask Table

```sql
CREATE TABLE project_tasks (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL REFERENCES projects(id),
  milestone_id VARCHAR(36) REFERENCES project_milestones(id),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  assignee_id VARCHAR(36) REFERENCES users(id),
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  status "TaskStatus" NOT NULL DEFAULT 'TODO',
  progress INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### TaskStatus Enum

```sql
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
```

### Milestone Templates Table

```sql
CREATE TABLE milestone_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(255) UNIQUE NOT NULL,
  project_type VARCHAR(100),
  milestones JSON NOT NULL
);
```

---

## 🛠️ Setup Instructions

### 1. Backend Setup

```bash
# From miniERP root
cd services/project-service

# Ensure Prisma client is generated
npx prisma generate

# Start the service
npm run dev
```

### 2. Database Migration

```bash
# Create project_tasks table
psql -h <host> -U <user> -d <database> -f create-project-tasks-table.sql

# Fix status column type
psql -h <host> -U <user> -d <database> -f fix-task-status.sql

# Seed milestone templates (optional)
psql -h <host> -U <user> -d <database> -f seed-milestone-templates.sql
```

### 3. Frontend Setup

```bash
cd frontend/apps/project-frontend

# Install dependencies
npm install frappe-gantt @mui/x-date-pickers date-fns

# Start dev server
npm run dev
```

---

## 📊 Milestone Template Format

Templates are stored as JSON in the `milestone_templates` table:

```json
{
  "template_name": "Standard Construction Project",
  "project_type": "Construction",
  "milestones": [
    {
      "name": "Project Initiation",
      "duration_days": 7,
      "status": "PLANNED"
    },
    {
      "name": "Design & Planning",
      "duration_days": 14,
      "status": "PLANNED"
    }
  ]
}
```

When applied, milestones are created sequentially with dates calculated from project start_date.

---

## 🎨 UI Components

### TimelineTab

Main interface showing:
- Header with "Apply Template" and "Add Milestone" buttons (PM only)
- Milestone summary chips
- Gantt chart visualization
- Task list (future enhancement)

### GanttChartComponent

Frappe Gantt integration:
- Week view by default
- Color-coded by status:
  - TODO: Blue (#90caf9)
  - IN_PROGRESS: Green (#4caf50)
  - DONE: Grey (#9e9e9e)
- Click handler for task details
- Drag handler for date changes (PM only)

### TaskDetailPanel

Right drawer with:
- Task name, description (PM only)
- Assignee selector (PM only)
- Start date, due date pickers (PM only)
- Status dropdown (editable by all)
- Progress slider (editable by all)
- Responsive design for mobile

### ApplyTemplateModal

Dialog for selecting and applying templates:
- List of available templates
- Template metadata (project type, milestone count)
- Confirmation button

---

## 🔐 Permission Logic

### Backend (taskService.ts)

```typescript
// PM can edit everything
if (isPM) {
  // Allow all updates
} else if (isAssignee) {
  // Only allow status and progress updates
  updateData = {
    status: data.status,
    progress: data.progress
  };
}
```

### Frontend (TaskDetailPanel.tsx)

```tsx
// Conditional field rendering
{isPM && (
  <TextField
    label="Task Name"
    value={formData.name}
    onChange={...}
  />
)}

// Status and Progress always editable
<Select
  value={formData.status}
  onChange={...}
/>
```

---

## 🔔 Notifications

When a task is assigned to a user:
- Backend calls `NotificationService.createNotification()`
- Assignee receives in-app notification
- Notification type: `TASK_ASSIGNED`

---

## 📱 Mobile Optimization

### Responsive Design
- Drawer width: 400px on desktop, full width on mobile
- Touch-friendly controls (large buttons, sliders)
- Optimized for quick status updates

### Field Team Workflow
1. Open project from mobile
2. Go to Timeline & Tugas tab
3. Tap task in Gantt chart
4. Update status and progress
5. Save → notification sent to PM

---

## 🧪 Testing Checklist

### PM User
- [ ] Apply milestone template
- [ ] Create manual milestone
- [ ] Update milestone dates
- [ ] Create task assigned to team member
- [ ] Drag task in Gantt chart to change dates
- [ ] Edit all task fields in drawer
- [ ] Delete task

### Field Team User
- [ ] View assigned tasks in Gantt chart
- [ ] Open task detail drawer
- [ ] Update task status
- [ ] Adjust task progress slider
- [ ] Verify cannot edit name, description, dates, assignee
- [ ] Save changes

### Integration
- [ ] Verify API calls succeed
- [ ] Check notifications are sent
- [ ] Validate permission enforcement
- [ ] Test mobile responsiveness
- [ ] Verify Gantt chart renders correctly

---

## 🐛 Known Issues / Future Enhancements

### Current Limitations
- No task dependencies (predecessors)
- No task list view (only Gantt)
- No bulk task operations
- Templates cannot be edited from UI

### Planned Enhancements
- Task dependencies and critical path
- Task list/table view with filters
- Bulk task status updates
- Template management UI
- Task comments and attachments
- Email notifications
- Task time tracking
- Resource allocation view

---

## 📞 Support

For issues or questions:
- Check backend logs: `services/project-service/logs`
- Check frontend console for errors
- Verify database schema matches Prisma schema
- Ensure all dependencies are installed

---

## 🎉 Success Criteria

✅ PM can apply templates and create milestones  
✅ PM can assign tasks to team members  
✅ Gantt chart visualizes timeline  
✅ Field team can update task status/progress  
✅ Permissions enforced on backend and frontend  
✅ Mobile-friendly interface for field updates  

---

**Implementation Date**: January 2025  
**Version**: 1.0  
**Status**: ✅ Complete
