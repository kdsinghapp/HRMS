
import Attendance from "../../models/attendance.model.js";
import { combineISTDateTime } from "../../utils/officeSchedule.js";

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
    res.status(500).json({ message: "Failed to fetch attendance" });
  }
};


// GET /admin/attendance/employee/:employeeId
// Optional ?year=&month= narrows to that month; used by the HR attendance calendar.
// Without them, returns full history.
export const getAttendanceByEmployee = async (req, res) => {

  try {
    const { year, month } = req.query;

    const filter = { employee: req.params.employeeId };

    if (year && month) {
      const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
      const end = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));
      filter.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(filter).sort({ date: -1 });

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /admin/attendance/employee/:employeeId
// body: { date, status, checkIn, checkOut, remarks }
// HR-only: create or edit one day's attendance record (upsert).
export const updateAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date, status, checkIn, checkOut, remarks } = req.body;

    if (!employeeId) {
      return res
        .status(400)
        .json({ success: false, message: "Employee id is required" });
    }

    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Date is required" });
    }

    const allowedStatuses = [
      "present",
      "absent",
      "half-day",
      "leave",
      "paid-leave",
      "unpaid-leave",
      // Pseudo-status — not actually stored. Picking it just means
      // "this day never had a record", so HR can wipe out a bad entry
      // instead of only being able to reassign it to another status.
      "no-record",
    ];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // Normalize date to UTC midnight — matches how attendance dates are
    // stored everywhere else (see getAttendanceByDate above).
    const cleanDate = date.includes("T") ? date.split("T")[0] : date;
    const [yearVal, monthVal, dayVal] = cleanDate.split("-").map(Number);
    const normalizedDate = new Date(Date.UTC(yearVal, monthVal - 1, dayVal));

    // "No record" — HR wants to clear this day entirely rather than
    // change it to another status. Delete whatever's there (if anything)
    // and stop, instead of falling through to the upsert logic below.
    if (status === "no-record") {
      await Attendance.findOneAndDelete({
        employee: employeeId,
        date: normalizedDate,
      });
      return res.status(200).json({
        success: true,
        message: "Attendance record cleared",
        data: null,
      });
    }

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: normalizedDate,
    });

    if (!attendance) {
      attendance = new Attendance({ employee: employeeId, date: normalizedDate });
    }

    // Check-in / Check-out — HH:mm (IST wall-clock) combined with the
    // record's own date. An explicit empty string clears the time;
    // undefined leaves it as-is.
    if (checkIn) {
      attendance.checkIn = combineISTDateTime(cleanDate, checkIn);
    } else if (checkIn === "") {
      attendance.checkIn = null;
    }

    if (checkOut) {
      attendance.checkOut = combineISTDateTime(cleanDate, checkOut);
    } else if (checkOut === "") {
      attendance.checkOut = null;
    }

    // Recalculate total hours whenever both times end up present.
    if (attendance.checkIn && attendance.checkOut) {
      const hours =
        (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);
      attendance.totalHours = Number(Math.max(hours, 0).toFixed(2));
    } else {
      attendance.totalHours = 0;
    }

    // HR's chosen status is a manual override and always wins here.
    if (status) {
      attendance.status = status;
    }

    if (remarks !== undefined) {
      attendance.remarks = remarks;
    }

    attendance.approvedBy = req.user?.id || attendance.approvedBy;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update attendance",
    });
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
