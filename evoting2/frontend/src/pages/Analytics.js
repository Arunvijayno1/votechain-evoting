import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAdminStats, getElections, getResults } from '../services/api';

export default function Analytics() {
  const [stats, setStats]   = useState(null);
  const [elecs, setElecs]   = useState([]);
  const [res,   setRes]     = useState({});
  const [load,  setLoad]    = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getElections()]).then(async ([s, e]) => {
      setStats(s.data.stats);
      const es = e.data.elections || []; setElecs(es);
      const r = {};
      await Promise.all(es.map(async el => { try { const x = await getResults(el._id); r[el._id] = x.data; } catch {} }));
      setRes(r);
    }).catch(()=>toast.error('Failed')).finally(()=>setLoad(false));
  }, []);

  const exportCSV = () => {
    const rows = [['Election','Candidate','Party','Votes','%']];
    elecs.forEach(e => (res[e._id]?.results||[]).forEach(r => rows.push([e.title,r.name,r.party,r.voteCount,r.percentage+'%'])));
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n')],{type:'text/csv'})),download:'results.csv'});
    a.click(); toast.success('Exported');
  };

  if (load) return <div className="loading-screen">Loading</div>;
  const COLORS = ['var(--white)','var(--green)','var(--amber)','var(--purple)','var(--red)'];

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--white)' }}>Analytics</div>
        <button className="btn btn-primary" onClick={exportCSV}>↓ Export CSV</button>
      </div>
      {stats && (
        <div className="grid-4" style={{ marginBottom:22 }}>
          <div className="stat"><div className="stat-label">Total votes</div><div className="stat-value">{stats.totalVotes.toLocaleString()}</div></div>
          <div className="stat stat-green"><div className="stat-label">Voters</div><div className="stat-value">{stats.totalVoters}</div></div>
          <div className="stat"><div className="stat-label">Candidates</div><div className="stat-value">{stats.totalCandidates}</div></div>
          <div className="stat"><div className="stat-label">Blocks</div><div className="stat-value" style={{color:stats.blockchain?.isValid?'var(--green)':'var(--red)'}}>{stats.blockchain?.totalBlocks}</div><div className="stat-sub">{stats.blockchain?.isValid?'Valid':'Tampered'}</div></div>
        </div>
      )}
      {elecs.map(e => {
        const r = res[e._id]; if (!r) return null;
        return (
          <div key={e._id} className="card" style={{ marginBottom:16 }}>
            <div className="card-header">
              <div className="card-title">{e.title}</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span className={`badge ${e.status==='active'?'badge-green':'badge-amber'}`}>{e.status}</span>
                <span style={{ fontSize:12, color:'var(--text3)' }}>{r.totalVotes} votes</span>
              </div>
            </div>
            {(r.results||[]).map((c,i)=>(
              <div key={c.candidateId} className="vote-bar-wrap">
                <div className="vote-bar-label">
                  <span><b>{c.name}</b><span style={{color:'var(--text3)'}}> — {c.party}</span></span>
                  <span style={{color:COLORS[i%COLORS.length],fontWeight:700}}>{c.voteCount} ({c.percentage}%)</span>
                </div>
                <div className="vote-bar-bg"><div className="vote-bar-fill" style={{width:`${c.percentage}%`,background:COLORS[i%COLORS.length]}}/></div>
              </div>
            ))}
            {!(r.results||[]).length && <div style={{color:'var(--text3)',fontSize:12}}>No votes yet</div>}
          </div>
        );
      })}
    </div>
  );
}
