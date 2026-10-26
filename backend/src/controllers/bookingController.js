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

const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const { audit } = require('../utils/audit');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

function operational(statusCode, message) {
  return Object.assign(new Error(message), {
    statusCode,
    isOperational: true,
  });
}

function scope(user) {
  return user.role === 'client' ? { client: user.id } : { freelancer: user.id };
}

async function create(req, res) {
  const { gigId, requestKey, requirements = '', expectedPriceCents } = req.body;

  let result;
  let replay = false;

  const existingResponse = async (booking) => {
    if (booking.gig !== gigId) {
      throw operational(409, 'Request key already used for another gig.');
    }
    if (
      (booking.requirements || '') !== requirements ||
      (expectedPriceCents !== undefined &&
        booking.amountCents !== expectedPriceCents)
    ) {
      throw operational(
        409,
        'This request key belongs to a booking with different details.'
      );
    }

    return {
      booking,
      transaction: await Transaction.findOne({ booking: booking.id }),
    };
  };

  const existing = await Booking.findOne({
    client: req.user.id,
    requestKey,
  });

  if (existing) {
    return res.json({
      success: true,
      data: await existingResponse(existing),
    });
  }

  try {
    await mongoose.connection.transaction(async (session) => {
      // A write locks the listing against a concurrent deletion/price change.
      const gig = await Gig.findOneAndUpdate(
        { _id: gigId, active: true },
        { $inc: { bookingVersion: 1 } },
        { new: true, session }
      );

      if (!gig) {
        throw operational(404, 'Gig not found.');
      }

      if (
        expectedPriceCents !== undefined &&
        gig.priceCents !== expectedPriceCents
      ) {
        throw operational(
          409,
          'The service price has changed. Close this booking and review the updated listing before confirming.'
        );
      }

      const [booking] = await Booking.create(
        [
          {
            gig: gig.id,
            gigTitle: gig.title,
            gigDescription: gig.description,
            requirements,
            client: req.user.id,
            freelancer: gig.freelancer,
            amountCents: gig.priceCents,
            requestKey,
          },
        ],
        { session }
      );

      const [transaction] = await Transaction.create(
        [
          {
            booking: booking.id,
            client: req.user.id,
            freelancer: gig.freelancer,
            amountCents: gig.priceCents,
          },
        ],
        { session }
      );

      result = { booking, transaction };
    });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const booking = await Booking.findOne({
      client: req.user.id,
      requestKey,
    });

    if (!booking) {
      throw error;
    }

    result = await existingResponse(booking);
    replay = true;
  }

  if (!replay) {
    audit('booking.confirmed', {
      requestId: req.id,
      userId: req.user.id,
      bookingId: result.booking.id,
      amountCents: result.booking.amountCents,
    });

    audit('transaction.recorded', {
      requestId: req.id,
      userId: req.user.id,
      transactionId: result.transaction.id,
      bookingId: result.booking.id,
      amountCents: result.transaction.amountCents,
    });
  }

  res.status(replay ? 200 : 201).json({
    success: true,
    data: result,
  });
}

async function list(req, res) {
  res.json({
    success: true,
    data: {
      bookings: await Booking.find(scope(req.user)).sort({ createdAt: -1 }),
    },
  });
}

async function read(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.id,
    ...scope(req.user),
  });

  if (!booking) {
    throw operational(404, 'Booking not found.');
  }

  res.json({
    success: true,
    data: { booking },
  });
}

async function transactions(req, res) {
  res.json({
    success: true,
    data: {
      transactions: await Transaction.find(scope(req.user)).sort({
        createdAt: -1,
      }),
    },
  });
}

async function income(req, res) {
  const [totals] = await Transaction.aggregate([
    {
      $match: {
        freelancer: req.user.id,
        status: 'simulated-paid',
      },
    },
    {
      $group: {
        _id: null,
        totalCents: { $sum: '$amountCents' },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      income: {
        totalCents: totals?.totalCents || 0,
        count: totals?.count || 0,
        currency: 'ZAR',
      },
    },
  });
}

module.exports = {
  create,
  list,
  read,
  transactions,
  income,
};
