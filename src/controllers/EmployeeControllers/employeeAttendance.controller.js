import Attendance from "../../models/attendance.model.js";
import OldEmployee from "../../models/oldEmployee.model.js";
import { isOfficeIP } from "../../utils/ip.utils.js";
import mongoose from "mongoose";
import Leave from "../../models/leave.model.js";
import { isOfficeWeekOff } from "../../services/weekOff.service.js";

// LEAVE GUARD HELPER
// Returns the employee's PENDING or APPROVED leave record that covers
// `forDate` (UTC-midnight normalized), or null if they're not on leave
// that day. Used to block check-in / check-out and to show the employee
// why. Blocking starts as soon as a leave is applied (PENDING) and stays
// blocked once APPROVED. A REJECTED/CANCELLED leave no longer matches,
// so check-in/check-out automatically re-enables.
const getApprovedLeaveForDate = async (employeeId, forDate) => {
  const dayStart = new Date(
    Date.UTC(
      forDate.getUTCFullYear(),
      forDate.getUTCMonth(),
      forDate.getUTCDate(),
    ),
  );

  return Leave.findOne({
    employeeId,
    status: { $in: ["PENDING", "APPROVED"] },
    dates: dayStart,
  });
};

// Human-readable list of leave dates for the "on leave" message
const formatLeaveDates = (dates = []) => {
  return dates
    .map((d) =>
      new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    )
    .join(", ");
};

// CHECK-IN
export const checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // ✅ server time
    const checkIn = new Date();

    // ✅ normalize date (UTC day)
    const date = new Date(
      Date.UTC(
        checkIn.getUTCFullYear(),
        checkIn.getUTCMonth(),
        checkIn.getUTCDate(),
      ),
    );

    // 🔒 WEEK-OFF GUARD: Sunday is the only week-off.
    if (await isOfficeWeekOff(checkIn)) {
      return res.status(403).json({
        message: "Today is a week off",
        weekOff: true,
      });
    }

    // ℹ️ Office hours (10:00 AM – 8:00 PM) are shown to employees for
    // reference only. Employees can check in at any time of day; only the
    // week-off and leave guards below can still block it. Present /
    // half-day / absent status is decided purely from total hours worked
    // at checkout time (see checkOut below).

    // 🔒 LEAVE GUARD: can't check in while a leave is pending or approved
    const approvedLeave = await getApprovedLeaveForDate(employeeId, date);
    if (approvedLeave) {
      const statusLabel =
        approvedLeave.status === "PENDING"
          ? "requested (pending approval)"
          : "approved";
      return res.status(403).json({
        message: `You have ${statusLabel} ${approvedLeave.leaveType} (${formatLeaveDates(
          approvedLeave.dates,
        )}). Check-in is disabled for these dates.`,
        onLeave: true,
        leave: approvedLeave,
      });
    }

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

    res.status(500).json({
      message: "Check-in failed",
      error: error.message,
    });
  }
};

// CHECK-OUT
export const checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // ✅ server time (IST / system time)
    const checkOut = new Date();

    // ✅ normalize date (UTC day)
    const today = new Date(
      Date.UTC(
        checkOut.getUTCFullYear(),
        checkOut.getUTCMonth(),
        checkOut.getUTCDate(),
      ),
    );

    // Find an active check-in record for this employee within the last 18 hours (prevents UTC day rollover bugs)
    const threshold = new Date(Date.now() - 18 * 60 * 60 * 1000);
    const attendance = await Attendance.findOne({
      employee: employeeId,
      checkIn: { $gte: threshold },
      checkOut: null,
    });

    // 🔒 LEAVE GUARD: blocks check-out only when there's no active check-in
    // already running. Once the employee has actually checked in, a leave
    // applied afterwards (only Half Day is allowed post check-in — see the
    // guard in createLeave) must NOT stop them from checking out; their
    // timer either runs until they check out manually, gets rejected (no
    // change), or gets auto-closed at the half-day limit once approved.
    if (!attendance) {
      const approvedLeave = await getApprovedLeaveForDate(employeeId, today);
      if (approvedLeave) {
        const statusLabel =
          approvedLeave.status === "PENDING"
            ? "requested (pending approval)"
            : "approved";
        return res.status(403).json({
          message: `You have ${statusLabel} ${approvedLeave.leaveType} (${formatLeaveDates(
            approvedLeave.dates,
          )}). Check-out is disabled for these dates.`,
          onLeave: true,
          leave: approvedLeave,
        });
      }

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
    const hours = (attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60);

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
    res.status(500).json({ message: "Check-out failed" });
  }
};

