const Transaction = require('../models/Transaction');
const { financialSummary } = require('../utils/finance');
const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
async function finance(req, res) {
  const year = req.query.year === undefined ? new Date().getUTCFullYear() : Number(req.query.year);
  const rows = await Transaction.aggregate([
    { $match: { freelancer: req.user.id, status: 'simulated-paid',
      createdAt: { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) } } },
    { $group: { _id: { $month: '$createdAt' }, grossCents: { $sum: '$amountCents' }, count: { $sum: 1 } } }
  ]);
  const months = names.map((month, index) => {
    const row = rows.find(item => item._id === index + 1);
    return { month, grossCents: row?.grossCents || 0, count: row?.count || 0 };
  });
  const gross = months.reduce((sum, month) => sum + month.grossCents, 0);
  const count = months.reduce((sum, month) => sum + month.count, 0);
  res.json({ success: true, data: { summary: financialSummary(gross, count, year), months } });
}
module.exports = { finance };