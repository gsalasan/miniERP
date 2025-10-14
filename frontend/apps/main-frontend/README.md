# ERP Landing Page (main-frontend)

Modul ini adalah halaman utama (portal) untuk mengakses seluruh service ERP yang ada di monorepo ini.

## Struktur Folder

- `public/` : Berisi file statis seperti `index.html`.
- `src/` : Berisi source code React untuk landing page.
  - `App.tsx` : Komponen utama landing page, berisi daftar link ke semua modul/service.
  - `main.tsx` : Entry point aplikasi React.
- `package.json` : Konfigurasi dependency dan script modul.
- `tsconfig.json` : Konfigurasi TypeScript, extend dari base.
- `vite.config.ts` : Konfigurasi Vite untuk development/build.

## Cara Menjalankan

1. Pastikan sudah menjalankan `npm install` di root monorepo.
2. Masuk ke folder ini:
   ```
   cd frontend/apps/main-frontend
   npm run dev
   ```
3. Buka browser ke `http://localhost:3000` untuk melihat landing page.
4. Klik tombol modul untuk masuk ke service yang diinginkan.

## Catatan
- Landing page ini hanya sebagai portal/menu, tidak ada login di sini.
- Login dan fitur lain ada di masing-masing modul/service.
- Jika ingin menambah modul, tambahkan link di `src/App.tsx`.

## Kontribusi
- Kembangkan tampilan dan fitur landing page sesuai kebutuhan tim.
- Ikuti style guide lint dan prettier dari root frontend.

---
