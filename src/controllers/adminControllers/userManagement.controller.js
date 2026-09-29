import bcrypt from "bcrypt";
import OldEmployee from "../../models/oldEmployee.model.js";
import { createAuditLog } from "../../services/audit.service.js";
import { sendEmail } from "../../utils/sendEmail.js";
import { staffCredentialsEmailTemplate } from "../../utils/emailTemplates/staffCredentialsEmail.js";

const SAFE_FIELDS =
  "personal contact professional account.officialEmail roles createdAt updatedAt";

// Guard used everywhere below: an admin can never strip their own admin
// role, and the very last remaining admin account can never be demoted /
// deactivated / deleted — otherwise the system would lock everyone out of
// the Admin Panel with no way back in.
const isLastRemainingAdmin = async (targetId) => {
  const target = await OldEmployee.findById(targetId).select("roles");
  if (!target || !target.roles?.includes("admin")) return false;

  const otherAdmins = await OldEmployee.countDocuments({
    _id: { $ne: targetId },
    roles: "admin",
  });

  return otherAdmins === 0;
};

// GET /api/admin-panel/users
// List every account in the system with search + role/status filters.
export const listAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (role) filter.roles = role;
    if (status) filter["professional.status"] = status;

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { "personal.fullName": regex },
        { "account.officialEmail": regex },
        { "professional.employeeId": regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      OldEmployee.find(filter)
        .select(SAFE_FIELDS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      OldEmployee.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin-panel/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await OldEmployee.findById(req.params.id).select(SAFE_FIELDS);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin-panel/users
// Admin directly creates a fully active HR / Admin (or Employee) login —
// unlike the normal HR onboarding wizard, no approval step is needed since
// Admin is the highest authority already.
export const createStaffUser = async (req, res) => {
  try {
    const { fullName, officialEmail, password, roles, department, designation, contactNo } =
      req.body;

    const normalizedEmail = officialEmail.toLowerCase();

    const existing = await OldEmployee.findOne({
      "account.officialEmail": normalizedEmail,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeCount = await OldEmployee.countDocuments({});

    const user = await OldEmployee.create({
      personal: { fullName },
      contact: { primaryPhone: contactNo || "" },
      professional: {
        employeeId: `TZ${String(employeeCount + 1).padStart(4, "0")}`,
        department: department || "",
        designation: designation || "",
        employmentType: "Full Time",
        status: "Active",
        dateOfJoining: new Date(),
      },
      account: {
        officialEmail: normalizedEmail,
        loginPassword: hashedPassword,
      },
      roles,
    });

    await createAuditLog({
      user: req.user,
      action: "CREATE",
      module: "USER",
      recordId: user._id,
      newData: { officialEmail: normalizedEmail, roles },
      req,
    });

    // Best-effort — account creation should not fail if the mailer is down.
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your HRMS account has been created",
        html: staffCredentialsEmailTemplate({
          fullName,
          email: normalizedEmail,
          password,
          roles,
          loginUrl: `${process.env.FRONTEND_URL}/login`,
        }),
      });
    } catch (mailError) {
      console.error("Staff credentials email failed:", mailError.message);
    }

    res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      data: {
        id: user._id,
        employeeId: user.professional.employeeId,
        officialEmail: normalizedEmail,
        roles: user.roles,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin-panel/users/:id/roles
// Grant / revoke roles for an existing account — this is the one action
// that HR can never perform, by design.
export const updateUserRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;

    if (id === req.user.id && !roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "You cannot remove your own admin access",
      });
    }

    if (!roles.includes("admin") && (await isLastRemainingAdmin(id))) {
      return res.status(403).json({
        success: false,
        message: "Cannot remove the only remaining admin account",
      });
    }

    const user = await OldEmployee.findById(id).select("roles personal.fullName");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const oldRoles = user.roles;
    user.roles = roles;
    await user.save();

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "USER",
      recordId: user._id,
      oldData: { roles: oldRoles },
      newData: { roles },
      req,
    });

    res.status(200).json({
      success: true,
      message: "User roles updated successfully",
      data: { id: user._id, roles: user.roles },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin-panel/users/:id/status
// Activate / deactivate ANY account, including other HR or Admin users —
// the HR-side toggle only ever touches plain employees.
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    if (await isLastRemainingAdmin(id)) {
      return res.status(403).json({
        success: false,
        message: "Cannot deactivate the only remaining admin account",
      });
    }

    const user = await OldEmployee.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const oldStatus = user.professional?.status;
    const nextStatus = oldStatus === "Active" ? "Inactive" : "Active";
    user.professional.status = nextStatus;
    await user.save();

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "USER",
      recordId: user._id,
      oldData: { status: oldStatus },
      newData: { status: nextStatus },
      req,
    });

    res.status(200).json({
      success: true,
      message: `User ${nextStatus === "Active" ? "activated" : "deactivated"} successfully`,
      data: { id: user._id, status: nextStatus },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin-panel/users/:id/reset-password
// Admin sets a new password for a user directly (e.g. locked-out HR staff)
export const adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await OldEmployee.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.account.loginPassword = await bcrypt.hash(newPassword, 10);
    await user.save();

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "USER",
      recordId: user._id,
      newData: { passwordReset: true },
      req,
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully. Share the new password with the user securely.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin-panel/users/:id
// Permanently removes an account. Used sparingly — deactivating (above) is
// the reversible, preferred action; this is for accounts created in error
// or offboarded staff whose data retention isn't required.
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    if (await isLastRemainingAdmin(id)) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete the only remaining admin account",
      });
    }

    const user = await OldEmployee.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await createAuditLog({
      user: req.user,
      action: "DELETE",
      module: "USER",
      recordId: id,
      oldData: {
        officialEmail: user.account?.officialEmail,
        roles: user.roles,
      },
      req,
    });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin-panel/dashboard/summary
// High-level counts for the Admin dashboard landing page.
export const getAdminUserSummary = async (req, res) => {
  try {
    const [totalUsers, admins, hrs, employeesOnly, active, inactive] = await Promise.all([
      OldEmployee.countDocuments({}),
      OldEmployee.countDocuments({ roles: "admin" }),
      OldEmployee.countDocuments({ roles: "hr" }),
      OldEmployee.countDocuments({ roles: { $size: 1, $all: ["employee"] } }),
      OldEmployee.countDocuments({ "professional.status": "Active" }),
      OldEmployee.countDocuments({ "professional.status": { $ne: "Active" } }),
    ]);

    res.status(200).json({
      success: true,
      data: { totalUsers, admins, hrs, employeesOnly, active, inactive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
