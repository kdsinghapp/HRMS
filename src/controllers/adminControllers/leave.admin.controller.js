import Leave from "../../models/leave.model.js";
import OldEmployee from "../../models/oldEmployee.model.js";
import { createAuditLog } from "../../services/audit.service.js";
import { notifyUser } from "../../services/notification.service.js";

// A pure HR user (roles include "hr" but not "admin") must never be able
// to see or act on a leave request filed by another HR-role employee —
// those are routed to Admin only. A true Admin (roles include "admin")
// is unrestricted, same as before.
const isTrueAdmin = (req) => !!req.user?.roles?.includes("admin");

// Ids of every employee who themselves holds the "hr" role — used to
// exclude/guard their leave requests from the HR-only view.
const getHrEmployeeIds = async () => {
  const hrEmployees = await OldEmployee.find({ roles: "hr" }).select("_id");
  return hrEmployees.map((e) => String(e._id));
};

// GET ALL LEAVES

export const getAllLeaves = async (req, res) => {
  try {
    const query = {};

    if (!isTrueAdmin(req)) {
      // Pure HR: HR's own (and any other HR colleague's) leave requests
      // are Admin's call, not visible/actionable from the HR-only view.
      const hrIds = await getHrEmployeeIds();
      if (hrIds.length > 0) {
        query.employeeId = { $nin: hrIds };
      }
    }

    const leaves = await Leave.find(query)
      .populate({
        path: "employeeId",
        select: {
          personal: {
            fullName: 1,
          },
        },
      })
      .populate({
        path: "approvedBy",
        select: {
          personal: 1,
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET LEAVES FOR A SINGLE EMPLOYEE
// GET /admin/leaves/employee/:employeeId
// Optional ?year=&month= narrows to leave dates falling in that month —
// same shape as the attendance-by-employee endpoint. Used by the HR-side
// attendance calendar/summary so an employee's approved & pending leaves
// show up even when HR (not the employee) is viewing the data.
export const getLeavesByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;

    const query = { employeeId };

    if (year && month) {
      const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      const end = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));
      query.dates = { $elemMatch: { $gte: start, $lte: end } };
    }

    const leaves = await Leave.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// FILTER LEAVES
export const filterLeaves = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};

    if (status) {
      query.status = status.toUpperCase(); // normalize
    }

    const leaves = await Leave.find(query)
      .populate("employeeId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// UPDATE LEAVE STATUS
export const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, rejectionReason } = req.body;

    const approverId = req.user.id;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    // HR's own leave requests (and any other HR colleague's) are Admin's
    // call only — a pure HR user can't approve/reject one, even if they
    // somehow have the leaveId.
    const isAdmin = isTrueAdmin(req);
    if (!isAdmin) {
      const targetEmployee = await OldEmployee.findById(leave.employeeId).select("roles");
      if (targetEmployee?.roles?.includes("hr")) {
        return res.status(403).json({
          success: false,
          message: "Only Admin can approve or reject an HR user's leave request.",
        });
      }
    }
    
    if (leave.employeeId.toString() === approverId.toString()) {
       return res.status(403).json({
          success: false,
          message: "You cannot approve your own leave",
       });
    }

    if (isAdmin) {
      if (leave.status !== "PENDING_ADMIN") {
        return res.status(400).json({
          success: false,
          message: "Admin can only process PENDING_ADMIN leaves",
        });
      }
    } else {
      if (leave.status !== "PENDING" && leave.status !== "PENDING_HR") {
        return res.status(400).json({
          success: false,
          message: "HR can only process PENDING_HR leaves",
        });
      }
    }

    if (status === "APPROVED") {
      if (!isAdmin) {
        leave.status = "PENDING_ADMIN";
        leave.hrApprovedBy = approverId;
        leave.hrApprovedAt = new Date();
      } else {
        leave.status = "APPROVED";
        leave.adminApprovedBy = approverId;
        leave.adminApprovedAt = new Date();
      }
    } else if (status === "REJECTED") {
      leave.status = "REJECTED";
      leave.rejectionReason = rejectionReason || "";
      if (!isAdmin) {
        leave.hrApprovedBy = approverId;
        leave.hrApprovedAt = new Date();
      } else {
        leave.adminApprovedBy = approverId;
        leave.adminApprovedAt = new Date();
      }
    }

    if (leave.status === "APPROVED" || leave.status === "REJECTED") {
      leave.approvedBy = approverId;
      leave.approvedAt = new Date();
    }

    await leave.save();

    // Audit log
    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "LEAVE",
      recordId: leave._id,
      affectedEmployeeId: leave.employeeId,
      newData: { status: leave.status, approvedBy: approverId, rejectionReason: leave.rejectionReason },
      req,
    });

    // Notify employee
    let notificationTitle = "";
    let notificationMessage = "";

    if (leave.status === "PENDING_ADMIN") {
      notificationTitle = "Leave Forwarded to Admin";
      notificationMessage = `Leave approved by HR and forwarded to Admin for final approval.`;
    } else if (leave.status === "APPROVED") {
      notificationTitle = "Leave Approved";
      notificationMessage = `Your ${leave.leaveType} request has been finally approved.`;
    } else if (leave.status === "REJECTED") {
      const rejectorRole = isAdmin ? "Admin" : "HR";
      notificationTitle = "Leave Rejected";
      notificationMessage = `Your ${leave.leaveType} request was rejected by ${rejectorRole}${
        leave.rejectionReason ? `: ${leave.rejectionReason}` : ""
      }`;
    }

    await notifyUser({
      recipientId: leave.employeeId,
      title: notificationTitle,
      message: notificationMessage,
      type: "LEAVE",
      link: "/employee/leaveManagement",
      createdBy: approverId,
    });

    res.json({
      success: true,
      message: `Leave ${leave.status.toLowerCase()}`,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// UPDATE LEAVE DETAILS (HR full edit)
// PATCH /admin/leaves/:leaveId
// Lets HR correct a leave entry from the attendance calendar popup —
// leave type, day mode (Full/Half Day), status and reason. Unlike
// updateLeaveStatus above (which only handles the PENDING → APPROVED/
// REJECTED decision once), this can be used any time to fix a mistake,
// e.g. changing "Sick Leave" to "Casual Leave" or Full Day to Half Day
// on an already-approved leave.
const EDITABLE_LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Paid Leave",
  "Emergency Leave",
];
const EDITABLE_LEAVE_MODES = ["Full Day", "Half Day"];
const EDITABLE_LEAVE_STATUSES = ["PENDING", "PENDING_HR", "PENDING_ADMIN", "APPROVED", "REJECTED", "CANCELLED"];

export const updateLeaveDetails = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const {
      leaveType,
      leaveMode,
      status,
      reason,
      rejectionReason,
      emergencyContact,
      appliedDate,
    } = req.body;

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    // Same Admin-only guard as updateLeaveStatus — a pure HR user can't
    // edit another HR colleague's (or their own) leave entry.
    if (!isTrueAdmin(req)) {
      const targetEmployee = await OldEmployee.findById(leave.employeeId).select("roles");
      if (targetEmployee?.roles?.includes("hr")) {
        return res.status(403).json({
          success: false,
          message: "Only Admin can edit an HR user's leave request.",
        });
      }
    }

    if (leaveType !== undefined) {
      if (!EDITABLE_LEAVE_TYPES.includes(leaveType)) {
        return res.status(400).json({ success: false, message: "Invalid leave type" });
      }
      leave.leaveType = leaveType;
    }

    if (leaveMode !== undefined) {
      if (!EDITABLE_LEAVE_MODES.includes(leaveMode)) {
        return res.status(400).json({ success: false, message: "Invalid leave mode" });
      }
      leave.leaveMode = leaveMode;
    }

    if (reason !== undefined) {
      leave.reason = reason;
    }

    // The employee's own leave table renders `emergencyContact` verbatim,
    // so HR can correct/add it here directly (e.g. a leave created for an
    // employee that needs a real contact on file), same as leaveType/mode.
    if (emergencyContact !== undefined && emergencyContact !== "") {
      leave.emergencyContact = emergencyContact;
    }

    // The "Applied" date shown in the employee's leave table is
    // `createdAt`. HR can backdate/adjust it here — since this doc isn't
    // new, Mongoose's timestamps plugin only touches `updatedAt` on save,
    // so this assignment sticks instead of being overwritten.
    if (appliedDate !== undefined && appliedDate !== "") {
      const cleanDate = appliedDate.includes("T")
        ? appliedDate.split("T")[0]
        : appliedDate;
      const [y, m, d] = cleanDate.split("-").map(Number);
      leave.createdAt = new Date(Date.UTC(y, m - 1, d));
    }

    if (status !== undefined) {
      if (!EDITABLE_LEAVE_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      leave.status = status;
      if (status === "APPROVED" || status === "REJECTED") {
        leave.approvedBy = req.user?.id || leave.approvedBy;
        leave.approvedAt = new Date();
      }
      if (status === "REJECTED") {
        leave.rejectionReason = rejectionReason || leave.rejectionReason || "";
      }
      // No employee notification here — HR editing a leave from the
      // attendance calendar (leave type/day/status/reason correction) is
      // an internal adjustment, not a leave decision, and isn't something
      // the employee needs to be alerted about. The real "leave decision"
      // notification is sent from updateLeaveStatus above, for the normal
      // approve/reject action on a pending request.
    }

    await leave.save();

    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "LEAVE",
      recordId: leave._id,
      newData: {
        leaveType: leave.leaveType,
        leaveMode: leave.leaveMode,
        status: leave.status,
        reason: leave.reason,
      },
      req,
    });

    res.json({
      success: true,
      message: "Leave updated successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// CREATE LEAVE FOR EMPLOYEE (HR)
// POST /admin/leaves
// Lets HR create a leave entry directly from the attendance calendar
// popup when a date has no existing leave yet — same fields (leave type,
// day mode, status, reason) as updateLeaveDetails above, so the "create"
// flow on the calendar mirrors the "edit" flow exactly, just via
// Leave.create instead of a patch.
export const createLeaveForEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      leaveType,
      leaveMode,
      reason,
      status,
      dates,
      emergencyContact,
      appliedDate,
    } = req.body;

    if (
      !employeeId ||
      !leaveType ||
      !leaveMode ||
      !reason ||
      !dates ||
      dates.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "employeeId, leaveType, leaveMode, reason and dates are required",
      });
    }

    // Same Admin-only guard — a pure HR user can't create/backfill a leave
    // entry on behalf of another HR colleague (or themselves); that's an
    // Admin action only.
    if (!isTrueAdmin(req)) {
      const targetEmployee = await OldEmployee.findById(employeeId).select("roles");
      if (targetEmployee?.roles?.includes("hr")) {
        return res.status(403).json({
          success: false,
          message: "Only Admin can create a leave entry for an HR user.",
        });
      }
    }

    if (!EDITABLE_LEAVE_TYPES.includes(leaveType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid leave type" });
    }

    if (!EDITABLE_LEAVE_MODES.includes(leaveMode)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid leave mode" });
    }

    const finalStatus = EDITABLE_LEAVE_STATUSES.includes(status)
      ? status
      : "PENDING_HR";

    // Safe UTC conversion — mirrors createLeave in the employee controller
    const formattedDates = dates.map((d) => {
      const cleanDate = d.includes("T") ? d.split("T")[0] : d;
      const [year, month, day] = cleanDate.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    });

    // The employee's own leave table renders `emergencyContact` verbatim
    // (see client Employee-Component/LeaveTable.jsx), so a literal string
    // like "Added by HR" would immediately give away to the employee that
    // this leave was created on their behalf. If HR typed a contact into
    // the calendar popup, use that verbatim (same as what an employee
    // would have typed themselves). Otherwise fall back to pulling their
    // real emergency contact from their profile, and only fall back
    // further to a neutral placeholder if their profile doesn't have one
    // on file either.
    let resolvedEmergencyContact = emergencyContact;
    if (!resolvedEmergencyContact) {
      const employeeProfile = await OldEmployee.findById(employeeId).select(
        "contact.emergencyContact",
      );
      const profileContact = employeeProfile?.contact?.emergencyContact;
      resolvedEmergencyContact =
        profileContact && (profileContact.name || profileContact.phone)
          ? [profileContact.name, profileContact.relation, profileContact.phone]
              .filter(Boolean)
              .join(" - ")
          : "N/A";
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      leaveMode,
      reason,
      emergencyContact: resolvedEmergencyContact,
      dates: formattedDates,
      status: finalStatus,
      ...(finalStatus === "APPROVED" || finalStatus === "REJECTED"
        ? { approvedBy: req.user?.id, approvedAt: new Date() }
        : {}),
    });

    // HR can backdate the "Applied" date (createdAt) shown in the
    // employee's leave table right from the same popup. Leave.create()
    // above already persisted the doc with the real creation timestamp,
    // so this doc is no longer "new" — re-saving with createdAt reset
    // sticks instead of being overwritten by the timestamps plugin.
    if (appliedDate) {
      const cleanDate = appliedDate.includes("T")
        ? appliedDate.split("T")[0]
        : appliedDate;
      const [y, m, d] = cleanDate.split("-").map(Number);
      leave.createdAt = new Date(Date.UTC(y, m - 1, d));
      await leave.save();
    }

    await createAuditLog({
      user: req.user,
      action: "CREATE",
      module: "LEAVE",
      recordId: leave._id,
      newData: { leaveType, leaveMode, status: finalStatus, reason },
      req,
    });

    // No employee notification here — same as updateLeaveDetails above,
    // HR adding a leave directly from the attendance calendar is an
    // internal record adjustment, not a leave decision the employee
    // applied for and is waiting to hear back on.

    res.status(201).json({
      success: true,
      message: "Leave created successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// DELETE LEAVE (HR)
// DELETE /admin/leaves/:leaveId
// The "No record" equivalent for leaves — used by the attendance
// calendar popup's "Remove Leave" action so HR can undo a leave entry
// entirely (wrong date, added by mistake, etc.) instead of only being
// able to flip its status to CANCELLED via updateLeaveDetails above.
export const deleteLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    // Same Admin-only guard — a pure HR user can't delete another HR
    // colleague's (or their own) leave entry.
    if (!isTrueAdmin(req)) {
      const targetEmployee = await OldEmployee.findById(leave.employeeId).select("roles");
      if (targetEmployee?.roles?.includes("hr")) {
        return res.status(403).json({
          success: false,
          message: "Only Admin can remove an HR user's leave request.",
        });
      }
    }

    await leave.deleteOne();

    await createAuditLog({
      user: req.user,
      action: "DELETE",
      module: "LEAVE",
      recordId: leaveId,
      req,
    });

    // No employee notification — same reasoning as the calendar
    // edit/create flows above, this is an HR-internal correction.

    res.json({
      success: true,
      message: "Leave removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};