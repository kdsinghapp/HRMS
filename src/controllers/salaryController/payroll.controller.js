import * as payrollService from "../../services/payroll.service.js";
import Payroll from "../../models/PayrollSchema.model.js";
import { createAuditLog } from "../../services/audit.service.js";

//================== Generate Payroll (Single or Bulk) ==================//
export const generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, remarks } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and Year are required fields.",
      });
    }

    if (employeeId) {
      // Generate for a single employee
      const payroll = await payrollService.generateEmployeePayroll(
        employeeId,
        Number(month),
        Number(year),
        remarks || "Generated manually via API"
      );

      await createAuditLog({
        user: req.user,
        action: "CREATE",
        module: "PAYROLL",
        recordId: payroll._id,
        newData: { employeeId, month, year, netSalary: payroll.netSalary },
        req,
      });

      return res.status(201).json({
        success: true,
        message: "Payroll generated successfully",
        data: payroll,
      });
    } else {
      // Bulk generation for all active employees
      const result = await payrollService.generateMonthlyPayrollBatch(
        Number(month),
        Number(year)
      );

      await createAuditLog({
        user: req.user,
        action: "CREATE",
        module: "PAYROLL",
        recordId: null,
        newData: { month, year, bulk: true, summary: result },
        req,
      });

      return res.status(201).json({
        success: true,
        message: `Batch payroll generation run finished. Created: ${result.createdCount}, Skipped: ${result.skippedCount}, Failed: ${result.failedCount}`,
        data: result,
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to generate payroll",
    });
  }
};

//================== Recalculate Payroll ==================//
export const recalculatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, remarks } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, Month, and Year are required fields.",
      });
    }

    const payroll = await payrollService.recalculateEmployeePayroll(
      employeeId,
      Number(month),
      Number(year),
      remarks || "Recalculated manually via API"
    );

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "PAYROLL",
      recordId: payroll._id,
      newData: { employeeId, month, year, netSalary: payroll.netSalary, recalculated: true },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Payroll recalculated and updated successfully",
      data: payroll,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to recalculate payroll",
    });
  }
};

//================== Get Employee Payroll History ==================//
export const getEmployeePayrollHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const history = await Payroll.find({ employee: employeeId })
      // .populate("employee", "name employeeCode designation department dateOfJoining")
      // .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//================== Get Payroll By Month ==================//
export const getPayrollByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and Year query parameters are required.",
      });
    }

    const payrolls = await Payroll.find({
      month: Number(month),
      year: Number(year),
    })
      .populate("employee", "name employeeCode designation department dateOfJoining")
      .sort({ netSalary: -1 });

    return res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
