import React, { useEffect, useRef, useCallback } from "react";

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  const cancelRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    cancelRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="confirm-overlay" onMouseDown={onCancel} role="presentation">
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p id="confirm-title">{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel} ref={cancelRef}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
