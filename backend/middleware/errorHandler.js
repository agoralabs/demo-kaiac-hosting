/**
 * Global error handler middleware for KaiaC Hosting backend
 */

// Custom error class for API errors
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Error converter - converts regular errors to ApiError format
const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error instanceof SyntaxError ? 400 : 500;
    const message = error.message || 'Une erreur est survenue';
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// Final error handler
const errorHandler = (err, req, res, next) => {
  let { statusCode, message, stack } = err;
  
  try {
    // Ensure we have a status code
    statusCode = statusCode || 500;
    
    // Prepare error response
    const response = {
      success: false,
      status: statusCode,
      message: message || 'Erreur interne du serveur',
      ...(process.env.NODE_ENV === 'development' && { stack: stack }),
      ...(err.errors && { errors: err.errors })
    };
    
    // Log error details
    console.error(`[${new Date().toISOString()}] Error:`, {
      url: req.originalUrl,
      method: req.method,
      statusCode: statusCode,
      message: message,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined
    });
    
    // Send error response
    return res.status(statusCode).json(response);
  } catch (e) {
    // Fallback error handling to prevent crashes
    console.error('Error in error handler:', e);
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  ApiError,
  errorConverter,
  errorHandler
};
