import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useFaceRecognition from '../services/useFaceRecognition';
import { verifyFace, getElections, getCandidates, castVote, getMyVotes } from '../services/api';

export default function Vote() {
  const { videoRef, modelsLoaded, cameraActive, faceDetected, status, loadModels, startCamera, stopCamera, captureEmbedding } = useFaceRecognition();
  const [phase,         setPhase]       = useState('verify');
  const [elections,     setElections]   = useState([]);
  const [candidates,    setCandidates]  = useState([]);
  const [selectedElec,  setSelElec]     = useState('');
  const [faceEmbedding, setFaceEmbed]   = useState(null);
  const [myVotes,       setMyVotes]     = useState([]);
  const [voteCast,      setVoteCast]    = useState(null);
  const [loading,       setLoading]     = useState(false);
  const [confirmCand,   setConfirm]     = useState(null);

  useEffect(() => {
    getElections().then(r => setElections(r.data.elections?.filter(e => e.status === 'active') || []));
    getMyVotes().then(r => setMyVotes(r.data.votes || [])).catch(() => {});
    return () => stopCamera();
  }, [stopCamera]);

  const votedIn = (elecId) => myVotes.some(v => (v.electionId?._id || v.electionId) === elecId);

  const handleStartCamera = async () => {
    try {
      if (!modelsLoaded) { toast.info('Loading AI models...'); await loadModels(); }
      await startCamera();
    } catch (err) { toast.error(err.message); }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const emb = await captureEmbedding();
      const res = await verifyFace(emb);
      if (res.data.verified) {
        setFaceEmbed(emb);
        setPhase('select');
        stopCamera();
        toast.success(`✓ Identity confirmed — ${(res.data.similarity * 100).toFixed(1)}% match`);
      } else {
        toast.error(`Identity mismatch — ${(res.data.similarity * 100).toFixed(1)}% match (need ≥75%)`);
      }
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  const handleElectionChange = async (elecId) => {
    setSelElec(elecId);
    setCandidates([]);
    if (!elecId) return;
    try {
      const r = await getCandidates({ electionId: elecId, status: 'approved' });
      setCandidates(r.data.candidates || []);
    } catch { toast.error('Failed to load candidates'); }
  };

  const handleConfirmVote = async () => {
    if (!confirmCand || !faceEmbedding) return;
    setLoading(true);
    try {
      const res = await castVote({ candidateId: confirmCand._id, electionId: selectedElec, faceEmbedding });
      setVoteCast(res.data);
      setPhase('done');
      setConfirm(null);
      toast.success('✓ Vote permanently recorded on blockchain');
    } catch (err) {
      const msg = err.response?.data?.message || 'Vote failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('duplicate'))
        toast.warning('Each voter can only vote once per election.', { autoClose: 6000 });
      setConfirm(null);
    } finally { setLoading(false); }
  };

  // ── Done screen ────────────────────────────────────────────
  if (phase === 'done' && voteCast) return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      <div className="card-gold" style={{ textAlign:'center', padding:'36px 24px' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✓</div>
        <div style={{ fontSize:22, fontWeight:700, color:'var(--gold2)', marginBottom:6 }}>Vote Recorded</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:28 }}>Your vote is permanently and immutably stored on the blockchain</div>
        <div className="grid-2" style={{ gap:12, marginBottom:20 }}>
          <div className="stat stat-gold"><div className="stat-label">Block Index</div><div className="stat-value">#{voteCast.blockIndex}</div></div>
          <div className="stat stat-green"><div className="stat-label">Status</div><div className="stat-value" style={{fontSize:14}}>Immutable ✓</div></div>
        </div>
        <div style={{ textAlign:'left', marginBottom:12 }}>
          <div style={{ fontSize:10, color:'var(--text3)', marginBottom:5 }}>VOTE HASH (SHA-256)</div>
          <div className="hash-box">{voteCast.voteHash}</div>
        </div>
        <div style={{ textAlign:'left' }}>
          <div style={{ fontSize:10, color:'var(--text3)', marginBottom:5 }}>BLOCK HASH</div>
          <div className="hash-box">{voteCast.blockHash}</div>
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', marginTop:16 }}>{new Date(voteCast.timestamp).toLocaleString()}</div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Confirm modal */}
      {confirmCand && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--gold-dim)', borderRadius:14, padding:30, width:400, maxWidth:'95vw' }} className="fade-in">
            <div style={{ fontSize:18, fontWeight:700, color:'var(--gold2)', marginBottom:20 }}>Confirm Vote</div>
            <div style={{ background:'var(--bg3)', borderRadius:10, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>Voting for:</div>
              <div style={{ fontWeight:700, fontSize:17 }}>{confirmCand.symbol} {confirmCand.userId?.name}</div>
              <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{confirmCand.party}</div>
            </div>
            <div style={{ background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:12, color:'var(--red)' }}>
              ⚠ This action is irreversible. Your vote will be permanently recorded on the blockchain and cannot be changed.
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button className="btn" onClick={() => setConfirm(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-gold" onClick={handleConfirmVote} disabled={loading}>
                {loading ? 'Recording...' : '✓ Confirm Vote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step indicators */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
        {['Face Verify','Select & Vote','Confirmed'].map((s,i) => {
          const phaseIdx = ['verify','select','done'].indexOf(phase);
          const done = i < phaseIdx;
          const active = i === phaseIdx;
          return (
            <React.Fragment key={s}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                  background: active ? 'var(--gold-bg2)' : done ? 'var(--green-bg)' : 'var(--bg3)',
                  color: active ? 'var(--gold2)' : done ? 'var(--green)' : 'var(--text3)',
                  border: `1px solid ${active ? 'var(--gold)' : done ? 'var(--green)' : 'var(--border)'}` }}>
                  {done ? '✓' : i+1}
                </div>
                <span style={{ fontSize:12, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : 'var(--text3)' }}>{s}</span>
              </div>
              {i < 2 && <div style={{ flex:1, height:1, background:'var(--border)' }} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid-2">
        {/* Face verify card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">◉ Step 1: Face Verification</div>
            {phase !== 'verify' && <span className="badge badge-green">✓ Verified</span>}
          </div>

          {phase === 'verify' ? (
            <>
              <div className="webcam-box" style={{ width:260, height:195, margin:'0 auto 16px', border:`2px solid ${faceDetected && cameraActive ? 'var(--green)' : cameraActive ? 'var(--gold-dim)' : 'var(--border2)'}` }}>
                <video ref={videoRef} className="webcam-video" style={{ display:cameraActive?'block':'none' }} muted playsInline />
                {!cameraActive && (
                  <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'var(--text3)' }}>
                    <span style={{ fontSize:36, opacity:.3 }}>◉</span>
                    <span style={{ fontSize:12 }}>Camera inactive</span>
                  </div>
                )}
                {cameraActive && faceDetected && (
                  <div style={{ position:'absolute', top:8, right:8, background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:10, padding:'2px 8px', fontSize:10, color:'var(--green)' }}>
                    ● Face Detected
                  </div>
                )}
              </div>

              <div style={{ textAlign:'center', fontSize:12, color:'var(--text2)', marginBottom:14, minHeight:18 }}>
                {!cameraActive ? 'Start camera to verify your identity' :
                  faceDetected ? '✓ Face found — click Verify Identity' : '🔍 Looking for face...'}
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                {!cameraActive
                  ? <button className="btn btn-gold" onClick={handleStartCamera} disabled={loading}>Start Camera</button>
                  : <button className="btn btn-gold" onClick={handleVerify} disabled={loading || !faceDetected}>
                      {loading ? '🔍 Verifying...' : 'Verify Identity →'}
                    </button>
                }
              </div>

              <div style={{ marginTop:14, padding:12, background:'var(--bg3)', borderRadius:8, fontSize:11, color:'var(--text3)', lineHeight:1.8 }}>
                <b style={{color:'var(--text2)'}}>Security:</b> Dual-gate check — cosine similarity ≥ 75% AND euclidean distance ≤ 0.5. Both must pass to vote.
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'36px 0', color:'var(--green)' }}>
              <div style={{ fontSize:48, marginBottom:10 }}>✓</div>
              <div style={{ fontWeight:700, fontSize:16 }}>Identity Confirmed</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:6 }}>Biometric verification passed</div>
            </div>
          )}
        </div>

        {/* Vote selection card */}
        <div className="card">
          <div className="card-header"><div className="card-title">⊡ Step 2: Cast Your Vote</div></div>

          {phase === 'verify' ? (
            <div className="empty-state"><div className="empty-icon" style={{fontSize:32}}>🔒</div><div>Complete face verification first</div></div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select Election</label>
                <select className="form-input" value={selectedElec} onChange={e => handleElectionChange(e.target.value)}>
                  <option value="">— Choose an election —</option>
                  {elections.map(e => (
                    <option key={e._id} value={e._id} disabled={votedIn(e._id)}>
                      {e.title}{votedIn(e._id) ? ' ✓ (voted)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedElec && votedIn(selectedElec) && (
                <div style={{ background:'var(--amber-bg)', border:'1px solid var(--amber)', borderRadius:8, padding:12, fontSize:12, color:'var(--amber)' }}>
                  ✓ You have already voted in this election. One vote per person per election.
                </div>
              )}

              {candidates.length > 0 && !votedIn(selectedElec) && (
                <div>
                  <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:12 }}>Select Candidate</div>
                  {candidates.map(c => (
                    <div key={c._id} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginBottom:10, cursor:'pointer', transition:'all .2s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor='var(--gold-dim)'; e.currentTarget.style.background='var(--gold-bg)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg3)'; }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{c.symbol} {c.userId?.name}</div>
                          <div style={{ fontSize:12, color:'var(--text3)' }}>{c.party}</div>
                          {c.statement && <div style={{ fontSize:11, color:'var(--text2)', marginTop:6, fontStyle:'italic', lineHeight:1.5 }}>"{c.statement.slice(0,100)}{c.statement.length>100?'…':''}"</div>}
                        </div>
                        <button className="btn btn-gold" style={{ marginLeft:14, flexShrink:0 }} onClick={() => setConfirm(c)} disabled={loading}>
                          Vote →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedElec && candidates.length === 0 && !votedIn(selectedElec) && (
                <div className="empty-state"><div>No approved candidates for this election yet</div></div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
