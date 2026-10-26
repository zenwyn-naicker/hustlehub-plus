const { test } = require('node:test');
const assert = require('node:assert/strict');
const { estimateTax, financialSummary } = require('../src/utils/finance');
test('illustrative tax uses integer cents and rounds half-up', () => {
  assert.equal(estimateTax(0), 0); assert.equal(estimateTax(12550), 2510);
  assert.equal(estimateTax(2), 0); assert.equal(estimateTax(3), 1);
  assert.equal(estimateTax(Number.MAX_SAFE_INTEGER), 1801439850948198);
});
test('negative, fractional and unsafe amounts are refused', () => {
  for (const value of [-1, 1.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '100'])
    assert.throws(() => estimateTax(value), RangeError);
});
test('net income and the disclosed rate match the annual estimate', () => {
  const summary = financialSummary(12550, 1, 2026);
  assert.equal(summary.netCents, 10040); assert.equal(summary.taxCents, 2510);
  assert.equal(summary.ratePercent, 20); assert.equal(summary.currency, 'ZAR');
  assert.match(summary.basis, /not a SARS calculation/);
});