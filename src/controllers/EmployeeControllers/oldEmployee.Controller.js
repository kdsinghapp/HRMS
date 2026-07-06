import OldEmployee from "../../models/oldEmployee.model.js";
import Employee from "../../models/employee.model.js";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary.js";
import qs from "qs";
import { createAuditLog } from './../../services/audit.service.js';

// Helper to generate employee ID
const generateEmployeeId = (employeeData, lastCount = 0) => {
  const fullName = employeeData.personal?.fullName || "";

  // 🔥 Split name into parts
  const nameParts = fullName.trim().split(" ").filter(Boolean);

  // 🔥 First name first letter
  const firstLetter = nameParts[0]?.[0]?.toUpperCase() || "X";

  // 🔥 Last name first letter (NOT last char)
  const lastLetter =
    nameParts.length > 1
      ? nameParts[nameParts.length - 1][0]?.toUpperCase()
      : "X";

  // 🔥 Company letter
  const companyLetter = "T";

  // 🔥 Current year (last 2 digits)
  const currentYear = new Date().getFullYear().toString().slice(-2);

  // 🔥 Sequence
  const sequence = String(lastCount + 1).padStart(3, "0");

  return `${firstLetter}${lastLetter}${companyLetter}${currentYear}${sequence}`;
};

// ==================== CREATE EMPLOYEE ====================
import bcrypt from "bcrypt";

export const createEmployee = async (req, res) => {
  try {
    const files = req.files || {};

    // 1. Parse text fields
    const nestedBody = qs.parse(req.body);

    // 2. Handle profile photo
    let profilePhotoUrl = null;
    if (files["personal[profilePhoto]"]) {
      const result = await uploadToCloudinary(
        files["personal[profilePhoto]"][0].buffer,
        "employees/profile"
      );
      profilePhotoUrl = result.secure_url;
    }

    const documents = {};
    const docFields = [
      "aadharCard",
      "panCard",
      "resume",
      "education",
      "experience",
      "offerLetter",
    ];

    for (const field of docFields) {
      const key = `documents[${field}]`;

      if (files[key]) {
        const file = files[key][0];

        const result = await uploadToCloudinary(
          file,
          `employees/${field}`
        );

        documents[field] = result.secure_url;
      }
    }

    // 4. Build final employee data
    const employeeData = {
      ...nestedBody,
      personal: {
        ...(nestedBody.personal || {}),
        ...(profilePhotoUrl && { profilePhoto: profilePhotoUrl }),
      },
      documents: {
        ...(nestedBody.documents || {}),
        ...documents,
      },
    };

    // 5. Remove temporary field
    if (
      employeeData.address &&
      employeeData.address.sameAsCurrent !== undefined
    ) {
      delete employeeData.address.sameAsCurrent;
    }

    // ================= NEW FIELD FIX =================

    // ✅ Ensure account object exists
    if (!employeeData.account) employeeData.account = {};

    // 🔥 HASH LOGIN PASSWORD
    if (employeeData.account.loginPassword) {
      const hashedPassword = await bcrypt.hash(
        employeeData.account.loginPassword,
        10
      );

      employeeData.account.loginPassword = hashedPassword;
    }

    // ================= BANK FIX =================

    if (!employeeData.bank) employeeData.bank = {};

    // 👉 Auto fill account holder name if empty
    if (!employeeData.bank.accountHolderName) {
      employeeData.bank.accountHolderName =
        employeeData.personal?.fullName || "";
    }

    // ================= EMPLOYEE ID =================

    if (!employeeData.professional) employeeData.professional = {};

    let employeeId;
    let isUnique = false;

    const currentYear = new Date().getFullYear();
    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear, 11, 31);

    while (!isUnique) {
      const count = await OldEmployee.countDocuments({
        createdAt: { $gte: start, $lte: end },
      });

      employeeId = generateEmployeeId(employeeData, count);

      const exists = await OldEmployee.findOne({
        "professional.employeeId": employeeId,
      });

      if (!exists) {
        isUnique = true;
      }
    }

    employeeData.professional.employeeId = employeeId;

    // ================= SAVE =================

    const employee = await OldEmployee.create(employeeData);

    // ========= Audit log ================= //
    await createAuditLog({
      user: req.user,
      action: "CREATE",
      module: "EMPLOYEE",
      recordId: employee._id,
      oldData: null,
      newData: employee,
      req,
    });

    console.log("Employee created:", employee._id);

    res.status(201).json({
      message: "Employee created successfully",
      data: employee,
    });

  } catch (error) {
    console.error("Create Employee Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE EMPLOYEE ====================



export const updateEmployee = async (req, res) => {
  try {
    const files = req.files || {};

    // ✅ FIX 1
    const nestedBody = qs.parse(req.body);

    /* -------- Profile Photo Upload -------- */

    if (files["personal[profilePhoto]"]) {
      try {
        const file = files["personal[profilePhoto]"][0];

        const result = await uploadToCloudinary(
          file.buffer || file, // ✅ FIX 2
          "employees/profile"
        );

        nestedBody.personal = {
          ...(nestedBody.personal || {}),
          profilePhoto: result.secure_url,
        };

      } catch (err) {
        console.error("Profile upload failed:", err);
      }
    }

    /* -------- Documents Upload -------- */

    const docFields = [
      "aadharCard",
      "panCard",
      "resume",
      "education",
      "experience",
      "offerLetter",
    ];

    const documents = {};

    for (const field of docFields) {
      const key = `documents[${field}]`;

      if (files[key]) {
        try {
          const file = files[key][0];

          const result = await uploadToCloudinary(
            file.buffer || file, // ✅ FIX 2
            `employees/${field}`
          );

          documents[field] = result.secure_url;

        } catch (err) {
          console.error(`Upload failed for ${field}:`, err);
        }
      }
    }

    // ✅ FIX 3
    if (Object.keys(documents).length > 0) {
      nestedBody.documents = {
        ...(typeof nestedBody.documents === "object"
          ? nestedBody.documents
          : {}),
        ...documents,
      };
    }

    /* -------- Remove temporary field -------- */

    if (nestedBody.address?.sameAsCurrent !== undefined) {
      delete nestedBody.address.sameAsCurrent;
    }

    /* -------- Flatten -------- */

    const flattenObject = (obj, prefix = "", res = {}) => {
      for (let key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          flattenObject(value, newKey, res);
        } else if (
          value !== "" &&
          value !== undefined &&
          value !== null
        ) {
          res[newKey] = value;
        }
      }
      return res;
    };

    const updateData = flattenObject(nestedBody);

    /* -------- Update -------- */

    const updatedEmployee = await OldEmployee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({
      message: "Employee updated successfully",
      data: updatedEmployee,
    });

  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET ALL EMPLOYEES (NEW + OLD) ====================
export const getAllEmployees = async (req, res) => {
  // console.log("Total employees fetched:");
  try {
    const newEmployees = await Employee.find().lean();
    const oldEmployees = await OldEmployee.find().lean();

    const formattedNew = newEmployees.map((emp) => ({
      ...emp,
      employeeType: "new",
    }));

    const formattedOld = oldEmployees.map((emp) => ({
      ...emp,
      employeeType: "old",
    }));

    const allEmployees = [...formattedNew, ...formattedOld].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
// console.log("Total employees fetched:", allEmployees);
    res.status(200).json({
      success: true,
      count: allEmployees.length,
      data: allEmployees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==================== GET ALL OLD EMPLOYEES (LEGACY) ====================
export const getEmployees = async (req, res) => {
  try {
    const employees = await OldEmployee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET EMPLOYEE BY ID (NEW MODEL) ====================
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

