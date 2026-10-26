/*Code Attribution: */
/**************************************************************************************************************
 * Author: Express.js Contributors
 * Date: 2026
 * Title: Express
 * Type: [Source Code]
 * Available at: <https://github.com/expressjs/express> [Accessed 28 August 2026]
 **************************************************************************************************************/

const User = require('../models/User');
const { findUserByEmail } = require('../models/userStore');
const { verifyPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { audit } = require('../utils/audit');
const LOCK_MS = 5 * 60 * 1000;
function denied(req, res, user, outcome) {
  audit('auth.login_failed', { requestId: req.id, userId: user?.id, outcome });
  return res.status(401).json({ success: false, message: 'Email or password is incorrect.', errors: [] });
}
async function login(req, res) {
  const { email, password } = req.body;
  let user = await findUserByEmail(email);
  if (!user) return denied(req, res, null, 'invalid');
  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) return denied(req, res, user, 'locked');
  // Clear only an expired lock, atomically. This is persistent across API restarts.
  if (user.lockedUntil) {
    await User.updateOne({ _id: user.id, lockedUntil: { $lte: now } }, { $set: { failedLogins: 0, lockedUntil: null } });
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    await User.updateOne({ _id: user.id }, [
      { $set: { failedLogins: { $add: [{ $ifNull: ['$failedLogins', 0] }, 1] } } },
      { $set: { lockedUntil: { $cond: [{ $gte: ['$failedLogins', 5] }, new Date(Date.now() + LOCK_MS), '$lockedUntil'] } } }
    ]);
    return denied(req, res, user, 'invalid');
  }
  // Do not issue a token if another request locked the account during bcrypt work.
  user = await User.findOneAndUpdate({ _id: user.id, $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }] },
    { $set: { failedLogins: 0, lockedUntil: null } }, { new: true });
  if (!user) return denied(req, res, null, 'locked');
  audit('auth.login_success', { requestId: req.id, userId: user.id, role: user.role });
  return res.json({ success: true, message: 'Login successful.', data: {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token: generateToken(user), tokenType: 'Bearer', expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  } });
}
module.exports = { login };