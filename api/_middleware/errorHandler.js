/**
 * Global Express Error Handling Middleware
 * Sanitizes errors returned to clients and logs server-side.
 * Never leaks stack traces, paths, or database internals in production.
 */
export function errorHandler(err, req, res, next) {
  // Server-side logging
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Default error status and message
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(el => el.message);
    message = `Invalid input: ${errors.join(', ')}`;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File size exceeds the allowed limit (10 MB for images, 50 MB for videos).';
    } else {
      statusCode = 400;
      message = err.message || 'File upload error.';
    }
  }

  // Handle file format rejection errors
  if (err.message && err.message.includes('Invalid file format')) {
    statusCode = 400;
    message = err.message;
  }

  // Handle Express body-parser entity too large
  if (err.type === 'entity.too.large' || err.status === 413) {
    statusCode = 413;
    message = 'Request entity too large. Please upload files directly using form data.';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Sanitize generic 500 errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected server error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

export default errorHandler;
