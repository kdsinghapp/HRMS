import { ACTIONS, MODULES } from "../../constants/audit.js";
import OldEmployee from "../../models/oldEmployee.model.js";
import Salary from "../../models/salary.model.js";
import SalaryStructure from "../../models/salaryStructureSchema.js";
import { createAuditLog } from "../../services/audit.service.js";

/* ================= CREATE (OR UPDATE SAME MONTH) ================= */
export const createSalary = async (req, res) => {
  try {
    const { employee, month, year } = req.body;

    if (!employee || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Employee, month and year are required",
      });
    }

    // Employee Check
    const employeeExists = await OldEmployee.findById(employee);

    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Salary Structure Check
    const structure = await SalaryStructure.findOne({ employee });

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    // ==========================
    // Earnings
    // ==========================

    const basic = structure.basicSalary || 0;
    const hra = structure.hra || 0;
    const specialAllowance = structure.allowances || 0;
    const bonus = structure.bonus || 0;

    const grossSalary =
      basic +
      hra +
      specialAllowance +
      bonus;console.log("GROSS:", grossSalary);
    // ==========================
    // Deductions
    // ==========================

    // PF = 12% of Basic
    const pf = Math.round((basic * 12) / 100);

    // ESI = 0.75% of Gross (only if gross <= 21000)
    const esi =
      grossSalary <= 21000
        ? Number(((grossSalary * 0.75) / 100).toFixed(2))
        : 0;

    const professionalTax = structure.professionalTax || 0;

    const otherDeduction =
      structure.otherDeductions || 0;

    const totalDeduction =
      pf +
      esi +
      professionalTax +
      otherDeduction;

    const netSalary =
      grossSalary - totalDeduction;

    // ==========================
    // Salary Payload
    // ==========================

    const salaryPayload = {
      employee,
      month,
      year,

      salaryType: "monthly",
      effectiveFrom: structure.effectiveFrom,

      // Earnings
      basic,
      hra,
      specialAllowance,
      bonus,

      // Deductions
      pf,
      esi,
      professionalTax,
      otherDeduction,

      // Calculated
      grossSalary,
      netSalary,
    };

    // ==========================
    // Existing Salary Check
    // ==========================

    let existingSalary = await Salary.findOne({
      employee,
      month,
      year,
    });

    if (existingSalary) {
      const oldData = existingSalary.toObject();

      Object.assign(existingSalary, salaryPayload);

      await existingSalary.save();

      await createAuditLog({
        user: req.user,
        action: ACTIONS.UPDATE,
        module: MODULES.SALARY,
        recordId: existingSalary._id,
        oldData,
        newData: existingSalary,
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Salary regenerated successfully",
        data: existingSalary,
      });
    }

    // ==========================
    // Create Salary
    // ==========================

    const salary = await Salary.create(
      salaryPayload
    );

    await createAuditLog({
      user: req.user,
      action: ACTIONS.CREATE,
      module: MODULES.SALARY,
      recordId: salary._id,
      newData: salary,
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Salary generated successfully",
      data: salary,
    });
  } catch (error) {
    console.error(
      "Salary Generation Error:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Salary already exists for this employee for this month",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to generate salary",
    });
  }
};


/* ================= GET ALL (FILTER SUPPORT) ================= */
export const getAllSalaryByEmployeeId = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    const filter = {};

    if (employeeId) {
      filter.employee = employeeId;
    }

    if (month) {
      filter.month = Number(month);
    }

    if (year) {
      filter.year = Number(year);
    }

    const salaries = await Salary.find(filter)
      .populate({
        path: "employee",
        select: "personal.fullName professional.employeeId",
      })
      .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      count: salaries.length,
      data: salaries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllEmployeeSalaryByMonthAndYear = async (req, res) => {
  try {
    const { month, year } = req.query;

    const filter = {};

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const salaries = await Salary.find(filter)
      .populate({
        path: "employee",
        select: "personal.fullName professional.employeeId",
      })
      .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      count: salaries.length,
      data: salaries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET BY ID ================= */
export const getSalaryById = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate("employee", "personal.fullName professional.employeeId");

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary not found",
      });
    }

    return res.json({
      success: true,
      message: "Salary fetched successfully",
      data: salary,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch salary",
    });
  }
};


/* ================= UPDATE ================= */
export const updateSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary not found",
      });
    }

    const oldData = salary.toObject();

    Object.assign(salary, req.body);
    await salary.save(); // pre-save triggers

    await createAuditLog({
      user: req.user,
      action: ACTIONS.UPDATE,
      module: MODULES.SALARY,
      recordId: salary._id,
      oldData,
      newData: salary,
      req,
    });

    return res.json({
      success: true,
      message: "Salary updated successfully",
      data: salary,
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate salary for this month",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update salary",
    });
  }
};


/* ================= DELETE ================= */
export const deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary not found",
      });
    }

    const oldData = salary.toObject();

    await salary.deleteOne();

    await createAuditLog({
      user: req.user,
      action: ACTIONS.DELETE,
      module: MODULES.SALARY,
      recordId: req.params.id,
      oldData,
      req,
    });

    return res.json({
      success: true,
      message: "Salary deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete salary",
    });
  }
};


/* ================= GET MY SALARY ================= */
export const getMySalary = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const salaries = await Salary.find({ employee: employeeId })
      .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      count: salaries.length,
      data: salaries,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};