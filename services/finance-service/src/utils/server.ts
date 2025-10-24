// src/utils/server.ts
import dotenv from "dotenv";
import app from "./app";

// Load variabel environment dari .env
dotenv.config();

const PORT = process.env.PORT || 5002;

// Jalankan server
app.listen(PORT, () => {
  console.log(`Finance Service running on http://localhost:${PORT}`);
});
