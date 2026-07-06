import express from "express";
import {
  cancelLeave,
  createLeave,
  getMyLeaves,
} from "../controllers/EmployeeControllers/employee.leave.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Apply leave
router.post("/apply-leave", authMiddleware, createLeave);

// Get my leaves
router.get("/get-my-leaves", authMiddleware, getMyLeaves);

// Cancel leave
router.patch("/cancel-leave/:leaveId", authMiddleware, cancelLeave);

export default router;