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

const Gig = require('../models/Gig');
const fail = res => res.status(404).json({ success: false, message: 'Gig not found.', errors: [] });
const publicFields = '_id title description priceCents freelancer active';

async function browse(req, res) {
  res.json({ success: true, data: { gigs: await Gig.find({ active: true }).select(publicFields).sort({ createdAt: -1 }) } });
}
async function mine(req, res) {
  res.json({ success: true, data: { gigs: await Gig.find({ freelancer: req.user.id, active: true }).select(publicFields) } });
}
async function readOwn(req, res) {
  const gig = await Gig.findOne({ _id: req.params.id, freelancer: req.user.id, active: true }).select(publicFields);
  return gig ? res.json({ success: true, data: { gig } }) : fail(res);
}
async function create(req, res) {
  const { title, description, priceCents } = req.body;
  const gig = await Gig.create({ title, description, priceCents, freelancer: req.user.id });
  res.status(201).json({ success: true, data: { gig } });
}
async function update(req, res) {
  const { title, description, priceCents } = req.body;
  const gig = await Gig.findOneAndUpdate({ _id: req.params.id, freelancer: req.user.id, active: true },
    { $set: { title, description, priceCents } }, { new: true, runValidators: true });
  return gig ? res.json({ success: true, data: { gig } }) : fail(res);
}
async function remove(req, res) {
  const gig = await Gig.findOneAndUpdate({ _id: req.params.id, freelancer: req.user.id, active: true }, { $set: { active: false } });
  return gig ? res.json({ success: true, message: 'Gig removed from listings.' }) : fail(res);
}
module.exports = { browse, mine, readOwn, create, update, remove };