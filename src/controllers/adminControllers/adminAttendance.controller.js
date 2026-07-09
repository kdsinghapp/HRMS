import Attendance from "../../models/Attendance.js";
import { createAuditLog } from "../../services/audit.service.js";

export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // Parse date as UTC midnight (matching stored Attendance records)
    const cleanDate = date.includes("T") ? date.split("T")[0] : date;
    const [yearVal, monthVal, dayVal] = cleanDate.split("-").map(Number);
    const selectedDate = new Date(Date.UTC(yearVal, monthVal - 1, dayVal));

    const attendanceList = await Attendance.find({
      date: selectedDate,
    })
      .populate("employee", "name email employeeCode")
      .sort({ checkIn: 1 });

    res.status(200).json({
      date: selectedDate,
      totalEmployees: attendanceList.length,
      data: attendanceList,
    });
  } catch (error) {
    console.error("ADMIN ATTENDANCE ERROR 👉", error);
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};

/**
 * GET /admin/attendance/employee/:employeeId
 */
export const getAttendanceByEmployee = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      employee: req.params.employeeId,
    }).sort({ date: -1 });
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /admin/attendance/monthly
 */
export const getMonthlyAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    // Normalize monthly search bounds to UTC midnight
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const attendance = await Attendance.find({
      date: { $gte: start, $lte: end },
    });

    res.status(200).json({
      success: true,
      month,
      year,
      totalRecords: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /admin/attendance/stats
 */
export const getAttendanceStats = async (req, res) => {
  try {
    const stats = await Attendance.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    let response = { present: 0, halfDay: 0, absent: 0 };
    stats.forEach((item) => {
      response[item._id] = item.count;
    });

    res.status(200).json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAttendanceByEmpId = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: req.body.date, // ya today's date
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    const oldData = attendance.toObject();

    const { status } = req.body;

    let checkIn = null;
    let checkOut = null;
    let workingHours = 0;

    // Today's date
    const today = new Date();

    switch (status) {
      case "present":
        checkIn = new Date(today);
        checkIn.setHours(10, 0, 0, 0);

        checkOut = new Date(today);
        checkOut.setHours(20, 0, 0, 0);

        workingHours = 10;
        break;

      case "half-day":
        checkIn = new Date(today);
        checkIn.setHours(10, 0, 0, 0);

        checkOut = new Date(today);
        checkOut.setHours(15, 0, 0, 0);

        workingHours = 5;
        break;

      case "absent":
      case "leave":
      case "paid-leave":
      case "unpaid-leave":
        checkIn = null;
        checkOut = null;
        workingHours = 0;
        break;
    }

    attendance.status = status;
    attendance.checkIn = checkIn;
    attendance.checkOut = checkOut;
    attendance.workingHours = workingHours;

    await attendance.save();

    // Audit Log
    await createAuditLog({
      user: req.user,
      action: "UPDATE",
      module: "ATTENDANCE",
      recordId: attendance._id,
      oldData,
      newData: attendance.toObject(),
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully.",
      data: attendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
