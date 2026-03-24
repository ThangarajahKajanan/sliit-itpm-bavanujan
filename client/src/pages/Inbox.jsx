import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Inbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedUserId = searchParams.get('userId') || '';

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [text, setText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchThread(selectedUserId);
    } else {
      setMessages([]);
      setPartner(null);
    }
  }, [selectedUserId]);

  async function fetchConversations() {
    setLoadingConversations(true);
    try {
      const { data } = await api.get('/inbox/conversations');
      setConversations(data);
    } catch {
      setError('Failed to load conversations.');
    } finally {
      setLoadingConversations(false);
    }
  }

  async function fetchThread(userId) {
    setLoadingThread(true);
    setError('');
    try {
      const { data } = await api.get(`/inbox/thread/${userId}`);
      setPartner(data.partner);
      setMessages(data.messages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages.');
      setMessages([]);
      setPartner(null);
    } finally {
      setLoadingThread(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!selectedUserId || !text.trim()) return;

    setSending(true);
    setError('');
    try {
      const { data } = await api.post('/inbox/message', {
        to: selectedUserId,
        text,
      });
      setMessages((prev) => [...prev, data]);
      setText('');
      fetchConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  const conversationList = useMemo(() => conversations, [conversations]);

  return (
    <div className="inbox-layout">
      <aside className="inbox-sidebar">
        <h3>Inbox</h3>
        {loadingConversations ? (
          <p className="state-msg" style={{ padding: '1rem 0' }}>Loading conversations…</p>
        ) : conversationList.length === 0 ? (
          <p className="state-msg" style={{ padding: '1rem 0' }}>No conversations yet.</p>
        ) : (
          conversationList.map((c) => (
            <button
              key={c.partner._id}
              type="button"
              className={`conversation-item ${selectedUserId === c.partner._id ? 'active' : ''}`}
              onClick={() => setSearchParams({ userId: c.partner._id })}
            >
              <div className="conversation-top">
                <span>@{c.partner.username}</span>
                <small>{formatDate(c.lastAt)}</small>
              </div>
              <p>{c.lastMessage}</p>
            </button>
          ))
        )}
      </aside>

      <section className="inbox-thread">
        {!selectedUserId ? (
          <p className="state-msg">Choose a person to open chat.</p>
        ) : loadingThread ? (
          <p className="state-msg">Loading messages…</p>
        ) : (
          <>
            <div className="thread-header">
              <h3>@{partner?.username}</h3>
              <p>
                Name: {partner?.name || '-'} | Role: {partner?.role || '-'} | Phone: {partner?.phone || '-'} | IT Number: {partner?.itNumber || '-'}
              </p>
            </div>

            <div className="message-list">
              {messages.length === 0 ? (
                <p className="state-msg" style={{ padding: '1rem 0' }}>No messages yet. Say hello.</p>
              ) : (
                messages.map((m) => {
                  const mine = m.sender._id === user?.id;
                  return (
                    <div key={m._id} className={`message-bubble ${mine ? 'mine' : ''}`}>
                      <p>{m.text}</p>
                      <small>{formatDate(m.createdAt)}</small>
                    </div>
                  );
                })
              )}
            </div>

            <form className="message-form" onSubmit={handleSend}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                required
              />
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? 'Sending…' : 'Send'}
              </button>
            </form>
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
      </section>
    </div>
  );
}
