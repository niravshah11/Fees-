'use client';

import { useEffect, useState } from 'react';

const TRASH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/** Deleting a campus is permanent and cascades across the whole app (Master data, the Schools
 *  list, Rights' campus dropdown) — the server action already refuses it unless the campus is
 *  completely empty, but the user still asked for an explicit "are you sure, here's what happens"
 *  step before it fires, not a bare button that submits on the first click. Uses the design
 *  system's own .fh-modal--confirm pattern (vendor docs/index.html's "Confirm dialog demo"). */
export function ConfirmDeleteSchool({
  action,
  code,
  name,
  disabled,
  disabledReason,
}: {
  action: () => Promise<void>;
  code: string;
  name: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className="fh-btn fh-btn--danger fh-btn--sm"
      >
        Delete this campus
      </button>

      {open && (
        <div className="fh-modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="fh-modal fh-modal--confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-school-title"
            aria-describedby="delete-school-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fh-modal__body">
              <span className="fh-modal__badge fh-modal__badge--warning">{TRASH_ICON}</span>
              <h3 className="fh-modal__title" id="delete-school-title">Delete {code}?</h3>
              <p id="delete-school-desc" className="text-sm text-muted">
                <strong>{name}</strong> ({code}) will be permanently removed — from Master data,
                the Schools list, and every Rights grant scoped to it. This can't be undone.
              </p>
            </div>
            <div className="fh-modal__footer">
              <button type="button" className="fh-btn" onClick={() => setOpen(false)}>Cancel</button>
              <form action={action}>
                <button type="submit" className="fh-btn fh-btn--danger">Delete campus</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
