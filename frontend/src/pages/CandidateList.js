import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getCandidates, getElections, applyAsCandidate } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CandidateList() {
  const { user }  = useAuth();
  const [candidates, setCands] = useState([]);
  const [elections,  setElecs] = useState([]);
  const [showForm,   setForm]  = useState(false);
  const [form, setF] = useState({ electionId:'', party:'', symbol:'🌟', statement:'' });

  useEffect(() => {
    getCandidates().then(r => setCands(r.data.candidates || []));
    getElections().then(r => setElecs(r.data.elections?.filter(e => e.status === 'active') || []));
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try { await applyAsCandidate(form); toast.success('Application submitted — awaiting admin approval'); setForm(false); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusColor = { approved:'badge-green', pending:'badge-amber', rejected:'badge-red' };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="section-title" style={{ margin: 0 }}>Candidates</div>
        {user.role === 'candidate' && <button className="btn btn-gold" onClick={() => setForm(!showForm)}>Apply for Election</button>}
      </div>
      {showForm && (
        <div className="card-gold" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>Apply as Candidate</div>
          <form onSubmit={handleApply}>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Election</label>
                <select className="form-input" required value={form.electionId} onChange={e => setF({...form, electionId:e.target.value})}>
                  <option value="">— Select —</option>
                  {elections.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Party Name</label>
                <input className="form-input" required value={form.party} onChange={e => setF({...form, party:e.target.value})} />
              </div>
            </div>
            <div className="form-group"><label className="form-label">Campaign Statement</label>
              <textarea className="form-input" rows={3} value={form.statement} onChange={e => setF({...form, statement:e.target.value})} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-gold" type="submit">Submit Application</button>
              <button className="btn" type="button" onClick={() => setForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Party</th><th>Election</th><th>Status</th></tr></thead>
            <tbody>
              {candidates.map(c => (
                <tr key={c._id}>
                  <td><b>{c.userId?.name}</b><div style={{fontSize:10,color:'var(--text3)'}}>{c.userId?.email}</div></td>
                  <td>{c.symbol} {c.party}</td>
                  <td style={{fontSize:11}}>{c.electionId?.title || '—'}</td>
                  <td><span className={`badge ${statusColor[c.approvalStatus]}`}>{c.approvalStatus}</span></td>
                </tr>
              ))}
              {candidates.length === 0 && <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text3)',padding:28}}>No candidates</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
