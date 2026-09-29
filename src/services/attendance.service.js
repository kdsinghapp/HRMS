import Attendance from "../models/attendance.model.js";

export const autoCheckoutToday = async () => {
  const now = new Date();

  // 🔒 Catch every still-open check-in, not just today's. The old query
  // only looked at "today" (by UTC date), so any day the cron didn't run
  // right at 23:30 — server restart/deploy, brief downtime, etc. — that
  // day's open check-ins were skipped and never came back, since the next
  // day's run only looks at the *next* day's window. Left unpaired,
  // checkOut/totalHours forever, though its earlier-set status still read
  // "present". Querying for ANY open record fixes that: nothing can be
  // missed permanently, no matter how many cron runs got skipped.
  const attendances = await Attendance.find({
    checkIn: { $ne: null },
    checkOut: null,
  });

  for (const att of attendances) {
    // Close each record out at the end of ITS OWN day, not "now" — for a
    // stale record from several days ago, using "now" would produce an
    // absurd totalHours (e.g. 72+ hours) and wrongly mark it "present".
    const recordDate = new Date(att.date);
    const dayEnd = new Date(
      Date.UTC(
        recordDate.getUTCFullYear(),
        recordDate.getUTCMonth(),
        recordDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    // Never assign a checkout time in the future relative to "now" (only
    // matters for today's own records, closed out at their normal 23:30
    // run).
    att.checkOut = dayEnd < now ? dayEnd : now;

    const hours = Math.max(
      (att.checkOut - att.checkIn) / (1000 * 60 * 60),
      0,
    );

    att.totalHours = Number(hours.toFixed(2));

    if (att.totalHours >= 8) att.status = "present";
    else if (att.totalHours >= 4) att.status = "half-day";
    else att.status = "absent";

    await att.save();
  }
};
