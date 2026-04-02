import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getElections, createElection, updateElectionStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Elections() {
  const { user }  = useAuth();
  const [elections, setElecs]  = useState([]);
  const [showForm,  setForm]   = useState(false);
  const [form,      setF]      = useState({ title:'', startTime:'', endTime:'' });
  const [loading,   setLoading] = useState(false);

  const load = () => getElections().then(r => setElecs(r.data.elections || [])).catch(() => toast.error('Failed to load'));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createElection({ ...form, status: 'active' });
      toast.success('Election created!');
      setForm(false); setF({ title:'', startTime:'', endTime:'' }); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleClose = async (id) => {
    if (!window.confirm('Close this election? This cannot be undone.')) return;
    try { await updateElectionStatus(id, 'closed'); toast.success('Election closed'); load(); }
    catch { toast.error('Failed'); }
  };

  const statusColor = { active: 'badge-green', closed: 'badge-amber', draft: 'badge-gold' };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="section-title" style={{ margin: 0 }}>Elections</div>
        {user.role === 'admin' && <button className="btn btn-gold" onClick={() => setForm(!showForm)}>+ Create Election</button>}
      </div>

      {showForm && (
        <div className="card-gold" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>New Election</div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Election Title</label>
              <input className="form-input" required value={form.title} onChange={e => setF({...form, title: e.target.value})} placeholder="e.g. General Election 2025" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Date & Time</label>
                <input className="form-input" type="datetime-local" required value={form.startTime} onChange={e => setF({...form, startTime: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time</label>
                <input className="form-input" type="datetime-local" required value={form.endTime} onChange={e => setF({...form, endTime: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-gold" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Election'}</button>
              <button className="btn" type="button" onClick={() => setForm(false)}>Cancel</button>
            </div>
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
                  <td style={{ color: 'var(--text2)' }}>{new Date(e.startTime).toLocaleString()}</td>
                  <td style={{ color: 'var(--text2)' }}>{new Date(e.endTime).toLocaleString()}</td>
                  <td><span className={`badge ${statusColor[e.status]}`}>{e.status}</span></td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/results/${e._id}`} className="btn btn-sm">Results</Link>
                    {user.role === 'admin' && e.status === 'active' && (
                      <button className="btn btn-sm btn-red" onClick={() => handleClose(e._id)}>Close</button>
                    )}
                  </td>
                </tr>
              ))}
              {elections.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text3)', padding: 32 }}>No elections yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
