/*Code Attribution: */
/**************************************************************************************************************
 * Author: React Contributors
 * Date: 2026
 * Title: React and React DOM
 * Type: [Source Code]
 * Available at: <https://github.com/react/react> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Vitest Contributors
 * Date: 2026
 * Title: Vitest
 * Type: [Source Code]
 * Available at: <https://github.com/vitest-dev/vitest> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Testing Library Contributors
 * Date: 2026
 * Title: React Testing Library
 * Type: [Source Code]
 * Available at: <https://github.com/testing-library/react-testing-library> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Testing Library Contributors
 * Date: 2026
 * Title: user-event
 * Type: [Source Code]
 * Available at: <https://github.com/testing-library/user-event> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Testing Library Contributors
 * Date: 2026
 * Title: jest-dom
 * Type: [Source Code]
 * Available at: <https://github.com/testing-library/jest-dom> [Accessed 15 September 2026]
 **************************************************************************************************************/

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthForm from '../components/AuthForm.jsx';
import GigForm from '../components/GigForm.jsx';
import App from '../App.jsx';
import { api } from '../api.js';
vi.mock('../api.js', () => ({ api: vi.fn() }));
beforeEach(() => {
  api.mockReset();
});
describe('Authentication rendering and interaction', () => {
  it('toggles password visibility without submitting and resets it on registration', async () => {
    render(<AuthForm onLogin={vi.fn()} />);
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Show password' })
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(api).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Hide password' })
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Show password' })
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
  });
  it('renders labelled login fields and no admin registration option', async () => {
    render(<AuthForm onLogin={vi.fn()} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    );
    expect(screen.getByLabelText('Role')).toHaveTextContent('ClientFreelancer');
    expect(screen.queryByRole('option', { name: /admin/i })).toBeNull();
  });
  it('logs in and passes the server session to its parent', async () => {
    const session = { token: 'test-token', user: { role: 'client' } };
    api.mockResolvedValue(session);
    const onLogin = vi.fn();
    render(<AuthForm onLogin={onLogin} />);
    await userEvent.type(screen.getByLabelText('Email'), 'client@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'StrongPass!123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(api).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'client@example.com', password: 'StrongPass!123' },
    });
    expect(onLogin).toHaveBeenCalledWith(session);
  });
  it('shows a safe API error and allows another attempt', async () => {
    api.mockImplementation(async () => {
      throw new Error('Email or password is incorrect.');
    });
    render(<AuthForm onLogin={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Email'), 'client@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Email or password is incorrect.'
    );
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });
  it('registers a freelancer then returns to login', async () => {
    api.mockResolvedValue({});
    render(<AuthForm onLogin={vi.fn()} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' })
    );
    await userEvent.type(screen.getByLabelText('Name'), 'Test Freelancer');
    await userEvent.type(screen.getByLabelText('Email'), 'free@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'StrongPass!123');
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'freelancer');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(api).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({
        body: expect.objectContaining({ role: 'freelancer' }),
      })
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Account created.'
    );
  });
});
it('converts a gig price to cents and submits plain form data', async () => {
  const onSave = vi.fn();
  render(<GigForm onSave={onSave} />);
  await userEvent.type(screen.getByLabelText('Title'), 'Logo design');
  await userEvent.type(
    screen.getByLabelText('Description'),
    'Custom logo design'
  );
  await userEvent.type(screen.getByLabelText('Price (ZAR)'), '125.50');
  await userEvent.click(screen.getByRole('button', { name: 'Publish gig' }));
  expect(onSave).toHaveBeenCalledWith({
    title: 'Logo design',
    description: 'Custom logo design',
    priceCents: 12550,
  });
});
it('renders a public landing page and opens sign-in without fetching private data', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'The right skills.A fresh start.'
  );
  expect(screen.getByRole('banner')).toHaveTextContent('HustleHub+');
  expect(screen.getByRole('contentinfo')).toHaveTextContent(
    'Freelance marketplace'
  );
  expect(screen.queryByText(/Part 3/)).not.toBeInTheDocument();
  expect(api).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Sign in', exact: true })
  );
  expect(
    screen.getByRole('heading', { name: 'Sign in to HustleHub+' })
  ).toBeInTheDocument();
});

it('shows loading instead of empty records while the dashboard is being fetched', async () => {
  api.mockImplementation((path) =>
    path === '/auth/login'
      ? Promise.resolve({
          token: 'test-token',
          user: { name: 'Test Client', role: 'client' },
        })
      : new Promise(() => {})
  );
  render(<App />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Sign in', exact: true })
  );
  await userEvent.type(screen.getByLabelText('Email'), 'client@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'StrongPass!123');
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Loading your dashboard…'
  );
  expect(screen.queryByText(/No gigs available/)).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Bookings' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
});

it('shows full booking references only when Details is expanded', async () => {
  const id = '12345678-1234-4234-8234-123456789abc';
  api.mockImplementation(async (path) => {
    if (path === '/auth/login')
      return {
        token: 'test-token',
        user: { name: 'Test Client', role: 'client' },
      };
    if (path === '/gigs') return { gigs: [] };
    if (path === '/bookings')
      return {
        bookings: [
          {
            _id: id,
            gigTitle: 'Logo design',
            amountCents: 12550,
            status: 'confirmed',
          },
        ],
      };
    return { transactions: [] };
  });
  render(<App />);
  await userEvent.click(
    screen.getByRole('button', { name: 'Sign in', exact: true })
  );
  await userEvent.type(screen.getByLabelText('Email'), 'client@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'StrongPass!123');
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  const reference = await screen.findByText(`Booking reference: ${id}`);
  expect(reference).not.toBeVisible();
  await userEvent.click(screen.getByText('Details', { exact: false }));
  expect(reference).toBeVisible();
});
