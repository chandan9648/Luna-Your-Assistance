import React, { useEffect, useRef, useState } from 'react';
import './NewChatModal.css';

const NewChatModal = ({ open, onClose, onSubmit, submitting = false }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setMessage('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onSubmit({ title: t, message: message.trim() });
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="new-chat-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <header className="modal-header">
          <h2 id="new-chat-title">Start a new chat</h2>
        </header>
        <form onSubmit={handleSubmit} className="modal-body">
          <label htmlFor="chat-title" className="modal-label">Title</label>
          <input
            id="chat-title"
            ref={inputRef}
            className="modal-input"
            placeholder="Give your chat a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn primary" disabled={submitting || !title.trim()}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChatModal;
