import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  checkIn,
  checkOut,
  getEmployeeAttendance,
  getEmployeesAttendanceByDate,
  getEmployeesWithTodayAttendance,
  getMonthlyAttendanceSummary,
  getMyAttendance,
  getTodayAttendance,
} from "./../controllers/EmployeeControllers/employeeAttendance.controller.js";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/EmployeeControllers/employee.controller.js";

const router = express.Router();

/* ================= PROFILE ================= */
router.get("/getMyProfile", authMiddleware, getMyProfile);
router.put("/updateMyProfile", authMiddleware, updateMyProfile);

router.get("/getMyProfile", authMiddleware, getMyProfile);

/* ================= ATTENDANCE ================= */
router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/attendance/my", authMiddleware, getMyAttendance);
router.get("/getEmployeesAttendance", authMiddleware, getEmployeesWithTodayAttendance);
router.get("/employee/:employeeId/attendance", authMiddleware, getEmployeeAttendance);
router.get("/todayAllAttendance", authMiddleware, getEmployeesAttendanceByDate);
router.get("/getTodayAttendance", authMiddleware, getTodayAttendance);
router.get(
  "/attendance/summary",
  authMiddleware,
  getMonthlyAttendanceSummary
);

/* ================= LEAVE ================= */

export default router;
