import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'voter' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      toast.success('Account created successfully');
      navigate(form.role === 'voter' ? '/face-register' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-icon">⊡</div>
          <div className="auth-title">Create Account</div>
          <div className="auth-sub">Join the VoteChain platform</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your legal name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" required value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Register As</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['voter','candidate'].map(r => (
                <div key={r} onClick={() => setForm({ ...form, role: r })}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${form.role === r ? 'var(--gold)' : 'var(--border2)'}`, background: form.role === r ? 'var(--gold-bg)' : 'var(--bg3)', cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{r === 'voter' ? '🗳' : '👤'}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: form.role === r ? 'var(--gold2)' : 'var(--text2)', textTransform: 'capitalize' }}>{r}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-gold btn-lg" style={{ width: '100%' }} type="submit" disabled={loading}>
            {loading ? 'Creating Account…' : 'Create Account →'}
          </button>
        </form>

        {form.role === 'voter' && (
          <div style={{ marginTop: 16, padding: 12, background: 'var(--gold-bg)', borderRadius: 8, fontSize: 11, color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)' }}>
            ⚠ After registering, you must complete face registration before you can vote.
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
