/*Code Attribution: */
/**************************************************************************************************************
 * Author: express-validator Contributors
 * Date: 2026
 * Title: express-validator
 * Type: [Source Code]
 * Available at: <https://github.com/express-validator/express-validator> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Mot
 * Date: 2026
 * Title: dotenv
 * Type: [Source Code]
 * Available at: <https://github.com/motdotla/dotenv> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Mongoose Contributors
 * Date: 2026
 * Title: Mongoose
 * Type: [Source Code]
 * Available at: <https://github.com/Automattic/mongoose> [Accessed 15 September 2026]
 **************************************************************************************************************/

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { connectDatabase } = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');
const { registerValidation } = require('../src/validators/authValidation');
const { validationResult } = require('express-validator');
async function main() {
  const req = { body: { name: 'Local Administrator', email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD, role: 'client' }, query: {}, params: {} };
  await registerValidation.run(req);
  if (!validationResult(req).isEmpty()) throw new Error('Use a valid email and a password that meets the password rules.');
  await connectDatabase();
  if (await User.exists({ email: req.body.email })) throw new Error('Account already exists; no role was changed.');
  await User.create({ name: req.body.name, email: req.body.email, role: 'admin', passwordHash: await hashPassword(req.body.password) });
  console.log('Administrator created.');
}
main().catch(() => { console.error('Administrator creation failed. Check input, duplicate email and database configuration.'); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());