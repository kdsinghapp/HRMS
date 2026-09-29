import { isSunday } from "../utils/officeSchedule.js";

// Sunday is the only week-off. Saturday is always a working day.
export const isOfficeWeekOff = (date = new Date()) => isSunday(date);
