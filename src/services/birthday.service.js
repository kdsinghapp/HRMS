import OldEmployee from "../models/oldEmployee.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { birthdayEmailTemplate } from "../utils/emailTemplates/birthdayEmail.js";
import { notifyRoles, notifyUser } from "./notification.service.js";

export const sendBirthdayWishes = async () => {
  try {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth() + 1;


    const employees = await OldEmployee.find({
      "professional.status": "Active",
      "personal.dob": { $ne: null },
    }).select(
      "personal.fullName personal.dob account.officialEmail contact.personalEmail"
    );

    const birthdayEmployees = employees.filter((emp) => {
      const dob = emp.personal?.dob;
      if (!dob) return false;
      const dobDate = new Date(dob);
      return (
        dobDate.getDate() === todayDate &&
        dobDate.getMonth() + 1 === todayMonth
      );
    });


    for (const emp of birthdayEmployees) {
      const name = emp.personal?.fullName || "there";
      const toEmail =
        emp.account?.officialEmail || emp.contact?.personalEmail;

      // 1. Personalized birthday email from the company
      if (toEmail) {
        try {
          await sendEmail({
            to: toEmail,
            subject: `🎉 Happy Birthday, ${name}!`,
            html: birthdayEmailTemplate(name),
          });
        } catch (emailError) {
        }
      } else {
      }

      // 2. Personal wish + popup — ONLY for the birthday person
      // This is what triggers the celebratory popup on their dashboard.
      // Everyone else only gets the plain bell notification below.
      await notifyUser({
        recipientId: emp._id,
        title: "🎂 Happy Birthday!",
        message: `Happy Birthday, ${name}! Wishing you a fantastic day ahead, filled with joy, success, and wonderful memories. 🎉`,
        type: "BIRTHDAY",
      });

      // 3. Company-wide bell notification (no popup)
      // Everyone (including HR/Admin) is told it's this employee's birthday,
      // but the birthday person themselves is excluded here since they
      // already received their own personalized wish above.
      await notifyRoles({
        roles: ["employee", "hr", "admin"],
        title: "🎂 Birthday Celebration",
        message: `Today is ${name}'s birthday! Join us in wishing them a wonderful day. 🎉`,
        type: "BIRTHDAY",
        excludeIds: [emp._id],
      });
    }

    return birthdayEmployees.length;
  } catch (error) {
    return 0;
  }
};
