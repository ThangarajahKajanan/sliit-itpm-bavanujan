import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function QuestionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [showQuestionProfile, setShowQuestionProfile] = useState(false);
  const [openCommentProfileId, setOpenCommentProfileId] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  async function fetchDetail() {
    try {
      const { data } = await api.get(`/questions/${id}`);
      setQuestion(data.question);
      setComments(data.comments);
    } catch {
      setError('Failed to load question.');
    } finally {
      setLoading(false);
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    setCommentError('');
    try {
      const { data } = await api.post('/comments', { text: commentText, questionId: id });
      setComments((prev) => [...prev, data]);
      setCommentText('');
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <p className="state-msg">Loading…</p>;
  if (error)   return <p className="error-msg center">{error}</p>;
  if (!question) return null;

  return (
    <div>
      <button className="btn btn-back" onClick={() => navigate(-1)}>← Back</button>

      {/* Question */}
      <div className="detail-card">
        <div className="meta-row">
          <span className="author">{question.author.username}</span>
          {question.author.role && (
            <span className="role-badge">{question.author.role}</span>
          )}
          <button
            type="button"
            className="btn-link"
            onClick={() => setShowQuestionProfile((prev) => !prev)}
          >
            {showQuestionProfile ? 'Hide Profile' : 'View Profile'}
          </button>
          <span className="date">{formatDate(question.createdAt)}</span>
        </div>
        {showQuestionProfile && (
          <div className="profile-preview">
            <p><strong>Username:</strong> {question.author.username || '-'}</p>
            <p><strong>Full Name:</strong> {question.author.name || '-'}</p>
            <p><strong>Role:</strong> {question.author.role || '-'}</p>
            <p><strong>Phone:</strong> {question.author.phone || '-'}</p>
            <p><strong>IT Number:</strong> {question.author.itNumber || '-'}</p>
            {/* {question.author._id !== user?.id && (
              <button
                type="button"
                className="btn btn-secondary btn-chat"
                onClick={() => navigate(`/inbox?userId=${question.author._id}`)}
              >
                Chat in Inbox
              </button>
            )} */}
          </div>
        )}
        <p className="detail-text">{question.text}</p>
      </div>

      {/* Comments */}
      <div className="comments-section">
        <p className="section-label">
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </p>

        {/* Comment Form */}
        <form className="comment-form" onSubmit={handleComment}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment…"
            rows={2}
            required
          />
          {commentError && <p className="error-msg">{commentError}</p>}
          <button type="submit" className="btn btn-secondary" disabled={posting}>
            {posting ? 'Posting…' : 'Add Comment'}
          </button>
        </form>

        {/* Comment List */}
        {comments.length === 0 ? (
          <p className="state-msg">No comments yet. Start the discussion!</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="comment-card">
              <div className="meta-row">
                <span className="author">{c.author.username}</span>
                {c.author.role && <span className="role-badge">{c.author.role}</span>}
                <button
                  type="button"
                  className="btn-link"
                  onClick={() =>
                    setOpenCommentProfileId((prev) => (prev === c._id ? null : c._id))
                  }
                >
                  {openCommentProfileId === c._id ? 'Hide Profile' : 'View Profile'}
                </button>
                <span className="date">{formatDate(c.createdAt)}</span>
              </div>
              {openCommentProfileId === c._id && (
                <div className="profile-preview">
                  <p><strong>Username:</strong> {c.author.username || '-'}</p>
                  <p><strong>Full Name:</strong> {c.author.name || '-'}</p>
                  <p><strong>Role:</strong> {c.author.role || '-'}</p>
                  <p><strong>Phone:</strong> {c.author.phone || '-'}</p>
                  <p><strong>IT Number:</strong> {c.author.itNumber || '-'}</p>
                  {/* {c.author._id !== user?.id && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-chat"
                      onClick={() => navigate(`/inbox?userId=${c.author._id}`)}
                    >
                      Chat in Inbox
                    </button>
                  )} */}
                </div>
              )}
              <p className="comment-text">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
