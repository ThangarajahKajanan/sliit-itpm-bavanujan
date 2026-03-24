import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['student', 'senior student', 'lecturer'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm]       = useState({ name: '', phone: '', itNumber: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data } = await api.get('/profile');
      setForm({
        name:  data.name  || '',
        phone: data.phone || '',
        itNumber: data.itNumber || '',
        role:  data.role  || '',
      });
    } catch {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      const { data } = await api.put('/profile', form);
      updateUser({
        ...user,
        name:  data.name,
        phone: data.phone,
        itNumber: data.itNumber,
        role:  data.role,
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  if (loading) return <p className="state-msg">Loading profile…</p>;

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
        <div>
          <h2>{user?.username}</h2>
          {user?.role && <span className="role-badge">{user.role}</span>}
        </div>
      </div>

      <h3 className="section-label" style={{ marginTop: '1.5rem' }}>Edit Profile</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name <span className="optional">(optional)</span></label>
          <input
            id="name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number <span className="optional">(optional)</span></label>
          <input
            id="phone"
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="e.g. +60 12-345 6789"
          />
        </div>
        <div className="form-group">
          <label htmlFor="itNumber">IT Number <span className="optional">(optional)</span></label>
          <input
            id="itNumber"
            type="text"
            name="itNumber"
            value={form.itNumber}
            onChange={handleChange}
            placeholder="e.g. IT20231234"
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role <span className="optional">(optional)</span></label>
          <select id="role" name="role" value={form.role} onChange={handleChange}>
            <option value="">— Select a role —</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {success && <p className="success-msg">{success}</p>}
        {error   && <p className="error-msg">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
