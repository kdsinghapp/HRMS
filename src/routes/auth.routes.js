import express from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/employee.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { loginLimiter } from "../middlewares/rateLimiter.middleware.js";
import { registerEmployee } from "../controllers/EmployeeControllers/employee.controller.js";
import {
  changePassword,
  forgotPassword,
  getMyProfile,
  login,
  resetPasswordController,
  sendEmailOTP,
  verifyEmailOTP,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerEmployee);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/my-profile", authMiddleware, getMyProfile);
router.put("/change-password", authMiddleware, changePassword);

// Also rate-limited: this endpoint sends an email and is an easy target
// for both abuse (spamming a user's inbox) and account enumeration.
router.post("/forgot-password", loginLimiter, forgotPassword);
router.post("/verify-email/send-otp", authMiddleware, sendEmailOTP);
router.post("/verify-email", authMiddleware, verifyEmailOTP);
router.post("/reset-password/:token", resetPasswordController);

export default router;
