# Panduan Testing Endpoint User Identity Service (Postman)

Base URL: `http://localhost:3001/api/v1/auth`

## 1. Get All Users
- **Method:** GET
- **URL:** `/users`
- **Headers:**
  - Authorization: Bearer {token}
- **Response:**
  - 200 OK, data: array of users

## 2. Edit User
- **Method:** PUT
- **URL:** `/users/:id`
- **Headers:**
  - Authorization: Bearer {token}
- **Body (JSON):**
```json
{
  "email": "new@email.com", // optional
  "roles": ["EMPLOYEE"],    // optional, array of roles
  "is_active": true          // optional
}
```
- **Response:**
  - 200 OK, data: updated user
  - 404 jika user tidak ditemukan

## 3. Delete User
- **Method:** DELETE
- **URL:** `/users/:id`
- **Headers:**
  - Authorization: Bearer {token}
- **Response:**
  - 200 OK, message: User berhasil dihapus
  - 404 jika user tidak ditemukan

## Catatan
- Token bisa didapat dari endpoint `/login`.
- Semua endpoint di atas membutuhkan token JWT (Authorization header).
- Gunakan Postman, import request di atas, dan sesuaikan base URL jika port berbeda.
