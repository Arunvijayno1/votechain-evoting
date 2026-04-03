import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getChain, validateChain } from '../services/api';

export default function BlockchainPage() {
  const [chain, setChain] = useState([]);
  const [stats, setStats] = useState(null);
  const [load,  setLoad]  = useState(true);

  const fetch = async () => {
    try { const r = await getChain(); setChain(r.data.chain||[]); setStats(r.data.stats); }
    catch { toast.error('Failed'); } finally { setLoad(false); }
  };

  useEffect(() => { fetch(); }, []);

  const validate = async () => {
    try { const r = await validateChain(); toast[r.data.isValid?'success':'error'](r.data.message); }
    catch { toast.error('Error'); }
  };

  if (load) return <div className="loading-screen">Loading</div>;

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--white)' }}>Blockchain Explorer</div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-sm" onClick={fetch}>↻ Refresh</button>
          <button className="btn btn-sm btn-green" onClick={validate}>✓ Validate chain</button>
        </div>
      </div>

      {stats && (
        <div className="grid-4" style={{ marginBottom:20 }}>
          <div className="stat"><div className="stat-label">Total blocks</div><div className="stat-value">{stats.totalBlocks}</div></div>
          <div className="stat stat-green"><div className="stat-label">Chain valid</div><div className="stat-value">{stats.isValid?'✓':'✗'}</div></div>
          <div className="stat"><div className="stat-label">Latest hash</div><div style={{fontSize:9,color:'var(--green)',fontFamily:'monospace',marginTop:8,wordBreak:'break-all'}}>{stats.latestHash?.slice(0,24)}…</div></div>
          <div className="stat"><div className="stat-label">Genesis hash</div><div style={{fontSize:9,color:'var(--text2)',fontFamily:'monospace',marginTop:8,wordBreak:'break-all'}}>{stats.genesisHash?.slice(0,24)}…</div></div>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ marginBottom:16 }}>Blocks</div>
        <div className="chain-row">
          {chain.map((b,i)=>(
            <React.Fragment key={b.index}>
              <div className={`block-node${i===0?' genesis':''}`}>
                <div style={{fontSize:9,color:i===0?'var(--text2)':'var(--text3)',fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>
                  Block #{b.index}{i===0?' · Genesis':''}
                </div>
                <div style={{fontSize:9,color:'var(--text3)'}}>Hash</div>
                <div className="block-hash-txt">{b.hash?.slice(0,28)}…</div>
                <div style={{fontSize:9,color:'var(--text3)',marginTop:4}}>Prev</div>
                <div className="block-hash-txt" style={{color:'var(--text2)'}}>{b.previousHash?.slice(0,16)}…</div>
                <div style={{fontSize:9,color:'var(--text3)',marginTop:6}}>{new Date(b.timestamp).toLocaleString()}</div>
                <div style={{fontSize:9,color:'var(--text3)'}}>Nonce: {b.nonce}</div>
              </div>
              {i<chain.length-1 && <div className="chain-arrow">→</div>}
            </React.Fragment>
          ))}
          {!chain.length && <div className="empty-state" style={{width:'100%'}}>No blocks</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom:14 }}>How votes are stored</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, fontSize:12, color:'var(--text2)', lineHeight:2 }}>
          <div>
            <div style={{color:'var(--white)',fontWeight:600,marginBottom:4}}>Vote hashing</div>
            <div>Each vote generates a SHA-256 hash of voterId + candidateId + electionId + timestamp. Only this hash is stored on the chain.</div>
          </div>
          <div>
            <div style={{color:'var(--white)',fontWeight:600,marginBottom:4}}>Tamper detection</div>
            <div>Each block references the previous block's hash. Changing any vote breaks the chain hash — detectable instantly via the validate button.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
