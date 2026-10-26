/*Code Attribution: */
/**************************************************************************************************************
 * Author: Node.js Contributors
 * Date: 2026
 * Title: Node.js
 * Type: [Source Code]
 * Available at: <https://github.com/nodejs/node> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Mongoose Contributors
 * Date: 2026
 * Title: Mongoose
 * Type: [Source Code]
 * Available at: <https://github.com/Automattic/mongoose> [Accessed 15 September 2026]
 **************************************************************************************************************/

const { Schema, model } = require('mongoose');
const { randomUUID } = require('node:crypto');
const schema = new Schema({
  _id: { type: String, default: randomUUID },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['client', 'freelancer', 'admin'], required: true },
  failedLogins: { type: Number, default: 0, min: 0 },
  lockedUntil: { type: Date, default: null }
}, { timestamps: true, strict: 'throw' });
module.exports = model('User', schema);