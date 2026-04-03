import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getMyVotes } from '../services/api';

export default function MyVotes() {
  const [votes, setV] = useState([]);
  const [load, setL]  = useState(true);
  useEffect(() => { getMyVotes().then(r=>setV(r.data.votes||[])).catch(()=>toast.error('Failed')).finally(()=>setL(false)); },[]);
  if (load) return <div className="loading-screen">Loading</div>;
  return (
    <div className="fade-in">
      <div style={{ fontSize:18, fontWeight:700, color:'var(--white)', marginBottom:22 }}>My Vote History</div>
      {!votes.length ? (
        <div className="card"><div className="empty-state"><div style={{fontSize:32,opacity:.2,marginBottom:8}}>□</div><div>No votes cast yet</div></div></div>
      ) : votes.map(v=>(
        <div key={v._id} className="card" style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--white)' }}>{v.electionId?.title}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
                Voted for: <b>{v.candidateId?.userId?.name}</b>{v.candidateId?.party && <span style={{color:'var(--text3)'}}> — {v.candidateId.party}</span>}
              </div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{new Date(v.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
              <span className="badge badge-green">✓ Recorded</span>
              {v.blockIndex!=null && <span className="badge badge-white">Block #{v.blockIndex}</span>}
            </div>
          </div>
          <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>Vote hash (SHA-256)</div>
          <div className="hash-box">{v.voteHash}</div>
        </div>
      ))}
    </div>
  );
}
