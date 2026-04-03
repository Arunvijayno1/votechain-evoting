import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useFaceRecognition from '../services/useFaceRecognition';
import { verifyFace, getElections, getCandidates, castVote, getMyVotes } from '../services/api';

export default function Vote() {
  const face = useFaceRecognition();
  const [phase,      setPhase]    = useState('verify'); // verify|select|done
  const [elections,  setElections]= useState([]);
  const [candidates, setCands]    = useState([]);
  const [selElec,    setSelElec]  = useState('');
  const [faceEmb,    setFaceEmb]  = useState(null);
  const [myVotes,    setMyVotes]  = useState([]);
  const [receipt,    setReceipt]  = useState(null);
  const [loading,    setLoading]  = useState(false);
  const [confirm,    setConfirm]  = useState(null);

  useEffect(() => {
    getElections().then(r => setElections(r.data.elections?.filter(e => e.status === 'active') || []));
    getMyVotes().then(r => setMyVotes(r.data.votes || [])).catch(() => {});
    return () => face.stopCamera();
  }, []);

  const votedIn = id => myVotes.some(v => (v.electionId?._id || v.electionId) === id);

  const startCam = async () => {
    try {
      if (!face.ready) { toast.info('Loading AI models…'); await face.loadModels(); }
      await face.startCamera();
    } catch (err) { toast.error(err.message); }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const emb = await face.captureEmbedding();
      const res = await verifyFace(emb);
      if (res.data.verified) {
        setFaceEmb(emb);
        face.stopCamera();
        setPhase('select');
        toast.success(`Identity confirmed — ${(res.data.similarity * 100).toFixed(1)}% match`);
      } else {
        toast.error(`Face mismatch — ${(res.data.similarity * 100).toFixed(1)}% (need ≥75%)`);
      }
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  const loadCandidates = async (id) => {
    setSelElec(id); setCands([]);
    if (!id) return;
    try { const r = await getCandidates({ electionId: id, status: 'approved' }); setCands(r.data.candidates || []); }
    catch { toast.error('Could not load candidates'); }
  };

  const submitVote = async () => {
    if (!confirm || !faceEmb) return;
    setLoading(true);
    try {
      const r = await castVote({ candidateId: confirm._id, electionId: selElec, faceEmbedding: faceEmb });
      setReceipt(r.data); setPhase('done'); setConfirm(null);
      toast.success('Vote recorded on blockchain');
    } catch (err) {
      const msg = err.response?.data?.message || 'Vote failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('already')) toast.warning('One vote per election per person.', { autoClose: 6000 });
      setConfirm(null);
    } finally { setLoading(false); }
  };

  if (phase === 'done' && receipt) return (
    <div className="fade-in" style={{ maxWidth: 520 }}>
      <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>Vote recorded</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 24 }}>Permanently stored on the blockchain</div>
        <div className="grid-2" style={{ gap: 10, marginBottom: 20 }}>
          <div className="stat stat-green"><div className="stat-label">Block</div><div className="stat-value">#{receipt.blockIndex}</div></div>
          <div className="stat"><div className="stat-label">Status</div><div className="stat-value" style={{ fontSize: 14, color: 'var(--green)' }}>Immutable</div></div>
        </div>
        <div style={{ textAlign: 'left', marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>VOTE HASH (SHA-256)</div>
          <div className="hash-box">{receipt.voteHash}</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>BLOCK HASH</div>
          <div className="hash-box">{receipt.blockHash}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 14 }}>{new Date(receipt.timestamp).toLocaleString()}</div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Confirm modal */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card fade-in" style={{ width: 380, maxWidth: '95vw', margin: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Confirm vote</div>
            <div className="card-inset" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>Voting for</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{confirm.userId?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{confirm.party}</div>
            </div>
            <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--red)', marginBottom: 18 }}>
              This action is irreversible. Your vote is permanently recorded.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setConfirm(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={submitVote} disabled={loading}>
                {loading ? 'Recording…' : 'Confirm vote →'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', marginBottom: 2 }}>Cast Vote</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Face verification is required before voting</div>
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['Face verify', 'Select candidate', 'Done'].map((s, i) => {
          const phaseIdx = ['verify','select','done'].indexOf(phase);
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                background: i < phaseIdx ? 'var(--green-bg)' : i === phaseIdx ? 'var(--accent-bg2)' : 'var(--bg3)',
                color: i < phaseIdx ? 'var(--green)' : i === phaseIdx ? 'var(--white)' : 'var(--text3)',
                border: `1px solid ${i < phaseIdx ? 'rgba(34,197,94,.3)' : i === phaseIdx ? 'var(--border3)' : 'var(--border2)'}` }}>
                {i < phaseIdx ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === phaseIdx ? 'var(--white)' : 'var(--text3)', fontWeight: i === phaseIdx ? 600 : 400 }}>{s}</span>
              {i < 2 && <span style={{ color: 'var(--border3)', margin: '0 4px' }}>→</span>}
            </div>
          );
        })}
      </div>

      <div className="grid-2">
        {/* Face verify */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Step 1 — Identity</div>
            {phase !== 'verify' && <span className="badge badge-green">✓ Verified</span>}
          </div>
          {phase === 'verify' ? (<>
            <div className={`webcam-box${face.faceFound && face.cameraOn ? ' detected' : ''}`}
              style={{ width: 260, height: 195, margin: '0 auto 14px' }}>
              <video ref={face.videoRef} className="webcam-video" style={{ display: face.cameraOn ? 'block' : 'none' }} muted playsInline />
              {!face.cameraOn && (
                <div className="webcam-empty">
                  <div style={{ fontSize: 32, opacity: .2 }}>◎</div>
                  <div style={{ fontSize: 12 }}>Camera inactive</div>
                </div>
              )}
              {face.cameraOn && face.faceFound && (
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: 'var(--green)' }}>
                  ● Face detected
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
              {!face.cameraOn ? 'Start camera to verify identity' : face.faceFound ? 'Face detected — click Verify' : 'Position face in frame…'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {!face.cameraOn
                ? <button className="btn btn-primary" onClick={startCam}>Start camera</button>
                : <button className="btn btn-primary" onClick={handleVerify} disabled={!face.faceFound || loading}>
                    {loading ? 'Verifying…' : 'Verify identity →'}
                  </button>
              }
            </div>
          </>) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--green)' }}>
              <div style={{ fontSize: 42, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 600 }}>Identity confirmed</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Biometric check passed</div>
            </div>
          )}
        </div>

        {/* Candidate select */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Step 2 — Vote</div>
          {phase === 'verify' ? (
            <div className="empty-state">
              <div style={{ fontSize: 28, opacity: .2, marginBottom: 8 }}>🔒</div>
              <div style={{ fontSize: 13 }}>Complete face verification first</div>
            </div>
          ) : (<>
            <div className="form-group">
              <label className="form-label">Election</label>
              <select className="form-input" value={selElec} onChange={e => loadCandidates(e.target.value)}>
                <option value="">— Select election —</option>
                {elections.map(e => (
                  <option key={e._id} value={e._id} disabled={votedIn(e._id)}>
                    {e.title}{votedIn(e._id) ? ' ✓ voted' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selElec && votedIn(selElec) && (
              <div style={{ background: 'var(--amber-bg)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--amber)' }}>
                You have already voted in this election.
              </div>
            )}

            {candidates.length > 0 && !votedIn(selElec) && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10 }}>Candidates</div>
                {candidates.map(c => (
                  <div key={c._id} className="card-inset" style={{ cursor: 'pointer', transition: 'border-color .1s', marginBottom: 8 }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border3)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: 2 }}>{c.userId?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.party}</div>
                        {c.statement && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 5, fontStyle: 'italic' }}>"{c.statement.slice(0, 90)}{c.statement.length > 90 ? '…' : ''}"</div>}
                      </div>
                      <button className="btn btn-primary btn-sm" style={{ marginLeft: 12, flexShrink: 0 }}
                        onClick={() => setConfirm(c)} disabled={loading}>
                        Vote →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selElec && candidates.length === 0 && !votedIn(selElec) && (
              <div className="empty-state" style={{ padding: '20px 0' }}>No approved candidates yet</div>
            )}
          </>)}
        </div>
      </div>
    </div>
  );
}
