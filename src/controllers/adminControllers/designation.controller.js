import Designation from "../../models/designation.model.js";
import { createAuditLog } from "../../services/audit.service.js";

// GET /api/admin-panel/designations
export const listDesignations = async (req, res) => {
  try {
    const { active, department } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === "true";
    if (department) filter.department = department;

    const designations = await Designation.find(filter)
      .populate("department", "name")
      .sort({ title: 1 });

    res.status(200).json({ success: true, count: designations.length, data: designations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin-panel/designations
export const createDesignation = async (req, res) => {
  try {
    const { title, department } = req.body;

    const designation = await Designation.create({
      title,
      department: department || null,
      createdBy: req.user.id,
    });

    await createAuditLog({
      user: req.user,
      action: "CREATE",
      module: "DESIGNATION",
      recordId: designation._id,
      newData: designation.toObject(),
      req,
    });

    res.status(201).json({ success: true, message: "Designation created", data: designation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This designation already exists for the selected department",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin-panel/designations/:id
export const updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return res.status(404).json({ success: false, message: "Designation not found" });
    }

    const oldData = designation.toObject();
    Object.assign(designation, req.body);
    await designation.save();

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "DESIGNATION",
      recordId: designation._id,
      oldData,
      newData: req.body,
      req,
    });

    res.status(200).json({ success: true, message: "Designation updated", data: designation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin-panel/designations/:id
export const deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndDelete(req.params.id);
    if (!designation) {
      return res.status(404).json({ success: false, message: "Designation not found" });
    }

    await createAuditLog({
      user: req.user,
      action: "DELETE",
      module: "DESIGNATION",
      recordId: req.params.id,
      oldData: designation.toObject(),
      req,
    });

    res.status(200).json({ success: true, message: "Designation deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
