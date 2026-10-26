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
const schema = new Schema(
  {
    _id: { type: String, default: randomUUID },
    gig: { type: String, ref: 'Gig', required: true },
    gigTitle: { type: String, required: true },
    gigDescription: { type: String, default: '', maxlength: 1000 },
    requirements: { type: String, default: '', trim: true, maxlength: 2000 },
    client: { type: String, ref: 'User', required: true, index: true },
    freelancer: { type: String, ref: 'User', required: true, index: true },
    amountCents: {
      type: Number,
      required: true,
      min: 100,
      validate: Number.isSafeInteger,
    },
    status: { type: String, enum: ['confirmed'], default: 'confirmed' },
    requestKey: { type: String, required: true },
  },
  { timestamps: true, strict: 'throw' }
);
schema.index({ client: 1, requestKey: 1 }, { unique: true });
module.exports = model('Booking', schema);
