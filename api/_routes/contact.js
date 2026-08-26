import express from 'express';
import { contactLimiter } from '../_middleware/rateLimiter.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact concierge inquiry
// @access  Public (Rate-limited)
router.post('/', contactLimiter, async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, subject, and message.' });
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).toLowerCase().trim();
  const cleanSubject = String(subject).trim();
  const cleanMessage = String(message).trim();

  // Validate format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  if (cleanName.length < 2 || cleanSubject.length < 2 || cleanMessage.length < 5) {
    return res.status(400).json({ success: false, message: 'Please provide comprehensive details in your message.' });
  }

  try {
    const recipient = process.env.EMAIL_USER || process.env.SMTP_USER;

    if (recipient) {
      await sendEmail({
        to: recipient,
        subject: `[Concierge Inquiry] ${cleanSubject} - from ${cleanName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px;">
            <h2 style="color: #1f4d3a;">New Client Concierge Inquiry</h2>
            <p><strong>Client Name:</strong> ${cleanName}</p>
            <p><strong>Email:</strong> ${cleanEmail}</p>
            <p><strong>Subject:</strong> ${cleanSubject}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
            <p><strong>Message:</strong></p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; line-height: 1.6;">
              ${cleanMessage.replace(/\n/g, '<br/>')}
            </div>
          </div>
        `
      });
    }

    res.json({
      success: true,
      message: 'Your inquiry has been received. Our concierge team will reach out to you shortly.'
    });
  } catch (error) {
    console.error('Contact form dispatch error:', error);
    res.status(500).json({ success: false, message: 'Failed to send your message. Please try again later.' });
  }
});

export default router;
