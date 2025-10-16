const nodemailer = require('nodemailer');
require('dotenv').config();
// Log environment variables for debugging (remove in production)
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[REDACTED]' : 'undefined');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});


async function sendWelcomeEmail({ to, fullName, schoolEmail, initialPassword }) {
    const html = `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông tin tài khoản sinh viên</title>
    <style>
      /* Một số client hỗ trợ, nhưng phần lớn style đã inline bên dưới */
      @media (max-width: 600px) {
        .container { width: 100% !important; }
        .content { padding: 20px !important; }
        .h1 { font-size: 20px !important; }
        .btn { display:block !important; width:100% !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f5f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#0f172a;">
    
    <!-- Preheader (ẩn) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Thông tin tài khoản sinh viên của bạn: email trường và mật khẩu ban đầu.
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
      <tr>
        <td align="center" style="padding:24px;">
          <!-- Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 6px 24px rgba(2,6,23,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb); padding:28px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td align="left">
                      <div style="font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#c7d2fe;">University Academic Portal</div>
                      <div class="h1" style="margin-top:6px; font-size:22px; font-weight:700; color:#ffffff;">Thông tin tài khoản sinh viên</div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <!-- Badge -->
                      <span style="display:inline-block; padding:6px 10px; border-radius:999px; background:#dbeafe; color:#1e3a8a; font-size:12px; font-weight:600;">
                        Tạo tài khoản mới
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="content" style="padding:28px 32px;">
                <p style="margin:0 0 12px 0; font-size:15px;">Chào <strong>${fullName}</strong>,</p>
                <p style="margin:0 0 18px 0; font-size:15px; line-height:1.7;">
                  Hệ thống đã cấp cho bạn tài khoản sinh viên. Vui lòng dùng thông tin dưới đây để đăng nhập lần đầu.
                </p>

                <!-- Card thông tin -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" 
                       style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <table role="presentation" width="100%">
                        <tr>
                          <td style="padding:6px 0; font-size:14px; color:#334155; width:160px;">Email trường</td>
                          <td style="padding:6px 0; font-size:14px; color:#0f172a; font-weight:600;">${schoolEmail}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0; font-size:14px; color:#334155;">Mật khẩu ban đầu</td>
                          <td style="padding:6px 0; font-size:14px; color:#0f172a; font-weight:600; letter-spacing:0.3px;">
                            ${initialPassword}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Lưu ý -->
                <div style="margin-top:18px; padding:14px 16px; background:#fffbeb; border:1px solid #fef3c7; border-radius:12px; color:#92400e; font-size:13px;">
                  🔒 Vui lòng <strong>đổi mật khẩu</strong> ngay ở lần đăng nhập đầu tiên để bảo mật tài khoản.
                </div>

                <!-- Tips -->
                <div style="margin-top:18px; font-size:13px; color:#475569;">
                  <div style="font-weight:700; margin-bottom:6px;">Mẹo:</div>
                  <ul style="margin:0; padding-left:18px;">
                    <li>Tuyệt đối không chia sẻ mật khẩu cho người khác.</li>
                    <li>Nếu không đăng nhập được, hãy liên hệ bộ phận hỗ trợ ngay.</li>
                  </ul>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:18px 28px; background:#f8fafc; border-top:1px solid #e5e7eb; color:#64748b; font-size:12px;">
                <div style="margin-bottom:6px;">Trân trọng,</div>
                <div style="font-weight:600; color:#0f172a;">University Academic Portal</div>
                <div style="margin-top:8px;">
                  Cần hỗ trợ? Liên hệ: universityacademicportal.uap@gmail.com
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;


    await transporter.sendMail({
        from: process.env.MAIL_FROM || '"No-Reply" <no-reply@edu.vn>',
        to,
        subject: 'Thông tin tài khoản sinh viên',
        html
    });
}

module.exports = { sendWelcomeEmail };