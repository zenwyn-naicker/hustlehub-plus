/*Code Attribution: */
/**************************************************************************************************************
 * Author: Mongoose Contributors
 * Date: 2026
 * Title: Mongoose
 * Type: [Source Code]
 * Available at: <https://github.com/Automattic/mongoose> [Accessed 15 September 2026]
 **************************************************************************************************************/

const mongoose = require('mongoose');
const models = [require('../models/User'), require('../models/Gig'), require('../models/Booking'),
  require('../models/Transaction'), require('../models/RevokedToken')];
async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  mongoose.set('bufferCommands', false);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    await mongoose.disconnect();
    throw new Error('Use a MongoDB replica set or Atlas: bookings require transactions.');
  }
  await Promise.all(models.map(model => model.init()));
}
module.exports = { connectDatabase };