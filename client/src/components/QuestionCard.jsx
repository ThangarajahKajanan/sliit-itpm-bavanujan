import { useState } from 'react';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function QuestionCard({ question, currentUserId, onDelete, onEdit, onView, onChat }) {
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(question.text);
  const [saving,   setSaving]   = useState(false);
  const [editError, setEditError] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const isAuthor = currentUserId && question.author._id === currentUserId;

  async function handleSave() {
    if (!editText.trim()) return;
    setSaving(true);
    setEditError('');
    try {
      await onEdit(question._id, editText.trim());
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setEditText(question.text);
    setEditError('');
  }

  return (
    <div className="question-card">
      {/* Header: author info + action buttons */}
      <div className="card-header">
        <div className="meta-row">
          <span className="author">{question.author.username}</span>
          {question.author.role && (
            <span className="role-badge">{question.author.role}</span>
          )}
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowProfile((prev) => !prev)}
          >
            {showProfile ? 'Hide Profile' : 'View Profile'}
          </button>
          <span className="date">{formatDate(question.createdAt)}</span>
        </div>
        {isAuthor && !editing && (
          <div className="card-actions">
            <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn-ghost danger" onClick={() => onDelete(question._id)}>Delete</button>
          </div>
        )}
      </div>

      {/* Body */}
      {editing ? (
        <div className="edit-area">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
          />
          {editError && <p className="error-msg">{editError}</p>}
          <div className="edit-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-ghost-sm" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="card-text" onClick={onView} role="button" tabIndex={0}
           onKeyDown={(e) => e.key === 'Enter' && onView()}>
          {question.text}
        </p>
      )}

      {/* Footer */}
      {!editing && (
        <div className="card-footer">
          <button className="btn-link" onClick={onView}>
            View comments →
          </button>
        </div>
      )}

      {showProfile && (
        <div className="profile-preview">
          <p><strong>Username:</strong> {question.author.username || '-'}</p>
          <p><strong>Full Name:</strong> {question.author.name || '-'}</p>
          <p><strong>Role:</strong> {question.author.role || '-'}</p>
          <p><strong>Phone:</strong> {question.author.phone || '-'}</p>
          <p><strong>IT Number:</strong> {question.author.itNumber || '-'}</p>
          {/* {question.author._id !== currentUserId && (
            <button
              type="button"
              className="btn btn-secondary btn-chat"
              onClick={() => onChat?.(question.author._id)}
            >
              Chat in Inbox
            </button>
          )} */}
        </div>
      )}
    </div>
  );
}
