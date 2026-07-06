import Employee from "../../models/employee.model.js";
import { createAuditLog } from "../../services/audit.service.js";

/* ================= REGISTER EMPLOYEE ================= */


export const registerEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      dateOfBirth,
      contactNo,
      personalEmail,
      currentAddress,
      permanentAddress,
      emergencyNo,
    } = req.body;

    console.log("Register Body: [redacted for security]");

    /* ================= Validation ================= */
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Password are required",
      });
    }

    /* ================= Check Existing ================= */
    const exists = await Employee.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    /* ================= Create Employee ================= */
    const employee = await Employee.create({
      name,
      email,
      password, // 🔥 plain password (schema will hash it)
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      contactNo: contactNo || null,
      personalEmail: personalEmail || null,
      currentAddress: currentAddress || null,
      permanentAddress: permanentAddress || null,
      emergencyNo: emergencyNo || null,
      role: "employee",
      status: "pending",
      isActive: false,
      emailVerified: false,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Waiting for HR approval.",
      data: employee,
    });

  } catch (error) {
    console.error("Register Employee Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

/* ================= GET MY PROFILE ================= */
export const getMyProfile = async (req, res) => {
  const employee = await Employee.findById(req.user.id).select("-password");
  

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({
    message: "Profile fetched successfully",
    data: employee,
  });
};

/* ================= UPDATE MY PROFILE ================= */
export const updateMyProfile = async (req, res) => {
  const allowedFields = [
    "name",
    "contactNo",
    "currentAddress",
    "permanentAddress",
    "emergencyNo",
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const employee = await Employee.findByIdAndUpdate(
    req.user.userId,
    updateData,
    { new: true }
  ).select("-password");

  if (employee) {
    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "EMPLOYEE",
      recordId: employee._id,
      newData: updateData,
      req,
    });
  }

  res.json({
    message: "Profile updated successfully",
    data: employee,
  });
};
