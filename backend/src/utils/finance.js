const RATE_PERCENT = 20;
function estimateTax(grossCents) {
  if (!Number.isSafeInteger(grossCents) || grossCents < 0) throw new RangeError('Income must be nonnegative integer cents.');
  
  // BigInt prevents intermediate floating-point rounding/overflow; round half-up once per annual total.
  return Number((BigInt(grossCents) * BigInt(RATE_PERCENT) + 50n) / 100n);
}
function financialSummary(grossCents, count, year) {
  const taxCents = estimateTax(grossCents);
  return { year, grossCents, taxCents, netCents: grossCents - taxCents, count, currency: 'ZAR',
    ratePercent: RATE_PERCENT, basis: 'Illustrative 20% flat estimate on simulated gross income; not a SARS calculation.' };
}
module.exports = { estimateTax, financialSummary };