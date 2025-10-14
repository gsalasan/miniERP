import { Router } from "express";
import { login, getProfile } from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", login);
router.get("/me", authMiddleware, getProfile);

export default router;
