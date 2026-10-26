const { Schema, model } = require('mongoose');
const schema = new Schema({
  _id: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { versionKey: false, strict: 'throw' });
module.exports = model('RevokedToken', schema);