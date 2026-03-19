import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'voter' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🗳</div>
          <div className="auth-title">Create Account</div>
          <div className="auth-sub">Join the VoteChain platform</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required minLength={6} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" />
          </div>
          <div className="form-group">
            <label className="form-label">Register as</label>
            <select className="form-input" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="voter">Voter</option>
              <option value="candidate">Candidate</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--blue)' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
