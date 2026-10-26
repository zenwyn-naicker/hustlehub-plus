/*Code Attribution: */
/**************************************************************************************************************
 * Author: Express.js Contributors
 * Date: 2026
 * Title: Express
 * Type: [Source Code]
 * Available at: <https://github.com/expressjs/express> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Mongoose Contributors
 * Date: 2026
 * Title: Mongoose
 * Type: [Source Code]
 * Available at: <https://github.com/Automattic/mongoose> [Accessed 15 September 2026]
 **************************************************************************************************************/

const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const { audit } = require('../utils/audit');
async function authenticateToken(req, res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') || '');
  let payload;
  try {
    if (!match) throw new Error('Missing token');
    payload = verifyToken(match[1]);
    if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string' || !Number.isInteger(payload.exp) || !payload.role)
      throw new Error('Missing claims');
  } catch {
    return res.status(401).json({ success: false, message: 'Authentication token is missing, expired, or invalid.', errors: [] });
  }
  const [user, revoked] = await Promise.all([User.findById(payload.sub), RevokedToken.exists({ _id: payload.jti })]);
  if (!user || user.role !== payload.role || revoked) {
    audit('auth.token_rejected', { requestId: req.id });
    return res.status(401).json({ success: false, message: 'Please log in again.', errors: [] });
  }
  req.user = { id: user.id, role: user.role };
  req.auth = { jti: payload.jti, exp: payload.exp };
  next();
}
function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.user.role) ? next() :
    res.status(403).json({ success: false, message: 'Your role cannot perform this action.', errors: [] });
}
module.exports = { authenticateToken, allowRoles };