// src/utils/server.ts
import dotenv from "dotenv";
import app from "./app";

// Load variabel environment dari .env dengan override untuk menghindari konflik
dotenv.config({ path: require('path').join(__dirname, '../../.env'), override: false });

// Force PORT dari .env local jika ada, atau gunakan default
const envPort = process.env.PORT;
const PORT = envPort && !isNaN(parseInt(envPort)) ? parseInt(envPort) : 8080;

// Jalankan server
app.listen(PORT, () => {
  console.log(`Finance Service running on http://localhost:${PORT}`);
});
