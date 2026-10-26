import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../api.js';
import FinancialDashboard from '../components/FinancialDashboard.jsx';

vi.mock('../api.js', () => ({ api: vi.fn() }));

const onExpired = vi.fn();

function response(gross = 12550) {
  return {
    summary: {
      grossCents: gross,
      taxCents: gross / 5,
      netCents: (gross * 4) / 5,
      ratePercent: 20,
      count: gross ? 1 : 0,
      basis: 'Illustrative estimate; not a SARS calculation.',
    },
    months: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ].map((month, index) => ({
      month,
      grossCents: index === 0 ? gross : 0,
      count: index === 0 && gross ? 1 : 0,
    })),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  api.mockResolvedValue(response());
});

describe('financial dashboard', () => {
  it('can retry a failed financial report without changing the selected year', async () => {
    api.mockRejectedValueOnce(new Error('Report unavailable.'));
    render(<FinancialDashboard token="test" onExpired={onExpired} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Report unavailable.'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(api).toHaveBeenLastCalledWith(
      `/finance?year=${new Date().getUTCFullYear()}`,
      { token: 'test' }
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('renders gross, tax, net, an accessible chart and exact monthly table', async () => {
    render(<FinancialDashboard token="test" onExpired={onExpired} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading financial summary…'
    );
    expect(
      await screen.findByText(/not a SARS calculation/)
    ).toBeInTheDocument();

    const gross = screen.getByText('Gross income', { selector: 'dt' }).parentElement;
    const tax = screen.getByText('Estimated tax (20%)').parentElement;
    const net = screen.getByText('After-estimate income').parentElement;
    expect(within(gross).getByText(/R\s*125[,.]50/)).toBeInTheDocument();
    expect(within(tax).getByText(/R\s*25[,.]10/)).toBeInTheDocument();
    expect(within(net).getByText(/R\s*100[,.]40/)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Monthly income/ })
    ).toBeInTheDocument();

    const table = screen.getByRole('table', { name: /Monthly income/ });
    expect(within(table).getAllByRole('row')).toHaveLength(13);
    expect(
      within(table).getByRole('row', { name: /Jan 1 R\s*125[,.]50/ })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole('row', { name: /Feb 0 R\s*0[,.]00/ })
    ).toBeInTheDocument();
  });

  it('loads the selected year without mixing previous data', async () => {
    render(<FinancialDashboard token="test" onExpired={onExpired} />);
    await screen.findByRole('table');

    let resolveYear;
    api.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveYear = resolve;
        })
    );
    const year = new Date().getUTCFullYear() - 1;
    await userEvent.selectOptions(
      screen.getByLabelText(/Calendar year/),
      String(year)
    );

    await waitFor(() =>
      expect(api).toHaveBeenLastCalledWith(`/finance?year=${year}`, {
        token: 'test',
      })
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading financial summary…'
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText(/R\s*125[,.]50/)).not.toBeInTheDocument();

    await act(async () => {
      resolveYear(response(50000));
    });
    const table = await screen.findByRole('table', {
      name: `Monthly income — ${year}`,
    });
    expect(
      within(table).getByRole('row', { name: /Jan 1 R\s*500[,.]00/ })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Calendar year/)).toHaveValue(String(year));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/R\s*125[,.]50/)).not.toBeInTheDocument();
  });

  it('explains empty income and handles expired authentication', async () => {
    api.mockResolvedValueOnce(response(0));
    const { unmount } = render(
      <FinancialDashboard token="test" onExpired={onExpired} />
    );
    expect(
      await screen.findByText('No income recorded for this year.')
    ).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(
      13
    );
    expect(onExpired).not.toHaveBeenCalled();

    unmount();
    api.mockRejectedValueOnce(
      Object.assign(new Error('Please log in again.'), { status: 401 })
    );
    render(<FinancialDashboard token="expired" onExpired={onExpired} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please log in again.'
    );
    expect(onExpired).toHaveBeenCalledOnce();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
