import 'dotenv/config';
import sendEmail from '../api/utils/sendEmail.js';

async function test() {
  const targetEmail = process.argv[2] || process.env.EMAIL_USER;
  console.log(`\n==========================================`);
  console.log(`[TEST EMAIL] Testing email dispatch locally`);
  console.log(`Sender (EMAIL_USER): "${process.env.EMAIL_USER}"`);
  console.log(`Password Configured: ${process.env.EMAIL_PASS ? 'YES (length: ' + process.env.EMAIL_PASS.length + ')' : 'NO'}`);
  console.log(`Recipient: "${targetEmail}"`);
  console.log(`==========================================\n`);

  const result = await sendEmail({
    to: targetEmail,
    subject: 'KHRONIQ Watches - Local Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d4af37; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #1a1a1a;">KHRONIQ Email Verification Test</h2>
        <p>This is a test email sent locally to verify that your Google App Password and SMTP credentials are working correctly.</p>
        <p style="color: #666; font-size: 12px;">Timestamp: ${new Date().toLocaleString()}</p>
      </div>
    `
  });

  console.log('\nResult:', result);
  process.exit(result.success ? 0 : 1);
}

test();
