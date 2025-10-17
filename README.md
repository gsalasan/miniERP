# miniERP

Repositori miniERP — panduan singkat untuk menjalankan proyek ini secara lokal.## Aturan Kontribusi

1. **Selalu lakukan `git pull` dari branch `main` sebelum mulai bekerja**  
   Pastikan branch lokal kamu sudah update dengan perubahan terbaru dari `main`.

2. **Buat branch baru sesuai ticket**  
   Format nama branch: `namabranch[MIN-12]`  
   Contoh: `fitur-auth[MIN-12]`

3. **Commit perubahan secara teratur**  
   Gunakan pesan commit yang jelas dan deskriptif.

4. **Push branch ke remote**  
   Setelah commit, lakukan `git push` ke branch yang sudah dibuat.

5. **Buat Pull Request (PR) ke branch `main`**  
   Sertakan deskripsi singkat tentang perubahan dan referensi ticket (misal: MIN-12).

6. **Tunggu review dan approval sebelum merge**  
   Jangan merge PR sendiri tanpa persetujuan reviewer.


## Persyaratan
- Node.js (disarankan v14+)
- npm atau yarn
- Database (Postgres/MySQL) atau gunakan Docker untuk lingkungan yang sudah dikemas
- Git

## Instalasi & Konfigurasi
1. Clone repositori:
   - git clone <url-repo>
   - cd miniERP

2. Salin file konfigurasi lingkungan:
   - cp .env.example .env
   - Edit `.env` sesuai kebutuhan (contoh di bawah)

Contoh `.env` minimal:
```
PORT=3000
NODE_ENV=development
# Database (atau DATABASE_URL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=mini_erp
# Token/JWT
JWT_SECRET=change_this_secret
```

> Catatan: Periksa file `package.json` untuk script yang tersedia (mis. dev, start, migrate, seed, test). Sesuaikan perintah migrasi/seeding dengan stack proyek (Prisma, TypeORM, Sequelize, dll).

## Instal dependensi
- npm:
  - npm install
- yarn:
  - yarn install

## Menjalankan aplikasi (pengembangan)
- npm:
  - npm run dev
- yarn:
  - yarn dev

Server biasanya tersedia di: http://localhost:3000 (atau PORT di .env)

## Migrate & Seed (contoh umum)
- Jalankan migrasi:
  - npm run migrate
- Jalankan seed:
  - npm run seed

Jika proyek menggunakan tool lain, gunakan perintah sesuai dokumentasi tool tersebut.

## Menjalankan produksi / build
- npm run build
- npm start

## Menggunakan Docker (opsional)
Jika ada Dockerfile/docker-compose.yml:
- docker-compose up --build

## Testing & Linting
- Jalankan test:
  - npm test
- Lint:
  - npm run lint

## Troubleshooting
- Periksa variable .env jika koneksi DB gagal.
- Periksa log terminal untuk pesan error saat start/migrate.
- Pastikan port tidak bentrok dengan aplikasi lain.

## Kontribusi
Buat branch baru untuk fitur/perbaikan dan ajukan pull request. Sertakan deskripsi singkat dan langkah reproduce bila relevan.

## Lisensi
Sesuaikan dengan lisensi proyek (mis. MIT) atau tambahkan file LICENSE.

