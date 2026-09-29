import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";
import {
  checkIn,
  checkOut,
  getEmployeeAttendance,
  getEmployeesAttendanceByDate,
  getMonthlyAttendanceSummary,
  getMyAttendance,
  getTodayAttendance,
} from "./../controllers/EmployeeControllers/employeeAttendance.controller.js";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/EmployeeControllers/employee.controller.js";

const router = express.Router();

// PROFILE
router.get("/getMyProfile", authMiddleware, getMyProfile);
router.put("/updateMyProfile", authMiddleware, updateMyProfile);

// ATTENDANCE
router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/attendance/my", authMiddleware, getMyAttendance);
// SECURITY: these two return OTHER employees' attendance / the whole
// company's daily attendance — previously any logged-in employee (not
// just HR) could pull anyone's records. Restricted to HR/Admin.
router.get("/employee/:employeeId/attendance", authMiddleware, isHrOrAdmin, getEmployeeAttendance);
router.get("/todayAllAttendance", authMiddleware, isHrOrAdmin, getEmployeesAttendanceByDate);
router.get("/getTodayAttendance", authMiddleware, getTodayAttendance);
router.get(
  "/attendance/summary",
  authMiddleware,
  getMonthlyAttendanceSummary
);

// LEAVE

export default router;
