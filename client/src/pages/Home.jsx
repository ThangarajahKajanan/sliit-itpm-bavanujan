import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import QuestionCard from '../components/QuestionCard';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    try {
      const { data } = await api.get('/questions');
      setQuestions(data);
    } catch {
      setFetchError('Failed to load questions. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setPosting(true);
    setPostError('');
    try {
      const { data } = await api.post('/questions', { text: newQuestion });
      setQuestions([data, ...questions]);
      setNewQuestion('');
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to post question.');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this question? All its comments will also be removed.')) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch {
      alert('Failed to delete question.');
    }
  }

  async function handleEdit(id, newText) {
    const { data } = await api.put(`/questions/${id}`, { text: newText });
    setQuestions((prev) => prev.map((q) => (q._id === id ? data : q)));
  }

  return (
    <div>
      {/* Post Question Box */}
      <div className="post-box">
        <h3>Ask a Question</h3>
        <form onSubmit={handlePost}>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What would you like to ask the university community?"
            rows={3}
            required
          />
          {postError && <p className="error-msg">{postError}</p>}
          <div className="post-box-footer">
            <button type="submit" className="btn btn-primary" disabled={posting}>
              {posting ? 'Posting…' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <p className="section-label">Recent Questions</p>

      {loading && <p className="state-msg">Loading questions…</p>}
      {fetchError && <p className="error-msg">{fetchError}</p>}

      {!loading && !fetchError && questions.length === 0 && (
        <p className="state-msg">No questions yet — be the first to ask!</p>
      )}

      {questions.map((q) => (
        <QuestionCard
          key={q._id}
          question={q}
          currentUserId={user?.id}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onView={() => navigate(`/questions/${q._id}`)}
          onChat={(userId) => navigate(`/inbox?userId=${userId}`)}
        />
      ))}
    </div>
  );
}
