import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getCandidates, approveCandidate } from '../services/api';

export default function AdminCandidates() {
  const [candidates, setCands] = useState([]);
  const [filter,     setFilter]= useState('pending');

  const load = () => getCandidates().then(r => setCands(r.data.candidates || [])).catch(() => toast.error('Failed'));
  useEffect(() => { load(); }, []);

  const handle = async (id, status) => {
    try { await approveCandidate(id, status); toast.success(`Candidate ${status}`); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusColor = { approved:'badge-green', pending:'badge-amber', rejected:'badge-red' };
  const filtered = filter === 'all' ? candidates : candidates.filter(c => c.approvalStatus === filter);
  const pendingCount = candidates.filter(c => c.approvalStatus === 'pending').length;

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 20 }}>
        <div className="section-title" style={{ margin: 0 }}>Candidate Approvals {pendingCount > 0 && <span className="badge badge-red" style={{ marginLeft: 8 }}>{pendingCount}</span>}</div>
        <div style={{ display:'flex', gap:8 }}>
          {['pending','approved','rejected','all'].map(f => (
            <button key={f} className={`btn btn-sm${filter===f?' btn-gold':''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Candidate</th><th>Party</th><th>Election</th><th>Statement</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id}>
                  <td><b>{c.userId?.name}</b><div style={{fontSize:10,color:'var(--text3)'}}>{c.userId?.email}</div></td>
                  <td>{c.symbol} {c.party}</td>
                  <td style={{fontSize:11,maxWidth:140}}>{c.electionId?.title}</td>
                  <td style={{fontSize:11,maxWidth:160,color:'var(--text2)'}}>{c.statement?.slice(0,60)}{c.statement?.length>60?'…':''}</td>
                  <td><span className={`badge ${statusColor[c.approvalStatus]}`}>{c.approvalStatus}</span></td>
                  <td>
                    {c.approvalStatus === 'pending' ? (
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-sm btn-green" onClick={() => handle(c._id,'approved')}>✓ Approve</button>
                        <button className="btn btn-sm btn-red"   onClick={() => handle(c._id,'rejected')}>✗ Reject</button>
                      </div>
                    ) : <span style={{color:'var(--text3)',fontSize:11}}>—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{textAlign:'center',color:'var(--text3)',padding:28}}>No {filter} candidates</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
