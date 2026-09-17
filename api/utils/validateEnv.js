/**
 * Environment Variable Validator
 * Validates that critical environment variables are set before the server boots.
 * Never prints secret values to console.
 */
export function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';

  const criticalVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingCritical = criticalVars.filter(v => !process.env[v] || process.env[v].trim() === '');

  if (missingCritical.length > 0) {
    if (isProd) {
      console.error(`[FATAL] Missing critical environment variables: ${missingCritical.join(', ')}`);
      throw new Error(`Missing critical environment variables: ${missingCritical.join(', ')}`);
    } else {
      console.warn(`[WARN] Missing critical environment variables for development: ${missingCritical.join(', ')}`);
    }
  }

  const serviceVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL'
  ];

  const missingServices = serviceVars.filter(v => !process.env[v] || process.env[v].trim() === '');
  if (missingServices.length > 0) {
    console.warn(`[INFO] Some service environment variables are not yet configured: ${missingServices.join(', ')}`);
  }
}

export default validateEnv;
