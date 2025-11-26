# 📊 Halaman Riwayat Absensi - Dokumentasi

## 📍 Lokasi Fitur
- **URL**: `/my-attendances`
- **App**: `main-frontend`
- **Path Files**: 
  - `/frontend/apps/main-frontend/src/pages/MyAttendances.tsx`
  - `/frontend/apps/main-frontend/src/components/AttendanceCard.tsx`

## 🎯 Deskripsi Fitur

Halaman **Riwayat Absensi** adalah halaman yang memungkinkan karyawan untuk:
1. **Melihat riwayat absensi lengkap** mereka dengan jam masuk, jam keluar, dan lokasi yang tercatat
2. **Navigasi kalender** untuk memilih tanggal dan melihat detail absensi spesifik
3. **Melihat ringkasan statistik** (hadir, belum checkout, total)
4. **Durasi kerja otomatis** dihitung dan ditampilkan untuk setiap hari

## 🎨 UI/UX Design

### Layout Responsif
```
┌─────────────────────────────────────────────────┐
│         RIWAYAT ABSENSI SAYA                    │
└─────────────────────────────────────────────────┘

Desktop (grid 3-9):
┌──────────────────┬─────────────────────────────┐
│                  │                             │
│   Kalender       │   Detail Absensi            │
│   (3 kolom)      │   (9 kolom)                 │
│                  │                             │
│   - Calendar     │  - Tanggal dipilih          │
│   - Ringkasan    │  - List Attendance Cards    │
│     Statistik    │  - Check-in & Check-out     │
│                  │  - Lokasi & Durasi Kerja    │
│                  │                             │
└──────────────────┴─────────────────────────────┘

Mobile (full width):
┌─────────────────────┐
│   Kalender          │
├─────────────────────┤
│   Ringkasan Stats   │
├─────────────────────┤
│   Detail Absensi    │
└─────────────────────┘
```

### Komponen Utama

