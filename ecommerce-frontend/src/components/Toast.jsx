import React, { useEffect } from 'react';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        <span style={{ fontSize: '1.25rem' }}>
          {type === 'success' ? '✨' : '⚠️'}
        </span>
        <div>{message}</div>
      </div>
    </div>
  );
}
