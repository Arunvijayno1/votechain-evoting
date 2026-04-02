import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getChain, validateChain } from '../services/api';

export default function BlockchainExplorer() {
  const [chain,   setChain]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const r = await getChain(); setChain(r.data.chain || []); setStats(r.data.stats); }
    catch { toast.error('Failed to load blockchain'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleValidate = async () => {
    try { const r = await validateChain(); toast[r.data.isValid ? 'success' : 'error'](r.data.message); }
    catch { toast.error('Validation error'); }
  };

  if (loading) return <div className="loading-screen">Loading blockchain</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="section-title" style={{ margin: 0 }}>Blockchain Explorer</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-sm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-gold btn-sm" onClick={handleValidate}>✓ Validate Chain</button>
        </div>
      </div>

      {stats && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat stat-gold"><div className="stat-label">Total Blocks</div><div className="stat-value">{stats.totalBlocks}</div></div>
          <div className="stat stat-green"><div className="stat-label">Chain Valid</div><div className="stat-value">{stats.isValid ? '✓' : '✗'}</div></div>
          <div className="stat"><div className="stat-label">Latest Hash</div><div style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'monospace', marginTop: 8, wordBreak: 'break-all' }}>{stats.latestHash?.slice(0,24)}…</div></div>
          <div className="stat"><div className="stat-label">Genesis Hash</div><div style={{ fontSize: 9, color: 'var(--amber)', fontFamily: 'monospace', marginTop: 8, wordBreak: 'break-all' }}>{stats.genesisHash?.slice(0,24)}…</div></div>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>Block Chain</div>
        <div className="chain-scroll">
          {chain.map((block, i) => (
            <React.Fragment key={block.index}>
              <div className={`block-card${i === 0 ? ' genesis' : ''}`}>
                <div style={{ fontSize: 9, color: i === 0 ? 'var(--gold)' : 'var(--text3)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Block #{block.index}{i === 0 ? ' · Genesis' : ''}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>Hash</div>
                <div className="block-hash">{block.hash?.slice(0,32)}…</div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4 }}>Prev Hash</div>
                <div className="block-hash" style={{ color: 'var(--text2)' }}>{block.previousHash?.slice(0,16)}…</div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 6 }}>{new Date(block.timestamp).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>Nonce: {block.nonce}</div>
              </div>
              {i < chain.length - 1 && <div className="chain-arrow">→</div>}
            </React.Fragment>
          ))}
          {chain.length === 0 && <div className="empty-state" style={{ width: '100%' }}><div className="empty-icon">⛓</div><div>No blocks yet</div></div>}
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12, color: 'var(--text2)', lineHeight: 1.9 }}>
          <div>
            <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>Vote Hashing</div>
            <div>Each vote generates: <code style={{ color: 'var(--gold)', background: 'var(--bg3)', padding: '1px 5px', borderRadius: 3 }}>SHA-256(voterId:candidateId:electionId:timestamp)</code></div>
            <div style={{ marginTop: 6 }}>Only this hash is stored on the chain — raw vote data stays in MongoDB.</div>
          </div>
          <div>
            <div style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>Tamper Detection</div>
            <div>Each block contains the previous block's hash. Changing any vote invalidates its block's hash, breaking the entire chain — instantly detectable.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