#### 1. **Kalender (Sidebar)**
- Navigasi bulan dengan tombol Previous/Next
- Grid kalender 7x6 (Minggu-Sabtu)
- **Indikator visual**:
  - Hari dengan absensi: Background hijau (#d1f2eb) dengan checkmark (✓)
  - Hari dipilih: Background biru (#3498db) dengan text putih
  - Hari ini: Border biru 2px
- Tombol "Hari Ini" untuk kembali ke tanggal sekarang

#### 2. **Ringkasan Statistik**
```
┌─────────────────────────┐
│ 📊 Ringkasan            │
├─────────────────────────┤
│ Hadir:        [5]       │
│ Belum Checkout:[1]      │
│ Total:        [6]       │
└─────────────────────────┘
```

#### 3. **Detail Absensi Card** 
Setiap record ditampilkan dalam card dengan:
- **Header**: Tanggal (format: Hari, DD Bulan YYYY) + Status Badge
- **Jam Masuk (Check-In)**:
  - Icon: ✓ (CheckCircle - biru)
  - Waktu format: HH:MM
  - Lokasi (jika ada)
  
- **Jam Keluar (Check-Out)**:
  - Icon: ⇤ (LogOut)
  - Waktu format: HH:MM (atau "-" jika belum checkout)
  - Lokasi (jika ada)
  
- **Durasi Kerja**: (jika sudah checkout)
  - Format: X jam Y menit
  - Example: "8 jam 30 menit"

### Status Badge Colors
| Status | Color | Background |
|--------|-------|-----------|
| Hadir | Green (#27ae60) | #d1f2eb |
| Belum Checkout | Blue (#0c5460) | #d1ecf1 |
| Terlambat | Orange (#f39c12) | #fff3cd |
| Tidak Hadir | Red (#c0392b) | #f8d7da |

## 🔧 Teknologi & Dependencies

### Framework/Library
- **React 18** dengan TypeScript
- **Material-UI (MUI)** untuk komponen UI
- **Material-UI Icons** untuk ikon
- **Axios** untuk API calls

### API Integration
```typescript
// Endpoint yang digunakan
GET /api/v1/attendances/my
- Response: AttendanceListResponse
  {
    success: boolean,
    data: Attendance[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }
```

### Data Structure
```typescript
interface AttendanceRecord {
  id?: string | number;
  check_in_time?: string;        // ISO 8601 format
  check_out_time?: string | null; // ISO 8601 format
  check_in_location?: string;    // Address string
  check_out_location?: string | null;
  date?: string;
  status?: 'present' | 'absent' | 'late' | 'incomplete';
  work_duration_minutes?: number; // Calculated duration
}
```

## 📝 File Structure

### `MyAttendances.tsx` (Halaman Utama)
- **Line 1-25**: Import dan utilities
- **Line 26-31**: Interface AttendanceRecord
- **Line 32-40**: Default component dan state management
- **Line 41-75**: useEffect untuk fetch data
- **Line 76-160**: Helper functions (calendar logic, date handling)
- **Line 161-380**: JSX rendering (calendar + details)

### `AttendanceCard.tsx` (Komponen Card)
- **Line 1-30**: Import dan interfaces
- **Line 31-45**: Helper functions (formatDate, getStatusBadgeColor)
- **Line 46-180**: JSX rendering card

### `App.tsx` (Routing)
- Import MyAttendances component
- Route definition: `<Route path="/my-attendances" element={<MyAttendances />} />`

## 🚀 Fitur Lengkap

### ✅ Implemented
1. ✅ Kalender interaktif dengan navigasi bulan
2. ✅ Indikator visual hari dengan absensi
3. ✅ Pemilihan tanggal dan display detail
4. ✅ Kartu absensi dengan jam masuk-keluar
5. ✅ Lokasi check-in dan check-out
6. ✅ Durasi kerja otomatis (jam + menit)
7. ✅ Status badge (Hadir, Belum Checkout, dll)
8. ✅ Ringkasan statistik bulanan
9. ✅ Loading state & error handling
10. ✅ Responsive design (mobile & desktop)
11. ✅ Format waktu Indonesia
12. ✅ Tombol "Hari Ini" untuk quick access

### 📋 Props & Configuration
```typescript
// MyAttendances.tsx - tidak membutuhkan props

// AttendanceCard.tsx
interface AttendanceCardProps {
  record: AttendanceRecord; // Required
}
```

## 🎯 User Experience Flow

```
1. User akses /my-attendances
   ↓
2. Page load dengan state loading
   ↓
3. API fetch data dari /api/v1/attendances/my
   ↓
4. Data ditransform ke AttendanceRecord[]
   ↓
5. Calendar & Details dirender
   ↓
6. User bisa:
   - Navigasi kalender (prev/next month)
   - Klik tanggal untuk lihat detail
   - Klik "Hari Ini" untuk kembali ke today
   - Lihat ringkasan statistik
```

## 🔄 Data Flow

```
Backend (HR Service)
    ↓
API Endpoint: GET /api/v1/attendances/my
    ↓
Axios interceptor (auto add token)
    ↓
MyAttendances.tsx (fetch & transform)
    ↓
AttendanceRecord[] state
    ↓
Calendar logic (filter by date)
    ↓
AttendanceCard.tsx (render each record)
    ↓
UI Display
```

## 🛠️ Customization Options

### Mengubah Format Tanggal
```typescript
// Di MyAttendances.tsx, line ~160
const monthYearString = currentMonth.toLocaleDateString('id-ID', {
  month: 'long',
  year: 'numeric',
});
```

### Mengubah Warna Status Badge
```typescript
// Di AttendanceCard.tsx, line ~46
const getStatusBadgeColor = (status?: string) => {
  switch (status) {
    case 'present':
      return { bgcolor: '#d1f2eb', color: '#27ae60' }; // Ubah di sini
    // ...
  }
};
```

### Mengubah Jumlah Item Per Halaman
```typescript
// Di MyAttendances.tsx, API call
const response = await getMyAttendances(undefined, 1, 50); // Change limit dari 20 ke 50
```

## 🐛 Error Handling

- **Network Error**: Menampilkan Alert dengan pesan error dari API
- **No Data**: Menampilkan placeholder "📋 Tidak ada data absensi untuk tanggal ini"
- **Loading State**: CircularProgress indicator dengan teks "Memuat data absensi..."

## 📱 Responsive Breakpoints

```typescript
Grid breakpoints:
- xs={12}  : Full width on mobile
- md={3}   : 25% width on tablet+ (calendar)
- md={9}   : 75% width on tablet+ (details)
```

## 🔐 Authentication

- Token diambil dari localStorage dengan key `'token'`
- Axios interceptor otomatis menambahkan Authorization header:
  ```
  Authorization: Bearer {token}
  ```

## 📊 Performance Considerations

1. **Lazy Loading**: Data fetched on mount, tidak ada pagination di UI
2. **State Management**: Simple useState, suitable untuk data volume kecil-medium
3. **Rendering**: Efficient grid rendering dengan key prop
4. **Date Comparison**: Optimized dengan getDate/getMonth/getFullYear

## 🎓 Contoh Penggunaan

### Navigasi ke halaman
```typescript
// Link di component lain
<Link to="/my-attendances">Lihat Riwayat Absensi</Link>
```

### Fetch manual (jika perlu)
```typescript
import { getMyAttendances } from '../api/attendance';

const fetchData = async () => {
  try {
    const response = await getMyAttendances();
    console.log(response.data); // Array of Attendance
  } catch (err) {
    console.error(err.message);
  }
};
```

## 🚨 Known Issues & Notes

1. **API Response Format**: Memastikan response dari backend sesuai dengan type `AttendanceListResponse`
2. **Timezone**: Format waktu menggunakan timezone local browser
3. **Pagination**: Saat ini tidak ada pagination di UI, semua data ditampilkan

## 📞 Support

Untuk pertanyaan atau issue, hubungi development team.

---
**Last Updated**: November 17, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
