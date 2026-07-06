export const verifyEmailOtpTemplate = (otp) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
  </head>

  <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">

          <table width="600" cellpadding="0" cellspacing="0"
            style="background:#ffffff; margin:40px 0; border-radius:8px; overflow:hidden;">

            <tr>
              <td style="padding:30px; text-align:center;">
                <h2 style="color:#333;">Verify Your Email</h2>

                <p style="color:#555; font-size:16px;">
                  Use the OTP below to verify your email address.
                </p>

                <div
                  style="
                    margin:20px auto;
                    padding:15px;
                    font-size:28px;
                    letter-spacing:4px;
                    font-weight:bold;
                    background:#f4f6f8;
                    border-radius:6px;
                    width:fit-content;
                  "
                >
                  ${otp}
                </div>

                <p style="color:#888; font-size:14px;">
                  This OTP will expire in <b>10 minutes</b>.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f4f6f8; padding:15px; text-align:center; font-size:12px; color:#999;">
                © ${new Date().getFullYear()} HRMS System
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
