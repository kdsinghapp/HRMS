import express from "express";
import {
  createSalary,
  deleteSalary,
  getAllEmployeeSalaryByMonthAndYear,
  getAllSalaryByEmployeeId,
  getMySalary,
  getSalaryById,
  updateSalary
} from "../controllers/salaryController/salary.controller.js";
import {
  generatePayroll,
  recalculatePayroll,
  getEmployeePayrollHistory,
  getPayrollByMonth
} from "../controllers/salaryController/payroll.controller.js";
import {
  generatePayslip,
  getPayslip,
  getMyPayslips
} from "../controllers/salaryController/payslip.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { isHrOrAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

/* ================= Legacy Salary Routes (For Compatibility) ================= */
router.post("/create-Salary", authMiddleware, isHrOrAdmin, createSalary);
router.get("/getAllSalary", authMiddleware, isHrOrAdmin, getAllSalaryByEmployeeId);
router.get("/getAllEmployeeSalaryByMonthAndYear", authMiddleware, isHrOrAdmin, getAllEmployeeSalaryByMonthAndYear);
router.get("/getSalaryById/:id", authMiddleware, isHrOrAdmin, getSalaryById);
router.patch("/updateSalary/:id", authMiddleware, isHrOrAdmin, updateSalary);
router.delete("/deleteSalary/:id", authMiddleware, isHrOrAdmin, deleteSalary);
router.get("/getMySalary", authMiddleware, getMySalary);

/*================= Redesigned Payroll Automation Routes =================*/
// Generate payroll for a single employee (if employeeId in body) or run a monthly batch
router.post("/generate", authMiddleware, isHrOrAdmin, generatePayroll);

// Recalculate payroll for an employee, month, and year
router.post("/payroll/generate", authMiddleware, isHrOrAdmin, generatePayroll);

// Recalculate payroll for an employee, month, and year
router.post("/payroll/recalculate", authMiddleware, isHrOrAdmin, recalculatePayroll);

// Get payroll history for a specific employee
router.get("/payroll/history/:employeeId", authMiddleware, isHrOrAdmin, getEmployeePayrollHistory);

// Get all payrolls generated for a specific month and year
router.get("/payroll/month", authMiddleware, isHrOrAdmin, getPayrollByMonth);


/* ================= Redesigned Payslip Routes ================= */
// Generate payslip for a processed payroll
router.post("/payslip/generate", authMiddleware, isHrOrAdmin, generatePayslip);

// Get employee's own released payslips (Self Service)
router.get("/payslip/my", authMiddleware, getMyPayslips);

// Get/View details of a specific payslip (accepts payslip ID or payroll ID)
router.get("/payslip/:id", authMiddleware, getPayslip);

export default router;