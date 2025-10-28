# Gunakan image Node.js resmi (versi ringan)
FROM node:22-alpine

# Tentukan direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file ke container
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Buka port 4004 (sesuai docker-compose.yml)
EXPOSE 4004

# Jalankan server
CMD ["npm", "run", "dev"]
