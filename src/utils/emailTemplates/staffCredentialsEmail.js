export const staffCredentialsEmailTemplate = ({
  fullName,
  email,
  password,
  roles,
  loginUrl,
}) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Your HRMS Account</title>
  </head>

  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">

          <table width="600" cellpadding="0" cellspacing="0"
            style="background:#ffffff; margin:40px 0; border-radius:8px; overflow:hidden;">

            <tr>
              <td style="padding:30px; text-align:center;">
                <h2 style="color:#333;">Welcome, ${fullName}</h2>

                <p style="color:#555; font-size:16px; line-height:1.5;">
                  An administrator has created an account for you on the HRMS
                  with the following access: <b>${roles.join(", ")}</b>.
                </p>

                <table style="margin:20px auto; text-align:left; font-size:15px; color:#333;">
                  <tr>
                    <td style="padding:6px 12px;"><b>Login Email</b></td>
                    <td style="padding:6px 12px;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 12px;"><b>Temporary Password</b></td>
                    <td style="padding:6px 12px;">${password}</td>
                  </tr>
                </table>

                <a
                  href="${loginUrl}"
                  style="
                    display:inline-block;
                    margin:20px 0;
                    padding:14px 28px;
                    background:#0284c7;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:6px;
                    font-size:16px;
                    font-weight:bold;
                  "
                >
                  Log In Now
                </a>

                <p style="color:#888; font-size:14px;">
                  For security, please change your password immediately after logging in.
                </p>
              </td>
            </tr>

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
