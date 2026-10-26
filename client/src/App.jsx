/*Code Attribution: */
/**************************************************************************************************************
 * Author: React Contributors
 * Date: 2026
 * Title: React and React DOM
 * Type: [Source Code]
 * Available at: <https://github.com/react/react> [Accessed 15 September 2026]
 **************************************************************************************************************/

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import GigForm from './components/GigForm.jsx';
import EditGigDialog from './components/EditGigDialog.jsx';
import FinancialDashboard from './components/FinancialDashboard.jsx';
import PublicHome from './components/PublicHome.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import WorkspaceSidebar from './components/WorkspaceSidebar.jsx';
import BookingFlow from './components/BookingFlow.jsx';

export const money = (cents) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(
    cents / 100
  );

const summaryLabels = {
  users: 'Users',
  activeGigs: 'Active gigs',
  bookings: 'Bookings',
  transactions: 'Transactions',
};

function BookingReference({ id, booking, expanded = false }) {
  return (
    <details className="reference" open={expanded || undefined}>
      <summary>
        Details <span>#{id.slice(0, 8)}</span>
      </summary>
      <small>Booking reference: {id}</small>
      {booking?.gigDescription && (
        <div className="booking-record-detail">
          <strong>Booked service</strong>
          <p className="description">{booking.gigDescription}</p>
        </div>
      )}
      {booking?.requirements && (
        <div className="booking-record-detail">
          <strong>Project requirements</strong>
          <p className="description">{booking.requirements}</p>
        </div>
      )}
    </details>
  );
}

