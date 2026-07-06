import Attendance from "../models/Attendance.js";

export const autoCheckoutToday = async () => {
  console.log("Running auto checkout...");

  const now = new Date();

  // ✅ UTC start of day
  const startOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );

  // ✅ UTC end of day
  const endOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 59, 59, 999
    )
  );

  console.log("UTC Start:", startOfDay);
  console.log("UTC End:", endOfDay);

  const attendances = await Attendance.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    checkIn: { $ne: null },
    checkOut: null,
  });

  console.log("attendances found:", attendances.length);

  for (const att of attendances) {
    const nowTime = new Date();

    att.checkOut = nowTime;

    const hours =
      (att.checkOut - att.checkIn) / (1000 * 60 * 60);

    att.totalHours = Number(hours.toFixed(2));

    if (att.totalHours < 4) att.status = "half-day";

    await att.save();
  }

  console.log("✅ Auto checkout done");
};