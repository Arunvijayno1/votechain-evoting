import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getCandidates, getElections, applyAsCandidate } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CandidateList() {
  const { user } = useAuth();
  const [cands, setCands] = useState([]);
  const [elecs, setElecs] = useState([]);
  const [show,  setShow]  = useState(false);
  const [form,  setForm]  = useState({ electionId:'', party:'', symbol:'', statement:'' });

  useEffect(() => {
    getCandidates().then(r => setCands(r.data.candidates || []));
    getElections().then(r => setElecs(r.data.elections?.filter(e=>e.status==='active') || []));
  }, []);

  const apply = async (e) => {
    e.preventDefault();
    try { await applyAsCandidate(form); toast.success('Application submitted'); setShow(false); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const sc = { approved:'badge-green', pending:'badge-amber', rejected:'badge-red' };

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--white)' }}>Candidates</div>
        {user.role==='candidate' && <button className="btn btn-primary" onClick={()=>setShow(!show)}>Apply for election</button>}
      </div>

      {show && (
        <div className="card" style={{ marginBottom:18 }}>
          <div className="card-title" style={{ marginBottom:14 }}>Apply as candidate</div>
          <form onSubmit={apply}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Election</label>
                <select className="form-input" required value={form.electionId} onChange={e=>setForm({...form,electionId:e.target.value})}>
                  <option value="">— Select —</option>
                  {elecs.map(e=><option key={e._id} value={e._id}>{e.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Party name</label>
                <input className="form-input" required value={form.party} onChange={e=>setForm({...form,party:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Campaign statement</label>
              <textarea className="form-input" rows={3} maxLength={500} value={form.statement} onChange={e=>setForm({...form,statement:e.target.value})} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary" type="submit">Submit</button>
              <button className="btn" type="button" onClick={()=>setShow(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Party</th><th>Election</th><th>Status</th></tr></thead>
            <tbody>
              {cands.map(c=>(
                <tr key={c._id}>
                  <td><b style={{color:'var(--white)'}}>{c.userId?.name}</b><div style={{fontSize:10,color:'var(--text3)'}}>{c.userId?.email}</div></td>
                  <td>{c.party}</td>
                  <td style={{fontSize:11}}>{c.electionId?.title||'—'}</td>
                  <td><span className={`badge ${sc[c.approvalStatus]}`}>{c.approvalStatus}</span></td>
                </tr>
              ))}
              {!cands.length && <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text3)',padding:28}}>No candidates</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