// get My Attendance

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

    // remarks / approvedBy are HR-internal (left when HR manually
    // corrects a day's attendance) and must never reach the employee —
    // not even via the raw API response — so they're excluded here
    // rather than just hidden in the UI.
    const attendanceList = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .select("-remarks -approvedBy")
      .sort({ date: -1 });

    const totalWorkingHours = attendanceList.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0,
    );

    res.status(200).json({
      success: true,
      totalDays: attendanceList.length,
      totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
      data: attendanceList,
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

// get Employees With Today Attendance
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

    // ✅ fetch data — attendance for the day, plus any leave (pending or
    // approved) that covers this date, so employees on leave show up as
    // "on leave" instead of just "absent" on the HR dashboard.
    const [employees, attendance, leaves] = await Promise.all([
      OldEmployee.find(),
      Attendance.find({
        date: {
          $gte: targetDate,
          $lt: nextDate,
        },
      }),
      Leave.find({
        status: { $in: ["PENDING", "APPROVED"] },
        dates: targetDate,
      }),
    ]);

    // ✅ map for O(1) lookup
    const attendanceMap = {};
    attendance.forEach((att) => {
      attendanceMap[att.employee.toString()] = att;
    });

    const leaveMap = {};
    leaves.forEach((lv) => {
      leaveMap[lv.employeeId.toString()] = lv;
    });

    // ✅ final result
    const result = employees.map((emp) => {
      const att = attendanceMap[emp._id.toString()];
      const leave = leaveMap[emp._id.toString()];

      return {
        _id: emp._id,
        name: emp.personal?.fullName || emp.name || "",
        employeeId:
          emp.professional?.employeeId ||
          emp.employeeCode ||
          emp.employeeId ||
          "",

        // On-leave takes priority over a bare "absent" default so HR can
        // tell "not marked" apart from "known to be on leave today".
        status: leave ? "leave" : att ? att.status : "absent",
        checkIn: att?.checkIn || null,
        checkOut: att?.checkOut || null,
        totalHours: att?.totalHours || 0,
        leaveType: leave?.leaveType || null,
        leaveMode: leave?.leaveMode || null,
        leaveStatus: leave?.status || null,
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

// get Employee Attendance
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
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const endOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // 🔒 Week-off / Pending / Approved-leave states take priority ONLY when
    // the employee hasn't already checked in today. If they've already
    // checked in (e.g. before applying leave), we want the real
    // in_progress/completed status below instead, so their running timer
    // keeps showing correctly.
    if (!attendance?.checkIn) {
      if (await isOfficeWeekOff(now)) {
        return res.json({
          status: "week_off",
          message: "Today is a week off",
        });
      }

      const approvedLeave = await getApprovedLeaveForDate(
        employeeId,
        startOfDay,
      );
      if (approvedLeave) {
        return res.json({
          status: "on_leave",
          leave: {
            leaveType: approvedLeave.leaveType,
            reason: approvedLeave.reason,
            dates: approvedLeave.dates,
            formattedDates: formatLeaveDates(approvedLeave.dates),
            status: approvedLeave.status,
          },
        });
      }
    }

    if (!attendance) {
      return res.json({
        status: "not_checked_in",
      });
    }

    let workingHours = 0;

    if (attendance.checkIn) {
      const endTime = attendance.checkOut ? attendance.checkOut : new Date();

      workingHours = (endTime - attendance.checkIn) / (1000 * 60 * 60);
    }

    return res.json({
      status: attendance.checkOut ? "completed" : "in_progress",

      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      workingHours: Number(workingHours.toFixed(2)),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance" });
  }
};

export const getMonthlyAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
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

    // Track which dates already have an explicit Attendance record so we
    // don't double-count a day that has both an Attendance row (status
    // "leave") and an approved/pending Leave request covering it.
    const attendanceDateSet = new Set();

    attendance.forEach((record) => {
      attendanceDateSet.add(new Date(record.date).toISOString().slice(0, 10));

      if (record.status === "present") present++;
      if (record.status === "absent") absent++;
      if (record.status === "leave") leave++;
      if (record.status === "half-day") halfDay++;

      totalWorkingHours += Number(record.totalHours || 0);
    });

    // 🔥 Leave requests (from the Leave collection) — approved/pending
    // leave days for this employee/month that don't already have their
    // own Attendance record. Without this, leave applied via the Leave
    // flow never showed up in the HR monthly summary card.
    const leaveDocs = await Leave.find({
      employeeId,
      status: { $in: ["PENDING", "APPROVED"] },
      dates: { $elemMatch: { $gte: startDate, $lt: endDate } },
    });

    const leaveDateSet = new Set();
    leaveDocs.forEach((doc) => {
      (doc.dates || []).forEach((dt) => {
        const d = new Date(dt);
        if (d >= startDate && d < endDate) {
          const iso = d.toISOString().slice(0, 10);
          if (!attendanceDateSet.has(iso)) leaveDateSet.add(iso);
        }
      });
    });

    leave += leaveDateSet.size;

    const hours = Math.floor(totalWorkingHours);
    const minutes = Math.round((totalWorkingHours - hours) * 60);

    const formattedWorkingTime = `${hours}:${minutes}h`;

    // Sunday week-offs
    let weekOffs = 2;

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);

      if (date.getDay() === 0) {
        weekOffs++;
      }
    }

    const workingDays = totalDays - weekOffs;

    const attendancePercentage =
      workingDays > 0 ? Number(((present / workingDays) * 100).toFixed(2)) : 0;

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
    res.status(500).json({
      message: "Failed to fetch attendance summary",
    });
  }
};
