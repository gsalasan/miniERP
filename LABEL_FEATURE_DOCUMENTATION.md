# Label Management Feature

Fitur manajemen label untuk To-Do items dan Activities di CRM Pipeline.

## Fitur Utama

### 1. Label Manager Dialog

- Dialog popup untuk mengelola labels
- Search/filter labels by name
- Create new labels with custom colors
- Edit label names inline
- Change label colors using color picker
- Select/deselect labels untuk todo items
- Colorblind friendly mode option

### 2. Label Display pada To-Do Items

- Setiap to-do item dapat memiliki multiple labels
- Labels ditampilkan sebagai colored chips di bawah title
- Icon button untuk membuka Label Manager
- Labels tersimpan di localStorage bersama checklist items

### 3. Label Storage

- Labels disimpan di localStorage dengan key: `crm_labels`
- Setiap project memiliki checklist items dengan field `labels: string[]` (array of label IDs)
- Default labels tersedia: Priority, Follow Up, Meeting, Important, Research, Documentation

## Komponen

### LabelManager.tsx

Dialog component untuk mengelola labels dengan fitur:

- Props:
  - `open: boolean` - control dialog visibility
  - `onClose: () => void` - callback saat dialog ditutup
  - `selectedLabels: string[]` - array of label IDs yang sudah terpilih
  - `onLabelsChange: (labelIds: string[]) => void` - callback saat selection berubah
  - `storageKey?: string` - localStorage key (default: 'crm_labels')

### LabelChip.tsx

Chip component untuk menampilkan label dengan styling yang konsisten:

- Props:
  - `label: Label` - label object dengan id, name, color
  - `onDelete?: () => void` - optional callback untuk menghapus label
  - `size?: 'small' | 'medium'` - ukuran chip

## Integrasi di ProjectDetailModal

1. State management untuk labels:

```typescript
const [labelDialogOpen, setLabelDialogOpen] = useState(false);
const [currentEditingTodoId, setCurrentEditingTodoId] = useState<string | null>(
  null
);
const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
```

2. ChecklistItem interface updated:

```typescript
interface ChecklistItem {
  id: string;
  title: string;
  notes?: string;
  is_done: boolean;
  due_date?: string | null;
  labels?: string[]; // array of label IDs
}
```

3. Functions:

- `openLabelDialog(todoId: string)` - membuka label manager untuk todo item
- `closeLabelDialog()` - menutup label manager
- `updateTodoLabels(todoId: string, labelIds: string[])` - update labels pada todo item

## Cara Penggunaan

1. **Membuat Label Baru:**
   - Klik icon Label di todo item
   - Klik "Create a new label"
   - Edit nama dan pilih warna
   - Label tersimpan otomatis

2. **Assign Label ke To-Do:**
   - Klik icon Label di todo item
   - Centang/uncentang labels yang diinginkan
   - Close dialog, labels akan tersimpan otomatis

3. **Edit Label:**
   - Klik icon pensil di label
   - Edit nama label
   - Klik warna picker untuk ganti warna
   - Perubahan tersimpan otomatis

## Future Enhancements

- [ ] Backend API untuk persist labels ke database
- [ ] Filter/group to-do items by labels
- [ ] Label analytics (most used labels, etc)
- [ ] Share labels across projects
- [ ] Label templates untuk project types berbeda
- [ ] Bulk operations (assign label ke multiple items)
- [ ] Label-based notifications/reminders
- [ ] Export/import labels
