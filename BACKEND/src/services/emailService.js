const nodemailer = require('nodemailer');
require('dotenv').config();
// Log environment variables for debugging (remove in production)
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '[REDACTED]' : 'undefined');
const dayjs = require('dayjs');
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

// Verify transporter connectivity at startup to catch SMTP/auth errors early
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP verification failed:', err);
  } else {
    console.log('✅ SMTP transporter is ready to send messages');
  }
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


  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || '"No-Reply" <no-reply@edu.vn>',
      to,
      subject: 'Thông tin tài khoản sinh viên',
      html,
    });
  } catch (err) {
    console.error('❌ sendWelcomeEmail failed for', to, err);
    throw err; // rethrow so callers can mark emailSent = false
  }
}

const sendResetPasswordEmail = async ({ to, fullName, schoolEmail, newPassword }) => {
  const html = `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yêu cầu Reset Mật khẩu</title>
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
      Yêu cầu reset mật khẩu của bạn.
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
                      <div class="h1" style="margin-top:6px; font-size:22px; font-weight:700; color:#ffffff;">Yêu cầu Reset Mật khẩu</div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <!-- Badge -->
                      <span style="display:inline-block; padding:6px 10px; border-radius:999px; background:#dbeafe; color:#1e3a8a; font-size:12px; font-weight:600;">
                        Reset mật khẩu
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
                  Bạn đã yêu cầu reset mật khẩu cho tài khoản của mình. Vui lòng xem thông tin dưới đây để biết mật khẩu mới.
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
                          <td style="padding:6px 0; font-size:14px; color:#334155;">Mật khẩu mới</td>
                          <td style="padding:6px 0; font-size:14px; color:#0f172a; font-weight:600; letter-spacing:0.3px;">
                            ${newPassword}
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


  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || '"No-Reply" <no-reply@edu.vn>',
      to,
      subject: 'Yêu cầu reset mật khẩu tài khoản sinh viên',
      html,
    });
  } catch (err) {
    console.error('❌ sendResetPasswordEmail failed for', to, err);
    throw err;
  }
}


const sendPasswordResetEmail = async ({ to, token }) => {
  // Sửa 'http://localhost:3000' thành URL frontend của bạn nếu cần
  const resetUrl = `http://localhost:3000/reset-password/${token}`;

  const mailOptions = {
    from: `UAP - University Academic Portal <${process.env.EMAIL_USER}>`,
    to: to,
    subject: '[UAP] Yêu cầu đặt lại mật khẩu',
    html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #333;">Bạn đã yêu cầu đặt lại mật khẩu?</h2>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản UAP của bạn. Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu.</p>
                <p>Lưu ý: Link này sẽ hết hạn sau <strong>10 phút</strong>.</p>
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Đặt lại mật khẩu
                </a>
                <p style="margin-top: 20px;">Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email này.</p>
                <hr/>
                <p style="font-size: 0.9em; color: #777;">Nếu nút bấm không hoạt động, vui lòng sao chép và dán link sau vào trình duyệt:<br/> <a href="${resetUrl}">${resetUrl}</a></p>
            </div>
        `
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Email] Đã gửi link reset mật khẩu tới ${to}`);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};
const sendPaymentNotificationEmail = async ({ to, studentName, semesterName, amount, deadline }) => {
  const mailOptions = {
    from: `UAP - University Academic Portal <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `[UAP] Thông báo Học phí Kỳ ${semesterName}`,
    html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #333;">Thông báo Học phí</h2>
                <p>Chào ${studentName || 'bạn'},</p>
                <p>Nhà trường thông báo khoản thu học phí cho học kỳ <b>${semesterName}</b> đã được tạo trên hệ thống.</p>
                <p>Chi tiết khoản thu:</p>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li><strong>Số tiền:</strong> <span style="color: #dc3545; font-weight: bold;">${formatCurrency(amount)}</span></li>
                    <li><strong>Hạn chót thanh toán:</strong> ${dayjs(deadline).format('DD/MM/YYYY')}</li>
                </ul>
                <p>Vui lòng truy cập cổng thông tin sinh viên để xem chi tiết và hoàn thành thanh toán trước hạn.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/payment" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Thanh toán ngay
                </a>
            </div>
        `
  };
  await transporter.sendMail(mailOptions);
};

const sendTuitionReminderEmail = async ({ to, studentName, semesterName, amount, deadline, customMessage }) => {
  const mailOptions = {
    from: `UAP - University Academic Portal <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `[UAP] Nhắc nhở Thanh toán Học phí Kỳ ${semesterName}`,
    html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #dc3545;">Nhắc nhở Đóng học phí</h2>
                <p>Chào ${studentName || 'bạn'},</p>
                
                ${customMessage ? `
                    <p style="font-style: italic; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
                        <b>Thông báo từ phòng kế toán:</b><br/>
                        ${customMessage}
                    </p>
                ` : `
                    <p>Hệ thống ghi nhận bạn vẫn chưa hoàn thành khoản thu học phí cho kỳ <b>${semesterName}</b>.</p>
                `}
                
                <p>Chi tiết khoản thu:</p>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li><strong>Số tiền:</strong> <span style="color: #dc3545; font-weight: bold;">${formatCurrency(amount)}</span></li>
                    <li><strong>Hạn chót thanh toán:</strong> ${dayjs(deadline).format('DD/MM/YYYY')}</li>
                </ul>
                <p>Vui lòng hoàn thành thanh toán sớm để không ảnh hưởng đến việc học. Các sinh viên chưa hoàn thành học phí có thể sẽ bị khóa lịch học.</p>
            </div>
        `
  };
  await transporter.sendMail(mailOptions);
};
module.exports = {
  sendWelcomeEmail, sendResetPasswordEmail, sendPasswordResetEmail, sendPaymentNotificationEmail, sendTuitionReminderEmail
};