export const resetPasswordEmailTemplate = (resetLink) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Reset Password</title>
  </head>

  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">

          <!-- Main Container -->
          <table width="600" cellpadding="0" cellspacing="0"
            style="background:#ffffff; margin:40px 0; border-radius:8px; overflow:hidden;">
            
            <!-- Header Image -->
            <tr>
              <td>
                <img
                  src="https://yourdomain.com/images/reset-password-banner.png"
                  alt="Reset Password"
                  width="600"
                  style="display:block;"
                />
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:30px; text-align:center;">
                <h2 style="color:#333;">Reset Your Password</h2>

                <p style="color:#555; font-size:16px; line-height:1.5;">
                  We received a request to reset your password.
                  Click the button below to set a new password.
                </p>

                <a
                  href="${resetLink}"
                  style="
                    display:inline-block;
                    margin:20px 0;
                    padding:14px 28px;
                    background:#4f46e5;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;
                    font-size:16px;
                    font-weight:bold;
                  "
                >
                  Reset Password
                </a>

                <p style="color:#888; font-size:14px;">
                  This link will expire in <b>15 minutes</b>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="background:#f4f6f8; padding:15px; text-align:center;
                font-size:12px; color:#999;">
                © ${new Date().getFullYear()} HRMS System. All rights reserved.
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
