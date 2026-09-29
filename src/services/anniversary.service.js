import OldEmployee from "../models/oldEmployee.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { anniversaryEmailTemplate } from "../utils/emailTemplates/anniversaryEmail.js";
import { notifyUser } from "./notification.service.js";

// Unlike birthdays, work anniversaries are a strictly personal moment —
// only the employee who completed a full year gets the email + popup.
// Nobody else in the company is notified.
export const sendAnniversaryWishes = async () => {
  try {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth() + 1;
    const todayYear = today.getFullYear();

    const employees = await OldEmployee.find({
      "professional.status": "Active",
      "professional.dateOfJoining": { $ne: null },
    }).select(
      "personal.fullName professional.dateOfJoining account.officialEmail contact.personalEmail"
    );

    const anniversaryEmployees = employees
      .map((emp) => {
        const doj = emp.professional?.dateOfJoining;
        if (!doj) return null;
        const dojDate = new Date(doj);
        const sameDay =
          dojDate.getDate() === todayDate &&
          dojDate.getMonth() + 1 === todayMonth;
        if (!sameDay) return null;

        const years = todayYear - dojDate.getFullYear();
        // Only fire once at least one full year is complete — not on the
        // joining day itself the same year.
        if (years < 1) return null;

        return { emp, years };
      })
      .filter(Boolean);


    for (const { emp, years } of anniversaryEmployees) {
      const name = emp.personal?.fullName || "there";
      const toEmail =
        emp.account?.officialEmail || emp.contact?.personalEmail;

      // 1. Personalized anniversary email from the company
      if (toEmail) {
        try {
          await sendEmail({
            to: toEmail,
            subject: `🏆 Happy Work Anniversary, ${name}!`,
            html: anniversaryEmailTemplate(name, years),
          });
        } catch (emailError) {
        }
      } else {
      }

      // 2. Personal dashboard popup — this employee only
      const yearLabel = `${years} ${years === 1 ? "year" : "years"}`;
      await notifyUser({
        recipientId: emp._id,
        title: "🏆 Happy Work Anniversary!",
        message: `Congratulations, ${name}! You've completed ${yearLabel} with us today. Thank you for your dedication and everything you bring to the team. 🎉`,
        type: "ANNIVERSARY",
      });
    }

    return anniversaryEmployees.length;
  } catch (error) {
    return 0;
  }
};
