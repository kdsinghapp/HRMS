import Department from "../../models/department.model.js";
import Designation from "../../models/designation.model.js";
import { createAuditLog } from "../../services/audit.service.js";

// GET /api/admin-panel/departments
export const listDepartments = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === "true";

    const departments = await Department.find(filter).sort({ name: 1 });

    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin-panel/departments
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const existing = await Department.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (existing) {
      return res.status(409).json({ success: false, message: "Department already exists" });
    }

    const department = await Department.create({
      name,
      code: code || null,
      description: description || "",
      createdBy: req.user.id,
    });

    await createAuditLog({
      user: req.user,
      action: "CREATE",
      module: "DEPARTMENT",
      recordId: department._id,
      newData: department.toObject(),
      req,
    });

    res.status(201).json({ success: true, message: "Department created", data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin-panel/departments/:id
export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const oldData = department.toObject();
    Object.assign(department, req.body);
    await department.save();

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "DEPARTMENT",
      recordId: department._id,
      oldData,
      newData: req.body,
      req,
    });

    res.status(200).json({ success: true, message: "Department updated", data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin-panel/departments/:id
export const deleteDepartment = async (req, res) => {
  try {
    const inUse = await Designation.countDocuments({ department: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a department that still has designations linked to it",
      });
    }

    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    await createAuditLog({
      user: req.user,
      action: "DELETE",
      module: "DEPARTMENT",
      recordId: req.params.id,
      oldData: department.toObject(),
      req,
    });

    res.status(200).json({ success: true, message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
