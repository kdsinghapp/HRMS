// Same format/layout as birthdayEmail.js — only the copy is changed so the
// two automated emails feel like a consistent family from the HRMS.
export const anniversaryEmailTemplate = (name, years) => {
  const yearLabel = `${years} ${years === 1 ? "Year" : "Years"}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Happy Work Anniversary from Technorizen</title>
  </head>

  <body style="margin:0; padding:0; background-color:#f4f6f9; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f6f9;">
      <tr>
        <td align="center" style="padding:40px 16px;">

          <!-- Main Email Container -->
          <table width="600" cellpadding="0" cellspacing="0" role="presentation"
            style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 24px rgba(148,163,184,0.15); border:1px solid #e2e8f0;">

            <!-- Top Brand Bar -->
            <tr>
              <td align="center" style="padding:24px 32px; background:#ffffff; border-bottom:1px solid #f1f5f9;">
                <img src="https://technorizen.com/public/html/web/images/logo.png"
                  width="140" alt="Technorizen Software Solutions Pvt. Ltd." style="display:block; max-width:140px; height:auto; border:0;" />
              </td>
            </tr>

            <!-- Hero Banner Section -->
            <tr>
              <td align="center" style="background:linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%); padding:40px 32px; text-align:center;">
                <!-- Anniversary Icon -->
                <div style="display:inline-block; font-size:42px; margin-bottom:16px; line-height:1;">🏆</div>

                <p style="margin:0 0 8px; color:rgba(255,255,255,0.85); font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">
                  Celebrating A Milestone
                </p>
                <h1 style="margin:0; color:#ffffff; font-size:28px; line-height:1.2; font-weight:700;">
                  Happy Work Anniversary, ${name}!
                </h1>
              </td>
            </tr>

            <!-- Content Body -->
            <tr>
              <td style="padding:40px 40px 24px;">
                <p style="color:#334155; font-size:16px; line-height:1.7; margin:0 0 24px; text-align:center;">
                  Today marks <strong>${yearLabel}</strong> since you joined <strong>Technorizen Software Solutions Pvt. Ltd.</strong>
                  The entire team is delighted to celebrate this milestone with you. Thank you for the dedication and
                  energy you've brought to this journey so far.
                </p>

                <!-- Appreciation Quote Card -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
                  <tr>
                    <td style="background:#f0f9ff; border-left:4px solid #0ea5e9; border-radius:0 8px 8px 0; padding:20px 24px;">
                      <p style="margin:0; color:#1d4ed8; font-size:14.5px; line-height:1.6; font-style:italic;">
                        "Your contribution, consistency, and growth over ${yearLabel.toLowerCase()} have made a real
                        difference to our team. We're grateful to have you with us and excited for what's ahead."
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="color:#475569; font-size:15px; line-height:1.6; margin:0 0 8px; text-align:center;">
                  Here's to many more years of shared success and growth together.
                </p>
              </td>
            </tr>

            <!-- Celebration Text Badge -->
            <tr>
              <td align="center" style="padding:0 40px 32px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="background:#f97316; border-radius:30px; padding:12px 28px;">
                      <span style="color:#ffffff; font-size:14px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase;">
                        Cheers To More Milestones! ✨
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Subtle Divider -->
            <tr>
              <td style="padding:0 40px;">
                <div style="border-top:1px solid #f1f5f9;"></div>
              </td>
            </tr>

            <!-- Corporate Signature -->
            <tr>
              <td style="padding:28px 40px 32px; text-align:center;">
                <p style="color:#64748b; font-size:14px; margin:0; line-height:1.6;">
                  Warmest regards,<br />
                  <span style="color:#1e293b; font-weight:700; font-size:15px;">Team HR & Operations</span><br />
                  <span style="color:#64748b; font-size:13px;">Technorizen Software Solutions Pvt. Ltd.</span>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc; padding:20px 32px; text-align:center; font-size:12px; color:#94a3b8; border-top:1px solid #f1f5f9;">
                &copy; ${new Date().getFullYear()} Technorizen Software Solutions Pvt. Ltd. All rights reserved.<br />
                <span style="display:inline-block; margin-top:4px;">This is an automated work-anniversary greeting from your HRMS Portal.</span>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};
