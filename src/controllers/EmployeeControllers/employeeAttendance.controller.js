import Attendance from "../../models/Attendance.js";
import OldEmployee from "../../models/oldEmployee.model.js";
// import Employee from "../../models/employee.model.js";
import { isOfficeIP } from "../../utils/ip.utils.js";
import mongoose from "mongoose";
/* ================= CHECK-IN ================= */
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // ✅ server time
    const checkIn = new Date();

    // ✅ normalize date (UTC day)
    const date = new Date(Date.UTC(
      checkIn.getUTCFullYear(),
      checkIn.getUTCMonth(),
      checkIn.getUTCDate()
    ));

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date,
    });

    // ❌ already checked-in
    if (attendance?.checkIn) {
      return res.status(400).json({
        message: "Already checked in today",
      });
    }

    // ✅ create if not exists
    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date,
      });
    }

    // ✅ set check-in
    attendance.checkIn = checkIn;
    attendance.status = "present";
    attendance.source = "web";

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Check-in successful",
      data: attendance,
    });

  } catch (error) {
    console.error("CHECK-IN ERROR 👉", error);

    res.status(500).json({
      message: "Check-in failed",
      error: error.message,
    });
  }
};

/* ================= CHECK-OUT ================= */
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // ✅ server time (IST / system time)
    const checkOut = new Date();

    // Find an active check-in record for this employee within the last 18 hours (prevents UTC day rollover bugs)
    const threshold = new Date(Date.now() - 18 * 60 * 60 * 1000);
    const attendance = await Attendance.findOne({
      employee: employeeId,
      checkIn: { $gte: threshold },
      checkOut: null,
    });

    if (!attendance) {
      return res.status(400).json({
        message: "You have not checked in today",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: "Already checked out today",
      });
    }

    // ✅ set checkout time
    attendance.checkOut = checkOut;

    // ✅ calculate hours
    const hours =
      (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);

    attendance.totalHours = Number(hours.toFixed(2));

    // ✅ status logic
    if (hours >= 8) attendance.status = "present";
    else if (hours >= 4) attendance.status = "half-day";
    else attendance.status = "absent";

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Check-out successful",
      data: attendance,
    });

  } catch (error) {
    console.error("CHECK-OUT ERROR 👉", error);
    res.status(500).json({ message: "Check-out failed" });
  }
};

/* ================= get My Attendance ================= */

export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;

    let { year, month } = req.query;

    const today = new Date();

    year = year ? Number(year) : today.getUTCFullYear();
    month = month ? Number(month) : today.getUTCMonth() + 1;

    // ✅ UTC range (IMPORTANT)
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const attendanceList = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1 });

    const totalWorkingHours = attendanceList.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0
    );

    res.status(200).json({
      success: true,
      totalDays: attendanceList.length,
      totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
      data: attendanceList,
    });

  } catch (error) {
    console.error("EMPLOYEE ATTENDANCE ERROR 👉", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

export const getEmployeesWithTodayAttendance = async (req, res) => {
 try {
  
 } catch (error) {
  
 }
};
/* ================= get Employees With Today Attendance ================= */

export const getEmployeesAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // ✅ normalize date (UTC)
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    // 👉 range (important for safety)
    const nextDate = new Date(targetDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    // ✅ fetch data
    const [employees, attendance] = await Promise.all([
      OldEmployee.find(),
      Attendance.find({
        date: {
          $gte: targetDate,
          $lt: nextDate,
        },
      }),
    ]);

    // ✅ map for O(1) lookup
    const attendanceMap = {};
    attendance.forEach((att) => {
      attendanceMap[att.employee.toString()] = att;
    });

    // ✅ final result
    const result = employees.map((emp) => {
      const att = attendanceMap[emp._id.toString()];

      return {
        _id: emp._id,
        name: emp.personal?.fullName || emp.name || "",
        employeeId: emp.professional?.employeeId || emp.employeeCode || emp.employeeId || "",

        status: att ? att.status : "absent",
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        totalHours: att?.totalHours || 0,
      };
    });

    res.json({
      date: targetDate,
      totalEmployees: employees.length,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= get Employee Attendance ================= */
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const attendance = await Attendance.find({
      employee: employeeId,
    }).sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const now = new Date();

    const startOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );

    const endOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23, 59, 59, 999
      )
    );

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!attendance) {
      return res.json({
        status: "not_checked_in",
      });
    }

    let workingHours = 0;

    if (attendance.checkIn) {
      const endTime = attendance.checkOut
        ? attendance.checkOut
        : new Date();

      workingHours =
        (endTime - attendance.checkIn) / (1000 * 60 * 60);
    }

    return res.json({
      status: attendance.checkOut
        ? "completed"
        : "in_progress",

      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      workingHours: Number(workingHours.toFixed(2)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching attendance" });
  }
};


export const getMonthlyAttendanceSummary = async (req, res) => {
  // console.log("getMonthlyAttendanceSummary running");
  try {
    const { employeeId, month, year } = req.query;
console.log("getMonthlyAttendanceSummary running");
    // Normalize search bounds to UTC midnight to match DB storage timezone
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const attendance = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    const totalDays = new Date(year, month, 0).getDate();

    let present = 0;
    let absent = 0;
    let leave = 0;
    let halfDay = 0;
    let totalWorkingHours = 0;

  
attendance.forEach((record) => {
  if (record.status === "present") present++;
  if (record.status === "absent") absent++;
  if (record.status === "leave") leave++;
  if (record.status === "half-day") halfDay++;

  totalWorkingHours += Number(record.totalHours || 0);
});

const hours = Math.floor(totalWorkingHours);
const minutes = Math.round((totalWorkingHours - hours) * 60);

const formattedWorkingTime = `${hours}:${minutes}h`;

    // Saturday/Sunday weekoffs
    let weekOffs = 2;

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);

      if (date.getDay() === 0) {
        weekOffs++;
      }
    }

    const workingDays = totalDays - weekOffs;

    const attendancePercentage =
      workingDays > 0
        ? Number(((present / workingDays) * 100).toFixed(2))
        : 0;

   return res.json({
  month,
  year,
  totalDays,
  workingDays,
  weekOffs,
  present,
  absent,
  leave,
  halfDay,

  totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
  formattedWorkingTime,

  attendancePercentage,
});
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch attendance summary",
    });
  }
};
