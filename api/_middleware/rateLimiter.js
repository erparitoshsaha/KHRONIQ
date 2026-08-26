import rateLimit from 'express-rate-limit';

// Standard rate limiter response
const createLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message
    }
  });
};

// General API Limiter (300 requests per 15 minutes)
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

// Authentication Limiter (10 attempts per 15 minutes)
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

// Admin OTP Limiter (5 attempts per 15 minutes)
export const otpLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests or verification attempts. Please try again after 15 minutes.'
});

// Payment Limiter (30 payment requests per 15 minutes)
export const paymentLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many payment requests. Please try again after 15 minutes.'
});

// Contact Form Limiter (5 submissions per 15 minutes)
export const contactLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many messages sent. Please try again after 15 minutes.'
});

// Newsletter Subscription Limiter (5 requests per 15 minutes)
export const newsletterLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many subscription attempts. Please try again after 15 minutes.'
});
