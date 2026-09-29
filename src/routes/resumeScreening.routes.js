import express from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";
import { analyzeResume } from "../controllers/adminControllers/resumeScreening.controller.js";

const router = express.Router();

// Memory storage for multer (buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Protect with auth and roles
router.use(authMiddleware, isHrOrAdmin);

router.post("/analyze", upload.single("resume"), analyzeResume);

export default router;
