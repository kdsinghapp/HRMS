import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";
import {
  getPendingEmployees,
  updateEmployeeStatus,
} from "../controllers/adminControllers/approval.controller.js";
import {
  getAttendanceByDate,
  getAttendanceByEmployee,
  getAttendanceStats,
  getMonthlyAttendanceSummary,
} from "../controllers/adminControllers/adminAttendance.controller.js";
import {
  getAllEmployees,
  getEmployeeById,
  toggleEmployeeActiveStatus,
  updateEmployeeByAdmin,
} from "../controllers/adminControllers/adminEmployee.controller.js";
import {
  filterLeaves,
  getAllLeaves,
  updateLeaveStatus,
} from "../controllers/adminControllers/leave.admin.controller.js";
import { getAdminDashboardCharts } from "../controllers/adminControllers/dashboard.admin.controller.js";

const router = express.Router();

/* ================= EMPLOYEE APPROVAL ================= */
router.get(
  "/employees/pending", //done
  authMiddleware,
  isHrOrAdmin,
  getPendingEmployees,
);

router.patch(
  "/employees/:employeeId/status", //done
  authMiddleware,
  isHrOrAdmin,
  updateEmployeeStatus,
);

/* ================= EMPLOYEE CRUD (ADMIN) ================= */
router.get(
  "/allEmployees", //done
  authMiddleware,
  isHrOrAdmin,
  getAllEmployees,
);

router.get(
  "/employees/:id", //done
  authMiddleware,
  isHrOrAdmin,
  getEmployeeById,
);

router.put(
  "/employees/:id", //done
  authMiddleware,
  isHrOrAdmin,
  updateEmployeeByAdmin,
);

router.put(
  "/employees/:id/active", //done
  authMiddleware,
  isHrOrAdmin,
  toggleEmployeeActiveStatus,
);

/* ================= ATTENDANCE ================= */
router.get(
  "/attendance/by-date", //done
  authMiddleware,
  isHrOrAdmin,
  getAttendanceByDate,
);

/* ================= ATTENDANCE BY EMPLOYEE ID ================= */
router.get(
  "/attendance/by-employee/:employeeId", //done
  authMiddleware,
  isHrOrAdmin,
  getAttendanceByEmployee,
);

/* ================= MONTHALY ATTENDANCE  ================= */
router.get(
  "/attendance/monthly", //done
  authMiddleware,
  isHrOrAdmin,
  getMonthlyAttendanceSummary,
);

/* =================  ATTENDANCE STATS  ================= */
router.get(
  "/attendance/Stats", //done
  authMiddleware,
  isHrOrAdmin,
  getAttendanceStats,
);

/* =================  get AdmiDashboard Charts ================= */
router.get(
  "/adminDashboardCharts", //done
  authMiddleware,
  isHrOrAdmin,
  getAdminDashboardCharts,
);


/* =================  get Pending Leaves  ================= */
// router.get(
//   "/leaves/pending", //done
//   authMiddleware,
//   isHrOrAdmin,
//   filterLeaves,
// );

/* =================  get Pending Leaves  ================= */
router.get(
  "/leaves/pending", //done
  authMiddleware,
  isHrOrAdmin,
  getAllLeaves,
);
/* =================  get Pending Leaves  ================= */
router.patch(
  "/leaves/:leaveId/status", //done
  authMiddleware,
  isHrOrAdmin,
  updateLeaveStatus,
);

export default router;
