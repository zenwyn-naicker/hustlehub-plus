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
module.exports = model('Transaction', new Schema({
  _id: { type: String, default: randomUUID },
  booking: { type: String, ref: 'Booking', required: true, unique: true },
  client: { type: String, ref: 'User', required: true, index: true },
  freelancer: { type: String, ref: 'User', required: true, index: true },
  amountCents: { type: Number, required: true, min: 100, validate: Number.isSafeInteger },
  currency: { type: String, enum: ['ZAR'], default: 'ZAR' },
  status: { type: String, enum: ['simulated-paid'], default: 'simulated-paid' }
}, { timestamps: true, strict: 'throw' }));