import Attendance from "../../models/Attendance.js";
import Employee from "../../models/employee.model.js";
import Leave from "../../models/Leave.js";

export const getAdminDashboardCharts = async (req, res) => {

  try {
    // Employee status chart
    const employeeStatus = await Employee.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Attendance chart
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Leave chart
    const leaveStats = await Leave.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        employeeStatus,
        attendanceStats,
        leaveStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
