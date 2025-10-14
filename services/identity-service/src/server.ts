import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api/v1/auth", authRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server berjalan di port ${port}`));
