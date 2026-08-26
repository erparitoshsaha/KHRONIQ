import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  // Strip any whitespace from Google App passwords
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) {
    console.warn('[EMAIL] EMAIL_USER / EMAIL_PASS environment variables are not configured in environment.');
    return {
      success: false,
      message: 'Email credentials (EMAIL_USER / EMAIL_PASS) are not configured in Vercel environment.'
    };
  }

  try {
    // Primary: service 'gmail'
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from: `"KHRONIQ Watches" <${user}>`,
      to,
      subject,
      html
    });

    console.log(`[EMAIL] Email successfully dispatched to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EMAIL] Failed to send email via Gmail service:', err.message);

    // Fallback: direct SMTP connection on port 465 / 587
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user,
          pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const fallbackInfo = await fallbackTransporter.sendMail({
        from: `"KHRONIQ Watches" <${user}>`,
        to,
        subject,
        html
      });

      console.log(`[EMAIL] Email successfully dispatched via fallback to ${to}`);
      return { success: true, messageId: fallbackInfo.messageId };
    } catch (fallbackErr) {
      console.error('[EMAIL] Fallback SMTP also failed:', fallbackErr.message);
      return {
        success: false,
        error: `SMTP Authentication failed: ${err.message}. Ensure Google App Password is correct.`
      };
    }
  }
};

export default sendEmail;