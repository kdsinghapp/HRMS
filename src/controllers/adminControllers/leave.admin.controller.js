import Leave from "../../models/Leave.js";
import { createAuditLog } from "../../services/audit.service.js";


// ================= GET ALL LEAVES =================

export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
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
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= FILTER LEAVES =================
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================= UPDATE LEAVE STATUS =================
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

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Already processed",
      });
    }

    leave.status = status;
    leave.approvedBy = approverId;
    leave.approvedAt = new Date();

    if (status === "REJECTED") {
      leave.rejectionReason = rejectionReason || "";
    }

    await leave.save();

    // ========= Audit log ================= //
    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "LEAVE",
      recordId: leave._id,
      newData: { status: leave.status, approvedBy: leave.approvedBy, rejectionReason: leave.rejectionReason },
      req,
    });

    res.json({
      success: true,
      message: `Leave ${status.toLowerCase()}`,
      data: leave,
    });
  }catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};