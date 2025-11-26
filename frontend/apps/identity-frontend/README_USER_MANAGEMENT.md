# Identity Service - User Management Frontend

## 📋 Overview

**Identity Service** adalah modul manajemen user untuk **miniERP** yang menyediakan interface profesional untuk CRUD (Create, Read, Update, Delete) user dan mengatur hak akses.

## 🎯 Fitur Utama

### 1. **User Management Dashboard**
   - Tampilan tabel user dengan pagination
   - Search dan filter user
   - Lihat detail user
   - Edit/Update user
   - Tambah user baru
   - Hapus user
   - Status user (aktif/nonaktif)

### 2. **Role Management**
   - Assign multiple roles ke setiap user
   - Roles yang tersedia:
     - EMPLOYEE
     - HR_ADMIN
     - SALES
     - FINANCE_ADMIN
     - SYSTEM_ADMIN
     - MANAGER
     - CEO

### 3. **Authentication & Authorization**
   - Login dengan email/password
   - JWT Token management
   - Protected routes
   - Automatic redirect untuk unauthorized access

### 4. **Modern UI/UX**
   - Responsive design (mobile, tablet, desktop)
   - Material-UI components
   - Gradient cards
   - Smooth animations
   - Professional color scheme

## 📁 Struktur Folder

```
src/
├── api/
│   ├── index.ts          # API utilities
│   └── userApi.ts        # User CRUD endpoints
├── components/
│   └── login.tsx         # Login page (professional UI)
├── layouts/
│   └── MainLayout.tsx    # Main layout dengan sidebar
├── pages/
│   ├── Dashboard.tsx     # Dashboard page
│   └── users/
│       └── UserManagement.tsx  # User Management page
├── App.tsx              # Routing & theme
└── main.tsx
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm atau yarn
- Backend Identity Service running (port 3001)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📱 Pages

### 1. **Login Page** (`/login`)
- Email & password input
- Form validation
- Error handling
- Beautiful gradient background
- Demo credentials display

### 2. **Dashboard** (`/dashboard`)
- Welcome message
- Quick stats cards
- Navigation to User Management
- Info box dengan instruksi

### 3. **User Management** (`/users`)
- **Table View**
  - List semua users
  - Pagination (5, 10, 25 rows per page)
  - Email, Roles, Status columns
  - Action buttons (View, Edit, Delete)

- **Add User Modal**
  - Email input
  - Password input
  - Role checkboxes
  - Save button

- **Edit User Modal**
  - Edit email
  - Update roles
  - Toggle status (aktif/nonaktif)
  - Save changes

- **View User Modal**
  - Read-only mode
  - Display email, roles, status

## 🔐 Access Control

**User Management** hanya bisa diakses oleh:
- SYSTEM_ADMIN
- HR_ADMIN
- Atau user dengan role tertentu (bisa dikonfigurasi di backend)

Untuk role-based access control, backend perlu validate di setiap endpoint.

## 🎨 UI Features

### Color Scheme
- **Primary**: #3B82F6 (Blue)
- **Secondary**: #10B981 (Green)
- **Danger**: #EF4444 (Red)
- **Background**: #F9FAFB (Light Gray)

### Components Used
- Material-UI Table
- Material-UI Dialog (Modal)
- Material-UI TextField
- Material-UI Button
- Material-UI Chip
- Material-UI Alert
- Material-UI Avatar
- Custom styled components

## 📊 API Integration

### Endpoints
```
POST   /api/v1/auth/login                 # Login
GET    /api/v1/auth/users                 # Get all users
GET    /api/v1/auth/users/:id             # Get user by ID
POST   /api/v1/auth/register              # Create user
PUT    /api/v1/auth/users/:id             # Update user
DELETE /api/v1/auth/users/:id             # Delete user
```

### Request Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

## 🔄 User Workflow

### Create User
1. Click "Tambah User" button
2. Fill form (email, password, roles)
3. Select roles
4. Click "Simpan"
5. User berhasil ditambahkan

### Edit User
1. Click edit icon pada table row
2. Update email/roles/status
3. Click "Simpan"
4. Changes saved

### Delete User
1. Click delete icon
2. Confirm deletion
3. User dihapus

## 🛡️ Security Features

- ✅ Protected routes dengan token check
- ✅ HTTP interceptor untuk auto-add Authorization header
- ✅ Automatic logout jika token invalid
- ✅ Form validation
- ✅ Error handling dengan user-friendly messages

## 📦 Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.17.0",
  "@mui/material": "^5.15.0",
  "@mui/icons-material": "^5.15.0",
  "@emotion/react": "^11.11.0",
  "@emotion/styled": "^11.11.0",
  "axios": "^1.6.0",
  "recharts": "^2.10.3"
}
```

## 🎯 Next Steps

1. Update backend role-based access control
2. Add more user details (phone, department, dsb)
3. Implement user profile page
4. Add activity logs
5. Implement export to CSV
6. Add advanced search & filters
7. Implement batch operations (delete multiple users)

## 📝 Notes

- Pastikan backend Identity Service running di `http://localhost:3001`
- Token disimpan di localStorage untuk persistence
- Sidebar responsive untuk mobile & desktop
- Dialog modal untuk CRUD operations
- Toast/Alert untuk feedback user

---

**Version**: 1.0.0  
**Last Updated**: November 24, 2025  
**Author**: Development Team
