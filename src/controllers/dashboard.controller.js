import Employee from "../models/employee.model.js";
import Attendance from "../models/attendance.model.js";
import Leave from "../../models/Leave.js";

/**
 * GET /admin/dashboard
 */
export const adminDashboard = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: "approved" });
    const pendingApprovals = await Employee.countDocuments({ status: "pending" });

    const today = new Date().toISOString().split("T")[0];

    const todayPresent = await Attendance.countDocuments({ date: today });
    const onLeave = await Leave.countDocuments({ status: "approved" });

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        pendingApprovals,
        todayPresent,
        onLeave,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /employee/dashboard
 */
export const employeeDashboard = async (req, res) => {
  try {
    const attendanceCount = await Attendance.countDocuments({
      employee: req.user._id,
    });

    const leaveCount = await Leave.countDocuments({
      employee: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: {
        attendanceCount,
        leaveCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
