import SalaryStructure from "../../models/salaryStructureSchema.js";
import Employee from "../../models/employee.model.js";
import { createAuditLog } from "../../services/audit.service.js";
import OldEmployee from "../../models/oldEmployee.model.js";

//================== Create Salary Structure ==================//
export const createSalaryStructure = async (req, res) => {
  try {
    const {
      employee,
      effectiveFrom,
      basicSalary,
      hra,
      conveyanceAllowance,
      medicalAllowance,
      specialAllowance,
      bonus,
      professionalTax,
    } = req.body;

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    // Check if employee exists
    const employeeExists = await OldEmployee.findById(employee);
    if (!employeeExists) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check for existing structure
    const existingStructure = await SalaryStructure.findOne({ employee });
    if (existingStructure) {
      return res.status(400).json({
        success: false,
        message:
          "Salary structure already exists for this employee. Use update instead.",
      });
    }

    // Create with only schema fields
    const salaryStructure = await SalaryStructure.create({
      employee,
      effectiveFrom: effectiveFrom || Date.now(),
      basicSalary: Number(basicSalary) || 0,
      hra: Number(hra) || 0,
      conveyanceAllowance: Number(conveyanceAllowance) || 0,
      medicalAllowance: Number(medicalAllowance) || 0,
      specialAllowance: Number(specialAllowance) || 0,
      bonus: Number(bonus) || 0,
      professionalTax: Number(professionalTax) || 0,
    });

    // Sync reference to employee document
    employeeExists.salaryStructureId = salaryStructure._id;
    await employeeExists.save();

    await createAuditLog({
      user: req.user,
      action: "CREATE",
      module: "SALARY_STRUCTURE",
      recordId: salaryStructure._id,
      newData: {
        employee,
        basicSalary,
        hra,
        conveyanceAllowance,
        medicalAllowance,
        specialAllowance,
        bonus,
        professionalTax,
        effectiveFrom,
      },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Salary structure created successfully",
      data: salaryStructure,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//================== Get Salary Structure==================//
export const getAllSalaryStructures = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const total = await SalaryStructure.countDocuments();

    const salaryStructures = await SalaryStructure.find()
      .populate({
        path: "employee",
        select:
          "personal.fullName professional.employeeId  personal.profilePhoto",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      count: salaryStructures.length,
      data: salaryStructures,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//================== Get Salary Structure ByEmployeeId ==================//
export const getSalaryStructure = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const salaryStructure = await SalaryStructure.findOne({
      employee: employeeId,
    }).populate("employee");

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found for this employee",
      });
    }

    return res.status(200).json({
      success: true,
      data: salaryStructure,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//================== Get Salary Structure ById ==================//
export const getSalaryStructureById = async (req, res) => {
  try {
    const { id } = req.params;

    const salaryStructure = await SalaryStructure.findById(id)
      .populate("employee");

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: salaryStructure,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//================== Update Salary Structure ==================//
export const updateSalaryStructure = async (req, res) => {
  try {
    const { id } = req.params;

    const salaryStructure = await SalaryStructure.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("employee");

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "SALARY_STRUCTURE",
      recordId: salaryStructure._id,
      newData: req.body,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Salary structure updated successfully",
      data: salaryStructure,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//================== delete Salary Structure ==================//
export const deleteSalaryStructure = async (req, res) => {
  try {
    const { id } = req.params;

    const salaryStructure = await SalaryStructure.findById(id);

    if (!salaryStructure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure not found",
      });
    }

    // Employee ke reference ko bhi clear kar do
    await OldEmployee.findByIdAndUpdate(
      salaryStructure.employee,
      {
        $unset: { salaryStructureId: 1 },
      }
    );

    await SalaryStructure.findByIdAndDelete(id);

    await createAuditLog({
      user: req.user,
      action: "DELETE",
      module: "SALARY_STRUCTURE",
      recordId: id,
      oldData: salaryStructure,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Salary structure deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
