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

const User = require('../models/User');
const Gig = require('../models/Gig');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

async function summary(_req, res) {
  const [users, gigs, bookings, transactions] = await Promise.all([
    User.countDocuments(), Gig.countDocuments({ active: true }), Booking.countDocuments(), Transaction.countDocuments()
  ]);
  
  res.json({ success: true, data: { summary: { users, activeGigs: gigs, bookings, transactions } } });
}
module.exports = { summary };