function Dashboard({ session, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [confirmation, setConfirmation] = useState(null);
  const [bookingFlow, setBookingFlow] = useState(null);
  const [highlightedBooking, setHighlightedBooking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState('');
  const [formVersion, setFormVersion] = useState(0);
  const [financeRevision, setFinanceRevision] = useState(0);
  const bookingAttempts = useRef(new Map());
  const expired = useCallback(
    () => onLogout('Session expired. Please log in again.'),
    [onLogout]
  );
  const { token, user } = session;
  const call = (path, options) => api(path, { token, ...options });

  async function load() {
    if (user.role === 'admin') {
      setData(await call('/admin/summary'));
      return;
    }

    const [gigs, bookings, transactions, income] = await Promise.all([
      call(user.role === 'freelancer' ? '/gigs/mine' : '/gigs'),
      call('/bookings'),
      call('/transactions'),
      user.role === 'freelancer' ? call('/income') : Promise.resolve({}),
    ]);
    setData({ ...gigs, ...bookings, ...transactions, ...income });
    if (user.role === 'freelancer') setFinanceRevision((value) => value + 1);
  }

  function failure(error) {
    if (error.status === 401) {
      onLogout('Session expired. Please log in again.');
    } else {
      setMessageType('error');
      setMessage([error.message, error.fields].filter(Boolean).join(' '));
    }
  }

  useEffect(() => {
    load()
      .catch(failure)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (bookingFlow || !highlightedBooking) return;
    const record = document.getElementById(`booking-${highlightedBooking}`);
    record?.scrollIntoView({ block: 'start' });
    record?.focus({ preventScroll: true });
  }, [bookingFlow, highlightedBooking]);

  async function action(work, success) {
    if (busy) return;
    setBusy(true);
    setMessage('');

    try {
      await work();
      await load();
      setMessageType('success');
      setMessage(success);
    } catch (error) {
      failure(error);
    } finally {
      setBusy(false);
    }
  }

  function startBooking(gig) {
    const pending = bookingAttempts.current.get(gig._id);
    setBookingFlow({ gig: pending?.gig || gig, attempt: pending?.body });
  }

  async function book(gig, requirements) {
    // Keep the exact payload and key after an uncertain network/server failure.
    // Closing and reopening this service resumes that same attempt.
    let attempt = bookingAttempts.current.get(gig._id);
    if (!attempt) {
      attempt = {
        gig,
        body: {
          gigId: gig._id,
          requirements,
          expectedPriceCents: gig.priceCents,
          requestKey: crypto.randomUUID(),
        },
      };
      bookingAttempts.current.set(gig._id, attempt);
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await call('/bookings', {
        method: 'POST',
        body: attempt.body,
      });
      bookingAttempts.current.delete(gig._id);
      setData((current) => ({
        ...current,
        bookings: [
          result.booking,
          ...current.bookings.filter((item) => item._id !== result.booking._id),
        ],
        transactions: [
          result.transaction,
          ...current.transactions.filter(
            (item) => item._id !== result.transaction._id
          ),
        ],
      }));
      // A refresh failure must never turn a committed booking into a failed checkout.
      load().catch(() => {
        setMessageType('error');
        setMessage(
          'Your booking is saved, but the workspace could not refresh. Select Refresh to try again.'
        );
      });
      return result;
    } catch (error) {
      if (error.status >= 400 && error.status < 500)
        bookingAttempts.current.delete(gig._id);
      if (error.status === 401) failure(error);
      if (error.status === 404 || error.status === 409) load().catch(failure);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      await call('/auth/logout', { method: 'POST' });
      onLogout('Logged out securely.');
    } catch (error) {
      failure(error);
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(body) {
    if (busy) return;
    setBusy(true);
    setEditError('');
    try {
      const { gig } = await call(`/gigs/${editing._id}`, {
        method: 'PUT',
        body,
      });
      setData((current) => ({
        ...current,
        gigs: current.gigs.map((item) => (item._id === gig._id ? gig : item)),
      }));
      setEditing(null);
      setMessageType('success');
      setMessage('Gig updated.');
    } catch (error) {
      if (error.status === 401) failure(error);
      else
        setEditError([error.message, error.fields].filter(Boolean).join(' '));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="workspace">
      <WorkspaceSidebar
        user={user}
        busy={busy}
        onLogout={logout}
        contentReady={Boolean(data)}
      />
      <div className="workspace-content">
        <div className="toolbar workspace-heading" id="overview">
          <div>
            <p className="eyebrow">
              {user.role === 'admin'
                ? 'PLATFORM ADMINISTRATION'
                : 'YOUR WORKSPACE'}
            </p>
            <h1>
              {user.role === 'admin'
                ? 'Platform overview'
                : `Hello, ${user.name?.split(' ')[0] || 'there'}.`}
            </h1>
            <p className="muted">
              {user.role === 'admin'
                ? 'A clear view of activity across HustleHub+.'
                : user.role === 'freelancer'
                  ? 'Manage your services and keep your work moving.'
                  : 'Find a service. Start your next project.'}
            </p>
          </div>
          <div className="actions">
            <button
              className="secondary"
              disabled={busy || loading}
              onClick={() => action(async () => {}, 'Updated.')}
            >
              Refresh
            </button>
          </div>
        </div>
        <div
          role="status"
          aria-live={messageType === 'error' ? 'assertive' : 'polite'}
          className={
            busy || message || loading
              ? `notice ${message && messageType === 'error' ? 'notice-error' : ''}`
              : undefined
          }
        >
          {loading ? 'Loading your dashboard…' : busy ? 'Working…' : message}
        </div>
        {loading && (
          <div className="loading-skeleton" aria-hidden="true">
            <div />
            <div />
            <div />
          </div>
        )}
        {!data ? (
          !loading && (
            <p className="muted">
              Your dashboard could not load. Select Refresh to try again.
            </p>
          )
        ) : user.role === 'admin' ? (
          <section className="card admin-overview">
            <h2>Administrator overview</h2>
            <p className="muted">
              Live totals from the platform. Use Refresh to load the latest
              activity.
            </p>
            <dl>
              {Object.entries(data.summary || {}).map(([key, value]) => (
                <div key={key}>
                  <dt>{summaryLabels[key] || key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : (
          <>
            {user.role === 'freelancer' && (
              <>
                <FinancialDashboard
                  token={token}
                  revision={financeRevision}
                  onExpired={expired}
                />
                <div id="create-gig">
                  <GigForm
                    key={formVersion}
                    busy={busy}
                    onSave={(body) =>
                      action(async () => {
                        await call('/gigs', {
                          method: 'POST',
                          body,
                        });
                        setFormVersion((value) => value + 1);
                      }, 'Gig saved.')
                    }
                  />
                </div>
              </>
            )}
            <div className="section-heading" id="services">
              <div>
                <p className="eyebrow">
                  {user.role === 'freelancer'
                    ? 'SERVICE MANAGEMENT'
                    : 'THE MARKETPLACE'}
                </p>
                <h2>
                  {user.role === 'freelancer' ? 'Your gigs' : 'Available gigs'}
                </h2>
                <p className="muted">
                  {user.role === 'freelancer'
                    ? 'Keep your listings clear, current and ready for clients.'
                    : 'Explore services and find the right fit for your project.'}
                </p>
              </div>
              <span className="count-label">
                {data.gigs.length}{' '}
                {data.gigs.length === 1 ? 'service' : 'services'}
              </span>
            </div>
            <div className="grid">
              {data.gigs.map((gig) => (
                <article className="card gig" key={gig._id}>
                  <div className="gig-top">
                    <span className="gig-kind">Freelance service</span>
                  </div>
                  <h3>{gig.title}</h3>
                  <p className="description">{gig.description}</p>
                  <p className="price">
                    <span>Service price</span>
                    <strong>{money(gig.priceCents)}</strong>
                  </p>
                  {user.role === 'client' ? (
                    <button disabled={busy} onClick={() => startBooking(gig)}>
                      View service
                    </button>
                  ) : (
                    <div className="actions">
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => {
                          setEditError('');
                          setEditing(gig);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="danger"
                        disabled={busy}
                        onClick={() => {
                          setConfirmation({
                            title: 'Remove this listing?',
                            description: `“${gig.title}” will no longer be available. Existing bookings will be kept.`,
                            destructive: true,
                            onConfirm: () => {
                              action(async () => {
                                await call(`/gigs/${gig._id}`, {
                                  method: 'DELETE',
                                });
                                if (editing?._id === gig._id) setEditing(null);
                              }, 'Listing removed.');
                            },
                          });
                        }}
                      >
                        Remove listing
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
            {editing && (
              <EditGigDialog
                gig={editing}
                busy={busy}
                error={editError}
                onSave={saveEdit}
                onCancel={() => setEditing(null)}
              />
            )}
            {!data.gigs.length && (
              <div className="empty-state">
                <h3>
                  {user.role === 'freelancer'
                    ? 'Your first service starts here'
                    : 'More services on the way'}
                </h3>
                <p>
                  {user.role === 'freelancer'
                    ? 'Publish your first gig to start receiving bookings.'
                    : 'No gigs available yet. Check back soon.'}
                </p>
                {user.role === 'freelancer' && (
                  <a className="inline-link" href="#create-gig">
                    Create a gig
                  </a>
                )}
              </div>
            )}
            <section className="card record-section" id="bookings">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PROJECT ACTIVITY</p>
                  <h2>Bookings</h2>
                </div>
                <span className="count-label">
                  {data.bookings.length}{' '}
                  {data.bookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>
              {!data.bookings.length && (
                <p className="record-empty">
                  {user.role === 'client'
                    ? 'Your bookings will appear here once you book a gig.'
                    : 'New bookings will appear here when clients book your gigs.'}
                </p>
              )}
              <ul className="records">
                {data.bookings.map((booking) => (
                  <li
                    key={booking._id}
                    id={`booking-${booking._id}`}
                    tabIndex={-1}
                    className={
                      highlightedBooking === booking._id
                        ? 'booking-highlight'
                        : undefined
                    }
                  >
                    <div className="record-main">
                      <strong>{booking.gigTitle}</strong>
                      <div className="record-meta">
                        <strong className="amount">
                          {money(booking.amountCents)}
                        </strong>
                        <span className="badge">{booking.status}</span>
                      </div>
                    </div>
                    <BookingReference
                      id={booking._id}
                      booking={booking}
                      expanded={highlightedBooking === booking._id}
                    />
                  </li>
                ))}
              </ul>
            </section>
            <section className="card record-section" id="transactions">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PAYMENT RECORDS</p>
                  <h2>Transactions</h2>
                </div>
                <span className="count-label">
                  {data.transactions.length}{' '}
                  {data.transactions.length === 1
                    ? 'transaction'
                    : 'transactions'}
                </span>
              </div>
              {!data.transactions.length && (
                <p className="record-empty">
                  Transactions will appear here after a confirmed booking.
                </p>
              )}
              <ul className="records">
                {data.transactions.map((transaction) => (
                  <li key={transaction._id}>
                    <div className="record-main">
                      <strong className="amount">
                        {money(transaction.amountCents)}
                      </strong>
                      <span className="badge">
                        {transaction.status === 'simulated-paid'
                          ? 'Recorded'
                          : transaction.status}
                      </span>
                    </div>
                    <BookingReference id={transaction.booking} />
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
        {bookingFlow && (
          <BookingFlow
            gig={bookingFlow.gig}
            attempt={bookingFlow.attempt}
            onConfirm={book}
            onClose={() => setBookingFlow(null)}
            onViewBooking={(booking) => {
              setHighlightedBooking(booking._id);
              setBookingFlow(null);
            }}
          />
        )}
        {confirmation && (
          <ConfirmDialog
            {...confirmation}
            onCancel={() => setConfirmation(null)}
            onConfirm={() => {
              const confirm = confirmation.onConfirm;
              setConfirmation(null);
              confirm();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  // Keep the token in memory so reloading or logging out clears the session.
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState('home');
  const [registrationRole, setRegistrationRole] = useState('client');
  function openRegistration(role = 'client') {
    setRegistrationRole(role);
    setPage('register');
  }
  const logout = useCallback((message) => {
    setSession(null);
    setNotice(message);
    setPage('login');
  }, []);

  return (
    <div
      className={`app-shell${session ? ' dashboard-shell' : page === 'home' ? ' public-shell' : ' auth-shell'}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand-button"
          aria-label={session ? 'HustleHub+ workspace' : 'HustleHub+ home'}
          onClick={() => {
            if (session) document.getElementById('overview')?.scrollIntoView();
            else setPage('home');
          }}
        >
          <span className="wordmark">
            HustleHub<span>+</span>
          </span>
        </button>
        {!session && (
          <nav aria-label="Main navigation">
            <button className="text-button" onClick={() => setPage('login')}>
              Sign in
            </button>
            <button className="small-button" onClick={() => openRegistration()}>
              Join HustleHub+
            </button>
          </nav>
        )}
      </header>
      <main id="main-content" tabIndex={-1}>
        {session ? (
          <Dashboard session={session} onLogout={logout} />
        ) : page === 'home' ? (
          <PublicHome
            onSignIn={() => setPage('login')}
            onRegister={openRegistration}
          />
        ) : (
          <>
            {notice && <p role="status">{notice}</p>}
            <AuthForm
              key={`${page}-${registrationRole}`}
              initialRegister={page === 'register'}
              initialRole={registrationRole}
              onLogin={(value) => {
                setSession(value);
                setNotice('');
              }}
            />
          </>
        )}
      </main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} HustleHub+</span>
        <span>Freelance marketplace</span>
      </footer>
    </div>
  );
}
