
////////------------------get Pending Employees--------------------//////////

import Employee from "../../models/employee.model.js";
import { createAuditLog } from "../../services/audit.service.js";


export const getPendingEmployees = async (req, res) => {
 try {
    const pendingEmployees = await Employee.find({
      status: "pending",
      role: "employee",
    })
      .select(
        "name email createdAt status"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: pendingEmployees.length,
      data: pendingEmployees,
    });
  } catch (error) {
    console.error("PENDING EMPLOYEE ERROR 👉", error);
    res.status(500).json({
      message: "Failed to fetch pending employees",
    });
  }
};


////////------------------APPROVE / REJECT EMPLOYEE--------------------//////////


const generateEmployeeCode = async () => {
  const count = await Employee.countDocuments({
    employeeCode: { $ne: null },
  });

  return `EMP${String(count + 1).padStart(4, "0")}`;
};


export const updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // 🔥 Cannot approve self
   if (employee._id.toString() === req.user.id.toString()) {
      return res.status(403).json({
        message: "You cannot approve your own account",
      });
    }

    if (status === "approved") {
      employee.status = "approved";
      employee.isActive = true;
      employee.approvedBy = req.user._id;
      employee.approvedAt = new Date();

      if (!employee.employeeCode) {
        employee.employeeCode = await generateEmployeeCode();
     }
    } else {
      employee.status = "rejected";
      employee.isActive = false;
    }

    await employee.save();

    // ========= Audit log ================= //
    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "EMPLOYEE",
      recordId: employee._id,
      oldData: { status: "pending", isActive: false },
      newData: { status: employee.status, isActive: employee.isActive },
      req,
    });

    res.json({
      message: `Employee ${status} successfully`,
      approvedByRole: req.user.role,
      employeeId: employee._id,
      status: employee.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update employee status" });
  }
};
