# Project Frontend - Autentikasi Lengkap

## Status: ✅ SELESAI

Autentikasi di `project-frontend` telah **DIPERBARUI** dan sekarang menggunakan pola yang sama dengan `engineering-frontend`.

---

## 🔑 Fitur Autentikasi yang Diimplementasikan

### 1. **Multi-source Token Handling**
AuthContext mendukung 3 cara mendapatkan token (dengan prioritas):

#### Priority 1: Token dari URL Parameter
```
http://localhost:5007/?token=eyJhbGc...
```
- Token dari URL akan disimpan ke localStorage
- URL akan dibersihkan (token parameter dihapus)
- User data akan di-fetch dari identity service

#### Priority 2: Cross-App Token (dari Main Dashboard)
```javascript
localStorage.getItem('cross_app_token')
localStorage.getItem('cross_app_timestamp')
localStorage.getItem('cross_app_user')
```
- Token berlaku 30 detik setelah di-set
- Setelah digunakan, cross_app items akan dihapus
- User data langsung tersedia tanpa fetch

#### Priority 3: Token dari localStorage
```javascript
localStorage.getItem('token')
localStorage.getItem('user')
```
- Fallback untuk user yang sudah login sebelumnya

---

## 📋 Interface & Types

### User Data Structure
```typescript
interface UserData {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;        // 'admin', 'operations_manager', 'project_manager', etc.
  department: string;
}
```

### AuthContext API
```typescript
interface AuthContextType {
  // State
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  
  // Role Helpers
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  
  // Permission Helpers (Project-specific)
  canAssignPm: () => boolean;
  canEditBom: () => boolean;
  canViewProjects: () => boolean;
}
```

---

## 🛡️ Role-Based Permissions

### Generic Role Helpers
```typescript
// Check single role
hasRole('admin')  // true if user.role === 'admin'

// Check any of multiple roles
hasAnyRole(['admin', 'operations_manager'])  // true if user has any

// Check all roles (for multiple role support in future)
hasAllRoles(['admin', 'finance'])
```

### Project-Specific Permissions
```typescript
canAssignPm()       // admin, operations_manager, project_manager
canEditBom()        // admin, project_manager, engineer
canViewProjects()   // admin, operations_manager, project_manager, sales, engineer
```

### Contoh Penggunaan di Komponen
```tsx
import { useAuth } from '../contexts/AuthContext';

function ProjectDetailPage() {
  const { user, canAssignPm, canEditBom } = useAuth();
  
  return (
    <>
      {canAssignPm() && (
        <Button onClick={handleAssignPm}>Assign PM</Button>
      )}
      
      {canEditBom() && (
        <Button onClick={handleEditBom}>Edit BoM</Button>
      )}
      
      <Typography>Welcome, {user?.full_name}</Typography>
    </>
  );
}
```

---

## 🔄 Cross-Tab Synchronization

AuthContext mendengarkan storage events untuk sinkronisasi antar tab:

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'token') {
      if (e.newValue) {
        setToken(e.newValue);
        // Load user from localStorage
      } else {
        // Token dihapus di tab lain → logout
        setToken(null);
        setUser(null);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

**Benefit:**
- Login di satu tab → semua tab langsung ter-autentikasi
- Logout di satu tab → semua tab langsung logout

---

## 🚪 Protected Routes

Router menggunakan `ProtectedRoute` component:

```tsx
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect ke main dashboard
    window.location.href = 'http://localhost:3000/?redirect=project-frontend';
    return null;
  }

  return element;
};

// Penggunaan
<Route 
  path='/projects/:projectId' 
  element={<ProtectedRoute element={<ProjectDetailPage />} />} 
/>
```

---

## 🔌 Identity Service Integration

### File: `src/api/identityApi.ts`

```typescript
import axios from 'axios';

const IDENTITY_SERVICE_URL = 'http://localhost:4001';

const identityClient = axios.create({
  baseURL: IDENTITY_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor untuk attach token
identityClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class IdentityService {
  async getCurrentUser(): Promise<User> {
    const response = await identityClient.get('/api/v1/auth/me');
    return response.data?.data || response.data;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await identityClient.get('/api/v1/users', {
      params: { role },
    });
    return response.data?.data || response.data || [];
  }
}

export const identityApi = new IdentityService();
```

---

## 📦 File Structure

```
frontend/apps/project-frontend/
├── src/
│   ├── api/
│   │   ├── identityApi.ts          ✅ BARU - Identity service client
│   │   └── projectApi.ts           ✅ Sudah ada
│   ├── contexts/
│   │   └── AuthContext.tsx         ✅ DIPERBARUI - Enhanced dengan role helpers
│   ├── router/
│   │   └── index.tsx               ✅ DIPERBARUI - ProtectedRoute component
│   ├── pages/
│   │   ├── ProjectsListPage.tsx    ✅ Sudah menggunakan useAuth
│   │   └── ProjectDetailPage.tsx   ✅ Sudah menggunakan useAuth
│   └── App.tsx                     ✅ Sudah wrap dengan AuthProvider
```

---

## 🎯 Testing Checklist

### ✅ Skenario Login dari Main Dashboard
1. User login di main dashboard (localhost:3000)
2. User klik link ke project-frontend
3. Main dashboard set `cross_app_token`, `cross_app_timestamp`, `cross_app_user`
4. Project-frontend buka dengan token + user sudah tersedia
5. Tidak perlu fetch user lagi

### ✅ Skenario URL Token Parameter
1. User buka: `http://localhost:5007/?token=eyJhbGc...`
2. Token disimpan ke localStorage
3. User data di-fetch dari identity service
4. URL dibersihkan menjadi: `http://localhost:5007/`

### ✅ Skenario Refresh Page
1. User sudah login
2. User refresh page (F5)
3. Token dan user loaded dari localStorage
4. Tidak perlu login ulang

### ✅ Skenario Logout
1. User klik logout
2. Token dan user dihapus dari localStorage
3. Redirect ke `/login` (main dashboard)

### ✅ Skenario Cross-Tab
1. User login di Tab A
2. Buka Tab B (project-frontend)
3. Tab B langsung ter-autentikasi (sync via storage event)
4. Logout di Tab A
5. Tab B langsung logout juga

---

## 🚀 Cara Menjalankan

### 1. Jalankan Identity Service
```bash
cd services/identity-service
npm start
# Runs on http://localhost:4001
```

### 2. Jalankan Project Service
```bash
cd services/project-service
npm start
# Runs on http://localhost:4007
```

### 3. Jalankan Project Frontend
```bash
cd frontend/apps/project-frontend
npm run dev
# Runs on http://localhost:5007
```

### 4. Test dari Main Dashboard
```bash
cd frontend  # main dashboard
npm run dev
# Runs on http://localhost:3000
```

Kemudian navigasi dari dashboard ke project-frontend.

---

## 🔐 Environment Variables

### `.env` untuk Project Frontend
```env
VITE_PROJECT_SERVICE_URL=http://localhost:4007
VITE_IDENTITY_SERVICE_URL=http://localhost:4001
```

### Port Configuration
- Main Dashboard: `3000`
- Identity Service: `4001`
- Project Service: `4007`
- Project Frontend: `5007`

---

## 📝 Kesimpulan

Authentication di `project-frontend` sekarang:

✅ **Sesuai dengan pola engineering-frontend**
✅ **Mendukung cross-app navigation dari main dashboard**
✅ **Ada role-based permission helpers**
✅ **Cross-tab synchronization**
✅ **Protected routes dengan loading state**
✅ **Identity service integration**

Semua file sudah diperbarui dan siap digunakan!
