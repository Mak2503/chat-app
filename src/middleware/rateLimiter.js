const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Create custom handler for rate limit exceeded
const limitHandler = (req, res) => {
  logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
  return res.status(429).json({
    message: 'Too many requests, please try again later.'
  });
};

// Create rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: limitHandler,
  skipSuccessfulRequests: false, // Count successful requests against the rate limit
  skip: (req) => {
    // Skip rate limiting for swagger docs
    if (req.originalUrl.includes('/api/docs')) {
      return true;
    }
    return false;
  }
});

module.exports = limiter;