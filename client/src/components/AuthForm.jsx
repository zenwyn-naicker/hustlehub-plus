/*Code Attribution: */
/**************************************************************************************************************
 * Author: React Contributors
 * Date: 2026
 * Title: React and React DOM
 * Type: [Source Code]
 * Available at: <https://github.com/react/react> [Accessed 15 September 2026]
 **************************************************************************************************************/

import React, { useState } from 'react';
import { api } from '../api.js';

export default function AuthForm({
  onLogin,
  initialRegister = false,
  initialRole = 'client',
}) {
  const [register, setRegister] = useState(initialRegister);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const body = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setMessage('');

    try {
      if (register) {
        await api('/auth/register', { method: 'POST', body });
        setRegister(false);
        setShowPassword(false);
        setMessageType('success');
        setMessage('Account created. Log in to continue.');
      } else {
        onLogin(await api('/auth/login', { method: 'POST', body }));
      }
    } catch (error) {
      setMessageType('error');
      setMessage([error.message, error.fields].filter(Boolean).join(' '));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth" aria-labelledby="auth-heading">
      <p className="eyebrow">
        {register ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}
      </p>
      <h1 id="auth-heading" className="auth-title">
        {register ? 'Create your account' : 'Sign in to HustleHub+'}
      </h1>
      <p className="auth-description">
        {register
          ? 'A place to hire talent or share your skills.'
          : 'Enter your details to access your workspace.'}
      </p>
      {message && (
        <p
          className={`auth-message auth-message--${messageType}`}
          role="status"
          aria-live={messageType === 'error' ? 'assertive' : 'polite'}
        >
          {message}
        </p>
      )}
      <form onSubmit={submit} aria-busy={busy}>
        {register && (
          <label>
            Name
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              autoComplete="name"
              disabled={busy}
            />
          </label>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={busy}
          />
        </label>
        <label htmlFor="auth-password">Password</label>
        <div className="auth-password">
          <input
            id="auth-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={register ? 12 : undefined}
            autoComplete={register ? 'new-password' : 'current-password'}
            disabled={busy}
            aria-describedby={register ? 'password-hint' : undefined}
          />
          <button
            type="button"
            className="auth-reveal"
            disabled={busy}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-controls="auth-password"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {register && (
          <>
            <p className="muted auth-hint" id="password-hint">
              Use at least 12 characters, including an uppercase letter, a
              lowercase letter, a number and a symbol.
            </p>
            <label>
              Role
              <select name="role" defaultValue={initialRole} disabled={busy}>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </label>
          </>
        )}
        <button className="auth-submit" disabled={busy}>
          {busy
            ? register
              ? 'Creating account…'
              : 'Logging in…'
            : register
              ? 'Register'
              : 'Log in'}
        </button>
      </form>
      <div className="auth-switch">
        <span>
          {register ? 'Already have an account?' : 'New to HustleHub+?'}
        </span>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={() => {
            setRegister(!register);
            setMessage('');
            setShowPassword(false);
          }}
        >
          {register ? 'Use existing account' : 'Create account'}
        </button>
      </div>
    </section>
  );
}
