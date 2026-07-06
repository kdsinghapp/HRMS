
import Attendance from "../../models/Attendance.js";

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
console.log("employee",attendance)
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
console.log("req.query",req.query)
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
