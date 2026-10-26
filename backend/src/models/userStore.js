/*Code Attribution: */
/**************************************************************************************************************
 * Author: Mongoose Contributors
 * Date: 2026
 * Title: Mongoose
 * Type: [Source Code]
 * Available at: <https://github.com/Automattic/mongoose> [Accessed 15 September 2026]
 **************************************************************************************************************/

const User = require('./User');
async function findUserByEmail(email) {
  return User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
}
async function createUser({ name, email, passwordHash, role }) {
  try { return await User.create({ name, email, passwordHash, role }); }
  catch (error) {
    if (error.code === 11000) error.code = 'DUPLICATE_EMAIL';
    throw error;
  }
}
module.exports = { findUserByEmail, createUser };