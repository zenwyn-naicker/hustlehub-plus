/*Code Attribution: */
/**************************************************************************************************************
 * Author: express-rate-limit Contributors
 * Date: 2026
 * Title: express-rate-limit
 * Type: [Source Code]
 * Available at: <https://github.com/express-rate-limit/express-rate-limit> [Accessed 15 September 2026]
 **************************************************************************************************************/

const { rateLimit } = require('express-rate-limit');
function limiter(limit, message, keyGenerator) {
  return rateLimit({ windowMs: 15 * 60 * 1000, limit,
    standardHeaders: 'draft-8', legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    message: { success: false, message, errors: [] }
  });
}

const loginLimiter = limiter(20, 'Too many login attempts. Try again in 15 minutes.');
const registerLimiter = limiter(10, 'Too many registrations. Try again in 15 minutes.');
const bookingLimiter = limiter(10, 'Booking limit reached. Try again in 15 minutes.', req => req.user.id);
module.exports = { loginLimiter, registerLimiter, bookingLimiter };