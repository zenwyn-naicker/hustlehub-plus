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
module.exports = model('Gig', new Schema({
  _id: { type: String, default: randomUUID },
  freelancer: { type: String, ref: 'User', required: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 1000 },
  priceCents: { type: Number, required: true, min: 100, max: 100000000, validate: Number.isSafeInteger },
  active: { type: Boolean, default: true },
  bookingVersion: { type: Number, default: 0 }
}, { timestamps: true, strict: 'throw' }));