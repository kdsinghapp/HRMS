import * as payrollService from "../../services/payroll.service.js";
import Payslip from "../../models/payslip.model.js";
import Payroll from "../../models/PayrollSchema.model.js";
import { createAuditLog } from "../../services/audit.service.js";

//================== Generate Payslip ==================//
export const generatePayslip = async (req, res) => {
  try {
    const { payrollId, employeeId, month, year, status } = req.body;

    let targetPayrollId = payrollId;

    // If payrollId is not provided, look up by employee, month, and year
    if (!targetPayrollId) {
      if (!employeeId || !month || !year) {
        return res.status(400).json({
          success: false,
          message: "Provide either 'payrollId' OR 'employeeId', 'month', and 'year'.",
        });
      }

      const payroll = await Payroll.findOne({
        employee: employeeId,
        month: Number(month),
        year: Number(year),
      });

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: `No payroll record found for employee in period ${month}/${year}. Generate payroll first.`,
        });
      }

      targetPayrollId = payroll._id;
    }

    const payslip = await payrollService.generateEmployeePayslip(
      targetPayrollId,
      status || "released"
    );

    const populatedPayslip = await Payslip.findById(payslip._id)
      .populate({
        path: "payroll",
        populate: {
          path: "employee",
          select: "name employeeCode designation department dateOfJoining email"
        }
      });

    await createAuditLog({
      user: req.user,
      action: "CREATE",
      module: "PAYSLIP",
      recordId: payslip._id,
      newData: { payrollId: targetPayrollId, status: payslip.status },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Payslip generated successfully",
      data: populatedPayslip,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//================== Get Payslip by Payroll/Payslip ID ==================//
export const getPayslip = async (req, res) => {
  try {
    const { id } = req.params; // Can be payslip ID or payroll ID

    const payslip = await Payslip.findOne({
      $or: [{ _id: id }, { payroll: id }, { payslipId: id }],
    }).populate({
      path: "payroll",
      populate: {
        path: "employee",
        select: "name employeeCode designation department dateOfJoining email"
      }
    });

    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: "Payslip not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payslip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//================== Get My Payslips (Employee Self Service) ==================//
export const getMyPayslips = async (req, res) => {
  try {
    const employeeId = req.user.id; // From authMiddleware

    const payslips = await Payslip.find({
      employee: employeeId,
      status: "released", // Only show released payslips to employees
    })
      .populate({
        path: "payroll",
        select: "-employee" // Don't need to populate employee details again
      })
      .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      count: payslips.length,
      data: payslips,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
