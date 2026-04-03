import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getElections, createElection, updateElectionStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Elections() {
  const { user }  = useAuth();
  const [elections, setE] = useState([]);
  const [showForm, setF]  = useState(false);
  const [form, setFrm]    = useState({ title:'', startTime:'', endTime:'' });
  const [loading, setL]   = useState(false);

  const load = () => getElections().then(r => setE(r.data.elections || [])).catch(() => toast.error('Failed'));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault(); setL(true);
    try { await createElection({ ...form, status:'active' }); toast.success('Election created'); setF(false); setFrm({title:'',startTime:'',endTime:''}); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setL(false); }
  };

  const close = async (id) => {
    if (!window.confirm('Close this election permanently?')) return;
    try { await updateElectionStatus(id, 'closed'); toast.success('Election closed'); load(); }
    catch { toast.error('Failed'); }
  };

  const sc = { active:'badge-green', closed:'badge-amber', draft:'badge-white' };

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--white)' }}>Elections</div>
        {user.role === 'admin' && <button className="btn btn-primary" onClick={() => setF(!showForm)}>+ New election</button>}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom:18 }}>
          <div className="card-title" style={{ marginBottom:16 }}>Create election</div>
          <form onSubmit={create}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" required value={form.title} onChange={e=>setFrm({...form,title:e.target.value})} placeholder="e.g. General Election 2025" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start date & time</label>
                <input className="form-input" type="datetime-local" required value={form.startTime} onChange={e=>setFrm({...form,startTime:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">End date & time</label>
                <input className="form-input" type="datetime-local" required value={form.endTime} onChange={e=>setFrm({...form,endTime:e.target.value})} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'Creating…':'Create'}</button>
              <button className="btn" type="button" onClick={()=>setF(false)}>Cancel</button>
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
                  <td><b style={{color:'var(--white)'}}>{e.title}</b></td>
                  <td style={{color:'var(--text2)'}}>{new Date(e.startTime).toLocaleString()}</td>
                  <td style={{color:'var(--text2)'}}>{new Date(e.endTime).toLocaleString()}</td>
                  <td><span className={`badge ${sc[e.status]}`}>{e.status}</span></td>
                  <td style={{display:'flex',gap:8}}>
                    <Link to={`/results/${e._id}`} className="btn btn-sm">Results</Link>
                    {user.role==='admin' && e.status==='active' && <button className="btn btn-sm btn-red" onClick={()=>close(e._id)}>Close</button>}
                  </td>
                </tr>
              ))}
              {!elections.length && <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text3)',padding:28}}>No elections</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
