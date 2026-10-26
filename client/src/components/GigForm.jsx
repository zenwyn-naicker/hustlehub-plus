/*Code Attribution: */
/**************************************************************************************************************
 * Author: React Contributors
 * Date: 2026
 * Title: React and React DOM
 * Type: [Source Code]
 * Available at: <https://github.com/react/react> [Accessed 15 September 2026]
 **************************************************************************************************************/

import React, { useId, useState } from 'react';

export default function GigForm({
  gig,
  onSave,
  onCancel,
  busy,
  headingId,
  saveError,
}) {
  const [error, setError] = useState('');
  const priceHintId = useId();

  function submit(event) {
    event.preventDefault();
    if (busy) return;

    const form = Object.fromEntries(new FormData(event.currentTarget));
    const priceCents = Math.round(Number(form.price) * 100);

    if (
      !Number.isSafeInteger(priceCents) ||
      priceCents < 100 ||
      priceCents > 100000000
    ) {
      setError('Enter a price between R1.00 and R1,000,000.00.');
      return;
    }

    setError('');
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      priceCents,
    });
  }

  return (
    <section className="card gig-form">
      <p className="eyebrow">
        {gig ? 'REFINE YOUR LISTING' : 'SHARE YOUR EXPERTISE'}
      </p>
      <h2 id={headingId}>{gig ? 'Edit gig' : 'Create a gig'}</h2>
      <p className="muted form-description">
        A clear title, useful details and a fair price help clients choose your
        service.
      </p>
      <form onSubmit={submit}>
        <label>
          Title
          <input
            name="title"
            required
            minLength={3}
            maxLength={100}
            defaultValue={gig?.title || ''}
            disabled={busy}
            placeholder="e.g. A custom logo for your business"
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            required
            minLength={3}
            maxLength={1000}
            defaultValue={gig?.description || ''}
            disabled={busy}
            placeholder="Describe what you offer and what the client will receive."
          />
        </label>
        <label>
          Price (ZAR)
          <input
            name="price"
            type="number"
            min="1"
            max="1000000"
            step="0.01"
            required
            defaultValue={gig ? gig.priceCents / 100 : ''}
            disabled={busy}
            aria-describedby={priceHintId}
          />
        </label>
        <p className="field-hint" id={priceHintId}>
          Set your service price in South African rand.
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {saveError && (
          <p role="alert" className="form-error">
            {saveError}
          </p>
        )}
        <div className="actions form-actions">
          <button disabled={busy}>
            {busy ? 'Saving…' : gig ? 'Save changes' : 'Publish gig'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="secondary"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
