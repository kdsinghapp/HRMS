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
  updateAttendanceByEmployee,
} from "../controllers/adminControllers/adminAttendance.controller.js";
import {
  getAllEmployees,
  getEmployeeById,
  toggleEmployeeActiveStatus,
  updateEmployeeByAdmin,
} from "../controllers/adminControllers/adminEmployee.controller.js";
import {
  getAllLeaves,
  getLeavesByEmployee,
  updateLeaveStatus,
  updateLeaveDetails,
  createLeaveForEmployee,
  deleteLeave,
} from "../controllers/adminControllers/leave.admin.controller.js";
import { getAdminDashboardCharts } from "../controllers/adminControllers/dashboard.admin.controller.js";

const router = express.Router();

// EMPLOYEE APPROVAL
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

// EMPLOYEE CRUD (ADMIN)
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

// ATTENDANCE
router.get(
  "/attendance/by-date", //done
  authMiddleware,
  isHrOrAdmin,
  getAttendanceByDate,
);

// ATTENDANCE BY EMPLOYEE ID
router.get(
  "/attendance/by-employee/:employeeId", //done
  authMiddleware,
  isHrOrAdmin,
  getAttendanceByEmployee,
);

// EDIT ATTENDANCE BY EMPLOYEE (HR manual edit)
// Used by the HR-side attendance calendar popup so HR can correct/fill in
// an employee's status, check-in and check-out for a specific date.
router.put(
  "/attendance/employee/:employeeId",
  authMiddleware,
  isHrOrAdmin,
  updateAttendanceByEmployee,
);

// MONTHALY ATTENDANCE
router.get(
  "/attendance/monthly", //done
  authMiddleware,
  isHrOrAdmin,
  getMonthlyAttendanceSummary,
);

// ATTENDANCE STATS
router.get(
  "/attendance/Stats", //done
  authMiddleware,
  isHrOrAdmin,
  getAttendanceStats,
);

// get AdmiDashboard Charts
router.get(
  "/adminDashboardCharts", //done
  authMiddleware,
  isHrOrAdmin,
  getAdminDashboardCharts,
);

// get Pending Leaves
router.get(
  "/leaves/pending", //done
  authMiddleware,
  isHrOrAdmin,
  getAllLeaves,
);
// get Pending Leaves
router.patch(
  "/leaves/:leaveId/status", //done
  authMiddleware,
  isHrOrAdmin,
  updateLeaveStatus,
);

// get a single employee's leaves
// Used by HR-side attendance calendar + monthly summary so an employee's
// leave requests show up when HR is viewing that employee's data.
router.get(
  "/leaves/employee/:employeeId",
  authMiddleware,
  isHrOrAdmin,
  getLeavesByEmployee,
);

// HR full edit of a leave entry
// Used by the attendance calendar popup — HR can correct leave type, day
// mode (Full/Half Day), status, or reason for a specific leave, not just
// approve/reject once like /leaves/:leaveId/status above.
router.patch(
  "/leaves/:leaveId",
  authMiddleware,
  isHrOrAdmin,
  updateLeaveDetails,
);

// HR create a leave directly for an employee
// Used by the attendance calendar popup's "+ Add Leave" tab — when a
// date has no existing leave, HR fills the same fields (leave type, day
// mode, status, reason) as the edit form above, and this creates a new
// leave instead of patching one.
router.post(
  "/leaves",
  authMiddleware,
  isHrOrAdmin,
  createLeaveForEmployee,
);

// HR remove a leave entirely
// Used by the attendance calendar popup's "Remove Leave" action — the
// "No record" equivalent for leaves, undoes a leave entry completely
// instead of just changing its status to CANCELLED.
router.delete(
  "/leaves/:leaveId",
  authMiddleware,
  isHrOrAdmin,
  deleteLeave,
);

export default router;
