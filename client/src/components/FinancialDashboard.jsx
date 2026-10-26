import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

const money = (cents) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(
    cents / 100
  );

export default function FinancialDashboard({ token, revision = 0, onExpired }) {
  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(currentYear);
  const [finance, setFinance] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setFinance(null);
    setError('');
    api(`/finance?year=${year}`, { token })
      .then((value) => {
        if (active) setFinance(value);
      })
      .catch((failure) => {
        if (active) {
          setError(failure.message);
          if (failure.status === 401) onExpired();
        }
      });
    return () => {
      active = false;
    };
  }, [token, year, revision, onExpired, retry]);

  const maximum = Math.max(
    1,
    ...(finance?.months || []).map((month) => month.grossCents)
  );

  return (
    <section
      className="card finance"
      id="earnings"
      aria-labelledby="finance-heading"
    >
      <div className="toolbar">
        <div>
          <p className="eyebrow">YOUR FINANCIAL PICTURE</p>
          <h2 id="finance-heading">Income and estimated tax</h2>
        </div>
        <label>
          Calendar year (UTC){' '}
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {Array.from({ length: 6 }, (_, index) => currentYear - index).map(
              (value) => (
                <option key={value}>{value}</option>
              )
            )}
          </select>
        </label>
      </div>
      {error && (
        <div className="notice notice-error">
          <p role="alert">{error}</p>
          <button
            className="secondary"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}
      {!finance && !error && <p role="status">Loading financial summary…</p>}
      {finance && (
        <>
          <dl className="finance-totals">
            <div>
              <dt>Gross income</dt>
              <dd>{money(finance.summary.grossCents)}</dd>
            </div>
            <div>
              <dt>Estimated tax ({finance.summary.ratePercent}%)</dt>
              <dd>{money(finance.summary.taxCents)}</dd>
            </div>
            <div>
              <dt>After-estimate income</dt>
              <dd>{money(finance.summary.netCents)}</dd>
            </div>
          </dl>
          <div className="finance-notes">
            <p>
              {finance.summary.basis} No expenses, thresholds, rebates or other
              income are included.
            </p>
            <p>
              {finance.summary.count} confirmed transactions in {year}. Values
              are rounded to cents.
            </p>
          </div>
          <div
            className="chart-scroll"
            role="region"
            aria-label="Monthly income chart"
            tabIndex={0}
          >
            <svg
              className="income-chart"
              viewBox="0 0 660 220"
              role="img"
              aria-labelledby="chart-title chart-description"
            >
              <title id="chart-title">Monthly income in {year}</title>
              <desc id="chart-description">
                Bar heights show gross monthly income. Exact amounts are listed
                in the table below.
              </desc>
              {finance.months.map((month, index) => {
                const height = (month.grossCents / maximum) * 170;
                return (
                  <g key={month.month}>
                    <rect
                      x={index * 54 + 12}
                      y={185 - height}
                      width="32"
                      height={height}
                    />
                    <text x={index * 54 + 28} y="208" textAnchor="middle">
                      {month.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          {finance.summary.count === 0 && (
            <p>No income recorded for this year.</p>
          )}
          <div
            className="table-scroll"
            role="region"
            aria-label="Monthly income table"
            tabIndex={0}
          >
            <table className="finance-table">
              <caption>Monthly income — {year}</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Transactions</th>
                  <th scope="col">Gross income</th>
                </tr>
              </thead>
              <tbody>
                {finance.months.map((month) => (
                  <tr key={month.month}>
                    <th scope="row">{month.month}</th>
                    <td>{month.count}</td>
                    <td>{money(month.grossCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
