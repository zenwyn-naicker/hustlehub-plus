import React, { useEffect, useRef, useState } from 'react';

const money = (cents) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(
    cents / 100
  );

export default function BookingFlow({
  gig,
  attempt,
  onConfirm,
  onClose,
  onViewBooking,
}) {
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const submittingRef = useRef(false);
  const [step, setStep] = useState(attempt ? 2 : 0);
  const [requirements, setRequirements] = useState(attempt?.requirements || '');
  const [acknowledged, setAcknowledged] = useState(Boolean(attempt));
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(Boolean(attempt));
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    dialogRef.current.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  function review(event) {
    event.preventDefault();
    const brief = requirements.trim();
    const unsupportedText =
      /[<>]/.test(brief) ||
      [...brief].some((character) => {
        const code = character.charCodeAt(0);
        return code === 127 || (code < 32 && ![9, 10, 13].includes(code));
      });
    if (brief.length < 10 || brief.length > 2000 || unsupportedText) {
      setError(
        'Describe your project in 10–2000 characters, using plain text without markup.'
      );
      return;
    }
    setRequirements(brief);
    setAcknowledged(false);
    setError('');
    setStep(2);
  }

  async function confirm(event) {
    event.preventDefault();
    if (submittingRef.current || !acknowledged || unavailable) return;
    submittingRef.current = true;
    setBusy(true);
    setLocked(true);
    setError('');
    try {
      const confirmed = await onConfirm(gig, requirements);
      setResult(confirmed);
      setStep(3);
    } catch (failure) {
      const definitive = failure.status >= 400 && failure.status < 500;
      setLocked(!definitive);
      setUnavailable(failure.status === 404 || failure.status === 409);
      setError(
        definitive
          ? [failure.message, failure.fields].filter(Boolean).join(' ')
          : 'We could not confirm the result of your request. Retry to check the same booking without creating a duplicate.'
      );
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  const headings = [
    'Review this service',
    'Tell us about your project',
    'Review your booking',
    'Your booking is confirmed',
  ];

  return (
    <dialog
      ref={dialogRef}
      className="booking-dialog"
      aria-labelledby="booking-flow-heading"
      onCancel={(event) => {
        event.preventDefault();
        if (!submittingRef.current) onClose();
      }}
    >
      <div className="booking-flow-top">
        <span>Book a service</span>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {step < 3 && (
        <ol className="booking-steps" aria-label="Booking progress">
          {['Service', 'Project details', 'Review'].map((label, index) => (
            <li
              key={label}
              aria-current={step === index ? 'step' : undefined}
              className={step > index ? 'step-complete' : undefined}
            >
              <span aria-hidden="true">{index + 1}.</span> {label}
            </li>
          ))}
        </ol>
      )}
      <div className="booking-flow-body">
        <div className="booking-flow-content">
          <h2 id="booking-flow-heading" ref={headingRef} tabIndex={-1}>
            {headings[step]}
          </h2>
          {step < 3 && (
            <div className="booking-mobile-total">
              <span>Total</span>
              <strong>{money(gig.priceCents)}</strong>
            </div>
          )}
          {error && (
            <p className="notice notice-error" role="alert">
              {error}
            </p>
          )}
          {step === 0 && (
            <>
              <p className="muted">
                Read the service description before sharing your project
                requirements.
              </p>
              <h3>{gig.title}</h3>
              <p className="description booking-service-description">
                {gig.description}
              </p>
              <p className="booking-next-note">
                Next, you’ll describe what you need. A booking is only created
                when you confirm on the final step.
              </p>
              <div className="booking-flow-actions">
                <button type="button" className="secondary" onClick={onClose}>
                  Back to services
                </button>
                <button type="button" onClick={() => setStep(1)}>
                  Continue to project details
                </button>
              </div>
            </>
          )}
          {step === 1 && (
            <form onSubmit={review}>
              <p className="muted">
                Give the freelancer enough detail to understand the work you
                need.
              </p>
              <label htmlFor="booking-requirements">Project requirements</label>
              <textarea
                id="booking-requirements"
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                required
                minLength={10}
                maxLength={2000}
                rows={7}
                aria-describedby="booking-brief-hint booking-brief-count"
                placeholder="What do you need created or completed? Include the purpose, scope and any details the freelancer should know."
              />
              <div className="booking-brief-meta">
                <p id="booking-brief-hint">
                  Use 10–2000 characters. Don’t include passwords or payment
                  details.
                </p>
                <span id="booking-brief-count">{requirements.length}/2000</span>
              </div>
              <div className="booking-flow-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setError('');
                    setStep(0);
                  }}
                >
                  Back
                </button>
                <button type="submit">Review booking</button>
              </div>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={confirm} aria-busy={busy}>
              <p className="muted">
                Check your service, requirements and total before confirming.
              </p>
              <div className="booking-review-block">
                <div className="booking-review-heading">
                  <h3>Selected service</h3>
                  {!locked && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setStep(0)}
                    >
                      Review service
                    </button>
                  )}
                </div>
                <strong>{gig.title}</strong>
                <p className="description">{gig.description}</p>
              </div>
              <div className="booking-review-block">
                <div className="booking-review-heading">
                  <h3>Project requirements</h3>
                  {!locked && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setError('');
                        setStep(1);
                      }}
                    >
                      Edit requirements
                    </button>
                  )}
                </div>
                <p className="description">{requirements}</p>
              </div>
              <p className="payment-disclosure">
                Your project requirements will be shared with the freelancer
                when you confirm.
              </p>
              <label className="booking-acknowledgement">
                <input
                  type="checkbox"
                  required
                  checked={acknowledged}
                  disabled={busy || locked}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                <span>
                  I have reviewed the service, project requirements and total.
                </span>
              </label>
              {locked && !busy && (
                <p className="booking-next-note">
                  Your submitted details are kept unchanged while we check the
                  result. Reopening this service will let you retry this same
                  booking.
                </p>
              )}
              <div role="status" className="booking-submit-status">
                {busy
                  ? 'Confirming your booking. Please keep this window open…'
                  : ''}
              </div>
              <div className="booking-flow-actions">
                {!locked && (
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => {
                      setError('');
                      setStep(1);
                    }}
                  >
                    Back
                  </button>
                )}
                {unavailable ? (
                  <button type="button" onClick={onClose}>
                    Return to services
                  </button>
                ) : (
                  <button type="submit" disabled={busy || !acknowledged}>
                    {busy
                      ? 'Confirming booking…'
                      : locked
                        ? 'Retry confirmation'
                        : 'Confirm booking'}
                  </button>
                )}
              </div>
            </form>
          )}
          {step === 3 && result && (
            <>
              <p className="muted">
                Your booking and transaction have been recorded. Your project
                requirements are now available to the freelancer.
              </p>
              <dl className="booking-receipt">
                <div>
                  <dt>Service</dt>
                  <dd>{result.booking.gigTitle}</dd>
                </div>
                <div>
                  <dt>Booking reference</dt>
                  <dd className="booking-full-reference">
                    {result.booking._id}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>Confirmed</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{money(result.booking.amountCents)}</dd>
                </div>
              </dl>
              <h3>What happens next?</h3>
              <p className="muted">
                You can find this service and your project brief in Bookings.
                The freelancer can view the same booking in their workspace.
              </p>
              <div className="booking-flow-actions">
                <button type="button" className="secondary" onClick={onClose}>
                  Back to services
                </button>
                <button
                  type="button"
                  onClick={() => onViewBooking(result.booking)}
                >
                  View booking
                </button>
              </div>
            </>
          )}
        </div>
        <aside className="booking-order-summary" aria-label="Booking total">
          <h3>Booking summary</h3>
          <p>{result?.booking.gigTitle || gig.title}</p>
          <div>
            <span>Service price</span>
            <strong>
              {money(result?.booking.amountCents ?? gig.priceCents)}
            </strong>
          </div>
          <div className="booking-total">
            <span>Total</span>
            <strong>
              {money(result?.booking.amountCents ?? gig.priceCents)}
            </strong>
          </div>
          <small>Prices in South African rand.</small>
        </aside>
      </div>
    </dialog>
  );
}
