// ── Elections.js ─────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getElections, createElection } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Elections() {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ title: '', startTime: '', endTime: '' });

  useEffect(() => {
    getElections().then(r => setElections(r.data.elections || [])).catch(() => toast.error('Failed to load elections'));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createElection(form);
      toast.success('Election created!');
      setShowForm(false);
      getElections().then(r => setElections(r.data.elections || []));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create election'); }
  };

  const statusColor = { active: 'badge-green', closed: 'badge-blue', draft: 'badge-amber' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Elections</h2>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Create Election</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>New Election</div>
          <form onSubmit={handleCreate}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input className="form-input" type="datetime-local" required value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input className="form-input" type="datetime-local" required value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" type="submit">Create</button>
            <button className="btn btn-sm" style={{ marginLeft: 8 }} type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {elections.map(e => (
                <tr key={e._id}>
                  <td><b>{e.title}</b></td>
                  <td>{new Date(e.startTime).toLocaleDateString()}</td>
                  <td>{new Date(e.endTime).toLocaleDateString()}</td>
                  <td><span className={`badge ${statusColor[e.status] || 'badge-blue'}`}>{e.status.toUpperCase()}</span></td>
                  <td>
                    <Link to={`/results/${e._id}`} className="btn btn-sm">Results</Link>
                    <Link to="/candidates" className="btn btn-sm" style={{ marginLeft: 6 }}>Candidates</Link>
                  </td>
                </tr>
              ))}
              {elections.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>No elections yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default Elections;
