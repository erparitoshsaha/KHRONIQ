import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass || user.includes('YOUR_') || pass.includes('YOUR_')) {
    console.log(`\n========================================`);
    console.log(`[EMAIL NOTICE] (SMTP credentials not set in .env)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    const codeMatch = html.match(/(\d{6})/);
    if (codeMatch) {
      console.log(`🔑 ADMIN OTP CODE: ${codeMatch[1]}`);
    }
    console.log(`========================================\n`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: `"KHRONIQ Watches" <${user}>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Nodemailer sendMail failed:', error.message);
    console.log(`\n========================================`);
    console.log(`[EMAIL FALLBACK] Sent to ${to}: ${subject}`);
    const codeMatch = html.match(/(\d{6})/);
    if (codeMatch) {
      console.log(`🔑 ADMIN OTP CODE: ${codeMatch[1]}`);
    }
    console.log(`========================================\n`);
  }
};

export default sendEmail;