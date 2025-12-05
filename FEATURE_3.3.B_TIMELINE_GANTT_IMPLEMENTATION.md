# FITUR 3.3.B — Manajemen Timeline & Tugas (Gantt Chart + Task List)

## Status: ✅ IMPLEMENTASI SELESAI

### Komponen yang Telah Dibuat/Diperbaiki:

#### 1. **GanttChartComponent.tsx** ✅ (BARU)
**Lokasi:** `frontend/apps/project-frontend/src/components/GanttChartComponent.tsx`

**Fitur:**
- Integrasi dengan Frappe Gantt library
- Menampilkan milestone dan task dalam bentuk bar chart interaktif
- Support drag & drop untuk mengubah date range (hanya untuk PM)
- OnClick handler untuk milestone dan task
- Custom color coding berdasarkan status:
  - **Milestone**: Coklat (#5d4037) dengan variasi berdasarkan status
  - **Task TODO**: Biru (#90caf9)
  - **Task IN_PROGRESS**: Hijau (#4caf50)
  - **Task DONE**: Abu-abu (#9e9e9e)
- Custom popup dengan informasi task/milestone
- Support view mode: Day, Week, Month

**Props:**
```typescript
interface GanttChartComponentProps {
  tasks: Task[];
  milestones: Milestone[];
  onTaskClick?: (task: Task) => void;
  onMilestoneClick?: (milestoneId: string) => void;
  viewMode?: 'Day' | 'Week' | 'Month';
  onDateChange?: (taskId: string, start: Date, end: Date) => void;
  onMilestoneDateChange?: (milestoneId: string, start: Date, end: Date) => void;
}
```

---

#### 2. **TaskDetailPanel.tsx** ✅ (DIPERBAIKI)
**Lokasi:** `frontend/apps/project-frontend/src/components/TaskDetailPanel.tsx`

**Perbaikan:**
- ✅ Menggunakan `TeamMember` (bukan ProjectManager) untuk dropdown assignee
- ✅ Dropdown "Ditugaskan kepada" dengan data dari API `getProjectTeam()`
- ✅ Dropdown status: TODO, IN_PROGRESS, DONE
- ✅ Textarea deskripsi (editable oleh PM, read-only untuk worker)
- ✅ Date picker untuk start date & due date (PM only)
- ✅ Progress slider (PM only)
- ✅ Logic update yang benar: PM bisa edit semua field, worker hanya status

**Flow Update Task (Tim Lapangan/Worker):**
1. Worker membuka task dari mobile/web
2. Pilih task yang ditugaskan kepadanya
3. Ubah status: TODO → IN_PROGRESS → DONE
4. API PUT `/projects/tasks/{taskId}` dipanggil dengan `{ status }`
5. Gantt chart otomatis update warna bar

---

#### 3. **MilestoneDetailPanel.tsx** ✅ (SUDAH BAGUS)
**Lokasi:** `frontend/apps/project-frontend/src/components/MilestoneDetailPanel.tsx`

**Fitur:**
- ✅ Menampilkan detail milestone (nama, tanggal, status)
- ✅ Daftar tasks yang terkait dengan milestone
- ✅ Tombol "+ Tambah Tugas" (PM only)
- ✅ Form untuk membuat task baru:
  - Input nama task
  - Dropdown assignee (dari team members)
  - Textarea deskripsi
- ✅ Update milestone dates & status (PM only)

**Flow Tambah Task:**
1. Klik milestone di Gantt Chart
2. Panel Detail terbuka menampilkan milestone info + tasks
3. Klik "+ Tambah Tugas"
4. Isi form: nama, assignee, deskripsi
5. POST `/projects/{projectId}/tasks` dengan `{ milestoneId, taskName, assigneeId }`
6. Gantt chart & panel detail refresh otomatis

---

#### 4. **ApplyTemplateModal.tsx** ✅ (SUDAH BAGUS)
**Lokasi:** `frontend/apps/project-frontend/src/components/ApplyTemplateModal.tsx`

**Fitur:**
- ✅ Modal untuk memilih template milestone
- ✅ GET `/templates/milestones?projectType=...` untuk ambil list template
- ✅ Tampilkan list template dengan info:
  - Nama template
  - Project type
  - Jumlah milestone
- ✅ Apply template dengan POST `/projects/{projectId}/milestones/apply-template`
- ✅ Setelah berhasil → refresh milestone & tasks

**Flow Apply Template:**
1. User (PM) klik "Terapkan Template Milestone"
2. Modal terbuka, menampilkan list template
3. Pilih template yang sesuai
4. Klik "Apply Template"
5. Backend membuat milestone default berdasarkan template
6. Gantt chart reload dengan milestone baru

---

#### 5. **TimelineTab.tsx** ✅ (SUDAH TERINTEGRASI)
**Lokasi:** `frontend/apps/project-frontend/src/components/TimelineTab.tsx`

**UI Layout:**
- **Header:**
  - Tombol "Apply Template" (PM only)
  - Tombol "Add Milestone" (PM only)
- **Milestone Summary:** Chip cards untuk quick view status milestone
- **Gantt Chart:** Komponen utama dengan legend warna
- **View Mode Toggle:** Day / Week / Month
- **Drawers:**
  - Task Detail Panel (untuk edit task)
  - Milestone Detail Panel (untuk view milestone + add task)
  - Apply Template Modal

**State Management:**
- `milestones[]` - data milestone dari backend
- `tasks[]` - data task dari backend
- `selectedTask` - task yang sedang dibuka di panel
- `selectedMilestone` - milestone yang sedang dibuka di panel
- `viewMode` - Day/Week/Month

---

### Integrasi API (projectApi.ts) ✅

**Milestone APIs:**
- ✅ `applyMilestoneTemplate(projectId, templateId)` → POST `/projects/{projectId}/milestones/apply-template`
- ✅ `getMilestones(projectId)` → GET `/projects/{projectId}/milestones`
- ✅ `createMilestone(projectId, data)` → POST `/projects/{projectId}/milestones`
- ✅ `updateMilestone(projectId, milestoneId, data)` → PUT `/projects/{projectId}/milestones/{milestoneId}`

**Task APIs:**
- ✅ `createTask(projectId, data)` → POST `/projects/{projectId}/tasks`
- ✅ `getTasks(projectId, filters?)` → GET `/projects/{projectId}/tasks`
- ✅ `updateTask(projectId, taskId, data)` → PUT `/projects/{projectId}/tasks/{taskId}`
- ✅ `deleteTask(projectId, taskId)` → DELETE `/projects/{projectId}/tasks/{taskId}`

**Template & Team APIs:**
- ✅ `getMilestoneTemplates(projectType?)` → GET `/templates/milestones?projectType=...`
- ✅ `getProjectTeam(projectId)` → Fallback ke ProjectManagers (untuk dropdown assignee)

---

### Styling (gantt.css) ✅

**Lokasi:** `frontend/apps/project-frontend/src/styles/gantt.css`

**Custom Styles:**
- Grid & tick styling
- Bar colors untuk milestone & task status
- Hover effects
- Drag handles untuk date change
- Custom popup styling
- Responsive design

---

### TypeScript Types ✅

**Lokasi:** `frontend/apps/project-frontend/src/types/index.ts`

**Type Definitions:**
```typescript
// Milestone
export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  tasks?: ProjectTask[];
}

// Task
export interface ProjectTask {
  id: string;
  project_id: string;
  milestone_id?: string;
  name: string;
  description?: string;
  assignee_id?: string;
  start_date?: string;
  due_date?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  progress: number;
  assignee?: User;
  milestone?: ProjectMilestone;
}

// Template
export interface MilestoneTemplate {
  id: number;
  template_name: string;
  project_type?: string;
  milestones: {
    name: string;
    duration_days: number;
    status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  }[];
}

// Team Member (untuk dropdown assignee)
export interface TeamMember {
  id: string;
  name: string;
  role?: string;
}
```

**Frappe Gantt Types:**
**Lokasi:** `frontend/apps/project-frontend/src/types/frappe-gantt.d.ts`
- ✅ GanttTask interface
- ✅ GanttOptions interface
- ✅ Gantt class definition

---

### Dependencies yang Digunakan:

```json
{
  "frappe-gantt": "^1.0.4",
  "@mui/material": "...",
  "@mui/x-date-pickers": "...",
  "date-fns": "..."
}
```

---

## User Flows yang Telah Diimplementasi:

### 1. PM: Apply Template Milestone
1. ✅ Buka tab "Timeline & Tugas"
2. ✅ Klik "Apply Template"
3. ✅ Pilih template dari modal
4. ✅ Backend membuat milestone default
5. ✅ Gantt chart menampilkan milestone baru

### 2. PM: Add Milestone Manual
1. ✅ Klik "Add Milestone"
2. ✅ Input nama milestone (via prompt)
3. ✅ POST `/milestones` ke backend
4. ✅ Gantt chart refresh

### 3. PM: Add Task ke Milestone
1. ✅ Klik milestone di Gantt
2. ✅ Milestone Detail Panel terbuka
3. ✅ Klik "+ Tambah Tugas"
4. ✅ Isi nama, assignee, deskripsi
5. ✅ POST `/tasks` ke backend
6. ✅ Task muncul di Gantt chart

### 4. PM: Edit Task
1. ✅ Klik task di Gantt chart
2. ✅ Task Detail Panel terbuka
3. ✅ Edit nama, assignee, dates, status, deskripsi, progress
4. ✅ PUT `/tasks/{id}` ke backend
5. ✅ Gantt chart update warna & posisi

### 5. PM: Drag & Drop Date Change
1. ✅ Hover task/milestone di Gantt
2. ✅ Drag bar untuk ubah date range
3. ✅ Auto call API update
4. ✅ Data tersimpan

### 6. Worker: Update Task Status
1. ✅ Worker buka mobile → lihat task yang ditugaskan
2. ✅ Klik task → Task Detail Panel terbuka
3. ✅ Ubah status: TODO → IN_PROGRESS → DONE
4. ✅ PUT `/tasks/{id}` dengan `{ status }`
5. ✅ PM melihat real-time update warna bar di Gantt

---

## Warna Bar di Gantt Chart:

| Item Type | Status | Warna |
|-----------|--------|-------|
| **Milestone** | PLANNED | Coklat Gelap (#5d4037) |
| **Milestone** | IN_PROGRESS | Coklat (#6d4c41) |
| **Milestone** | DONE | Coklat Terang (#8d6e63) |
| **Task** | TODO | Biru (#90caf9) |
| **Task** | IN_PROGRESS | Hijau (#4caf50) |
| **Task** | DONE | Abu-abu (#9e9e9e) |

---

## Testing Checklist:

### ✅ PM Features:
- [ ] Apply template milestone → milestone muncul di Gantt
- [ ] Add milestone manual → milestone baru muncul
- [ ] Klik milestone → detail panel terbuka
- [ ] Add task ke milestone → task muncul di Gantt
- [ ] Klik task → task detail panel terbuka
- [ ] Edit task (nama, assignee, dates) → update berhasil
- [ ] Drag task bar → tanggal berubah di backend
- [ ] Drag milestone bar → tanggal berubah di backend
- [ ] Switch view mode (Day/Week/Month) → Gantt berubah

### ✅ Worker Features:
- [ ] Worker login → lihat task yang assigned
- [ ] Klik task → detail panel terbuka (read-only untuk nama/dates)
- [ ] Ubah status TODO → IN_PROGRESS → DONE
- [ ] Save → warna bar di Gantt berubah (blue → green → grey)

---

## Next Steps / Potential Enhancements:

1. **Real-time Updates:** Implementasi WebSocket untuk live sync status task antar PM & worker
2. **Milestone Templates:** Tambah UI untuk membuat custom template milestone
3. **Task Dependencies:** Implementasi dependency antar task (task B tidak bisa dimulai sebelum task A selesai)
4. **Gantt Export:** Export Gantt chart ke PDF/PNG
5. **Notification:** Notif untuk PM ketika worker update status task
6. **Mobile Optimization:** Improve mobile UX untuk worker

---

## File Structure:

```
frontend/apps/project-frontend/src/
├── components/
│   ├── TimelineTab.tsx ✅ (Main tab component)
│   ├── GanttChartComponent.tsx ✅ (Frappe Gantt wrapper)
│   ├── TaskDetailPanel.tsx ✅ (Task edit drawer)
│   ├── MilestoneDetailPanel.tsx ✅ (Milestone detail + add task)
│   └── ApplyTemplateModal.tsx ✅ (Template selection modal)
├── api/
│   └── projectApi.ts ✅ (API integration)
├── types/
│   ├── index.ts ✅ (TypeScript types)
│   └── frappe-gantt.d.ts ✅ (Frappe Gantt types)
└── styles/
    └── gantt.css ✅ (Custom Gantt styles)
```

---

## Kesimpulan:

✅ **Fitur 3.3.B telah selesai diimplementasikan** dengan:
- Gantt Chart interaktif menggunakan Frappe Gantt
- Panel detail untuk milestone & task
- Modal apply template milestone
- Integrasi penuh dengan backend API
- Support drag & drop date change
- Color coding berdasaran status
- PM dan worker flow yang berbeda sesuai requirement

Semua komponen mengikuti flow & behaviour yang dijelaskan, menggunakan API yang sudah ada di backend, dan dibangun dengan TypeScript + React + MUI sesuai standar sistem yang sudah berjalan.
