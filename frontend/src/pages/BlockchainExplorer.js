import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getChain, validateChain } from '../services/api';

export default function BlockchainExplorer() {
  const [chain,   setChain]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await getChain();
      setChain(r.data.chain || []);
      setStats(r.data.stats);
    } catch { toast.error('Failed to load blockchain'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleValidate = async () => {
    try {
      const r = await validateChain();
      toast[r.data.isValid ? 'success' : 'error'](r.data.message);
    } catch { toast.error('Validation failed'); }
  };

  if (loading) return <div className="loading-screen">Loading blockchain…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>⛓ Blockchain Explorer</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-sm btn-green" onClick={handleValidate}>✓ Validate Chain</button>
        </div>
      </div>

      {stats && (
        <div className="grid-4" style={{ marginBottom: 16 }}>
          <div className="stat stat-blue"><div className="stat-label">Total Blocks</div><div className="stat-value">{stats.totalBlocks}</div></div>
          <div className="stat stat-green"><div className="stat-label">Chain Valid</div><div className="stat-value">{stats.isValid ? '✓' : '✗'}</div></div>
          <div className="stat"><div className="stat-label">Latest Hash</div><div style={{ fontSize: 9, color: 'var(--teal)', fontFamily: 'monospace', marginTop: 6, wordBreak: 'break-all' }}>{stats.latestHash?.slice(0, 20)}…</div></div>
          <div className="stat"><div className="stat-label">Genesis Hash</div><div style={{ fontSize: 9, color: 'var(--amber)', fontFamily: 'monospace', marginTop: 6, wordBreak: 'break-all' }}>{stats.genesisHash?.slice(0, 20)}…</div></div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">Blocks</div></div>
        <div className="chain-scroll">
          {chain.map((block, i) => (
            <React.Fragment key={block.index}>
              <div className={`block-card${i === 0 ? ' genesis' : ''}`}>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Block #{block.index}{i === 0 ? ' · Genesis' : ''}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>Hash:</div>
                <div className="block-hash-text">{block.hash}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>Prev Hash:</div>
                <div className="block-hash-text" style={{ color: 'var(--text2)' }}>{block.previousHash?.slice(0, 16)}…</div>
                <div style={{ fontSize: 9, color: 'var(--text2)', marginTop: 4 }}>
                  {typeof block.dataHash === 'string' ? block.dataHash.slice(0, 20) + '…' : 'Genesis'}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 4 }}>{new Date(block.timestamp).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>Nonce: {block.nonce}</div>
              </div>
              {i < chain.length - 1 && <div className="chain-arrow">→</div>}
            </React.Fragment>
          ))}
          {chain.length === 0 && (
            <div className="empty-state" style={{ width: '100%' }}>
              <div className="icon">⛓</div><div>No blocks yet</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">📖 How It Works</div></div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 2 }}>
          <div>1. When a vote is cast, the system generates: <code style={{ color: 'var(--teal)' }}>SHA-256(voterId:candidateId:electionId:timestamp)</code></div>
          <div>2. This hash (NOT the raw vote) is stored in a new blockchain block.</div>
          <div>3. Each block contains its own hash, the previous block's hash, and a nonce (proof of work).</div>
          <div>4. Changing any vote would invalidate its block hash, breaking the chain — <b style={{ color: 'var(--green)' }}>tamper-evident</b>.</div>
          <div>5. The compound index <code style={{ color: 'var(--teal)' }}>(voterId + electionId)</code> in MongoDB prevents duplicate votes at the DB level.</div>
        </div>
      </div>
    </div>
  );
}
