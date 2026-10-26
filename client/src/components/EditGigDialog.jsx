/*Code Attribution: */
/**************************************************************************************************************
 * Author: React Contributors
 * Date: 2026
 * Title: React and React DOM
 * Type: [Source Code]
 * Available at: <https://github.com/react/react> [Accessed 15 September 2026]
 **************************************************************************************************************/

import React, { useEffect, useRef } from 'react';
import GigForm from './GigForm.jsx';

export default function EditGigDialog({ gig, busy, error, onSave, onCancel }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="edit-gig-dialog"
      aria-labelledby="edit-gig-title"
      onCancel={event => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <GigForm gig={gig} headingId="edit-gig-title" busy={busy} saveError={error} onSave={onSave} onCancel={onCancel} />
    </dialog>
  );
}
