const RevokedToken = require('../models/RevokedToken');
const { audit } = require('../utils/audit');
async function logout(req, res) {
  await RevokedToken.updateOne({ _id: req.auth.jti }, { $setOnInsert: { expiresAt: new Date(req.auth.exp * 1000) } }, { upsert: true });
  audit('auth.logout', { requestId: req.id, userId: req.user.id });
  res.json({ success: true, data: {} });
}
module.exports = { logout };