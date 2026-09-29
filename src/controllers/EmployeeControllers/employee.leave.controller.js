import Leave from "../../models/leave.model.js";
import { notifyHrAndAdmin, notifyRoles } from "../../services/notification.service.js";

// CREATE LEAVE
export const createLeave = async (req, res) => {
  try {
    const { leaveType, leaveMode, reason, emergencyContact, dates } = req.body;

    const employeeId = req.user.id;

    if (
      !leaveType ||
      !leaveMode ||
      !reason ||
      !emergencyContact ||
      !dates ||
      dates.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ Safe UTC conversion
    const formattedDates = dates.map((d) => {
      const cleanDate = d.includes("T") ? d.split("T")[0] : d;
      const [year, month, day] = cleanDate.split("-").map(Number);

      return new Date(Date.UTC(year, month - 1, day));
    });

    const leave = await Leave.create({
      employeeId,
      leaveType,
      leaveMode,
      reason,
      emergencyContact,
      dates: formattedDates,
    });

    // Notify HR / Admin — except when the applicant is themselves an HR
    // user, in which case their leave request is Admin's call only and
    // shouldn't go to (or be actionable by) their fellow HR colleagues.
    const applicantRoles = req.user.roles || [];
    const applicantIsHr =
      applicantRoles.includes("hr") && !applicantRoles.includes("admin");

    if (applicantIsHr) {
      await notifyRoles({
        roles: ["admin"],
        title: "New Leave Request",
        message: `${req.user.name || "An HR member"} applied for ${leaveType}`,
        type: "LEAVE",
        link: "/hr/leave",
        createdBy: employeeId,
      });
    } else {
      await notifyHrAndAdmin({
        title: "New Leave Request",
        message: `${req.user.name || "An employee"} applied for ${leaveType}`,
        type: "LEAVE",
        link: "/hr/leave",
        createdBy: employeeId,
      });
    }

    res.status(201).json({
      success: true,
      message: "Leave request submitted",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET MY LEAVES
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      employeeId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// CANCEL LEAVE
export const cancelLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status !== "PENDING" && leave.status !== "PENDING_HR" && leave.status !== "PENDING_ADMIN") {
      return res.status(400).json({
        success: false,
        message: "Only pending leave can be cancelled",
      });
    }

    leave.status = "CANCELLED";
    await leave.save();

    res.json({
      success: true,
      message: "Leave cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
