import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  title,
  description,
  amount,
  destructive,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const cancelRef = useRef(null);
  useEffect(() => {
    const trigger = document.activeElement;
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    cancelRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="dialog-top">
        <button
          className="secondary"
          aria-label="Close confirmation"
          onClick={onCancel}
        >
          Close
        </button>
      </div>
      <h2 id="confirmation-title">{title}</h2>
      <p id="confirmation-description" className="muted">
        {description}
      </p>
      {amount && (
        <div className="confirmation-amount">
          <span>Total</span>
          <strong>{amount}</strong>
        </div>
      )}
      <div className="actions dialog-actions">
        <button ref={cancelRef} className="secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={destructive ? 'danger-solid' : undefined}
          onClick={onConfirm}
        >
          {destructive ? 'Remove listing' : 'Confirm booking'}
        </button>
      </div>
    </dialog>
  );
}
