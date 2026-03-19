import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useFaceRecognition from '../services/useFaceRecognition';
import { verifyFace, getElections, getCandidates, castVote, getMyVotes } from '../services/api';

export default function Vote() {
  const { videoRef, modelsLoaded, cameraActive, faceDetected, status, loadModels, startCamera, stopCamera, captureEmbedding } = useFaceRecognition();

  const [phase,          setPhase]          = useState('verify');
  const [elections,      setElections]      = useState([]);
  const [candidates,     setCandidates]     = useState([]);
  const [selectedElec,   setSelectedElec]   = useState('');
  const [faceEmbedding,  setFaceEmbedding]  = useState(null);
  const [myVotes,        setMyVotes]        = useState([]);
  const [voteCast,       setVoteCast]       = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [confirmCand,    setConfirmCand]    = useState(null);

  useEffect(() => {
    getElections().then(r => setElections(r.data.elections?.filter(e => e.status === 'active') || []));
    getMyVotes().then(r => setMyVotes(r.data.votes || [])).catch(() => {});
    return () => stopCamera();
  }, [stopCamera]);

  const alreadyVotedIn = (elecId) => myVotes.some(v => v.electionId?._id === elecId || v.electionId === elecId);

  const handleStartVerify = async () => {
    try {
      if (!modelsLoaded) {
        toast.info('Loading face AI models...');
        await loadModels();
      }
      toast.info('Starting camera...');
      await startCamera();
    } catch (err) { toast.error(err.message); }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      toast.info('Scanning face — hold still...');
      const emb = await captureEmbedding();
      const res = await verifyFace(emb);
      if (res.data.verified) {
        setFaceEmbedding(emb);
        setPhase('select');
        stopCamera();
        toast.success(`✅ Identity verified! Similarity: ${(res.data.similarity * 100).toFixed(1)}%`);
      } else {
        toast.error(`Face mismatch. Similarity ${(res.data.similarity * 100).toFixed(1)}% < ${res.data.threshold * 100}% threshold.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  const handleElectionChange = async (elecId) => {
    setSelectedElec(elecId);
    setCandidates([]);
    if (!elecId) return;
    try {
      const r = await getCandidates({ electionId: elecId, status: 'approved' });
      setCandidates(r.data.candidates || []);
    } catch { toast.error('Failed to load candidates'); }
  };

  const handleVote = async (candidate) => {
    if (!faceEmbedding) return;
    setConfirmCand(candidate);
  };

  const confirmVote = async () => {
    if (!confirmCand) return;
    setLoading(true);
    try {
      const res = await castVote({ candidateId: confirmCand._id, electionId: selectedElec, faceEmbedding });
      setVoteCast(res.data);
      setPhase('done');
      setConfirmCand(null);
      toast.success('✅ Vote cast and recorded on blockchain!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Vote failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('duplicate')) {
        toast.warning('⚠ Duplicate vote attempt blocked — you already voted in this election.', { autoClose: 6000 });
      }
      setConfirmCand(null);
    } finally { setLoading(false); }
  };

  // Confirmation modal
  const ConfirmModal = () => confirmCand ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: 380, maxWidth: '95vw' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚠ Confirm Your Vote</div>
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>You are voting for:</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{confirmCand.userId?.name}</div>
          <div style={{ color: 'var(--text2)', fontSize: 12 }}>{confirmCand.party} {confirmCand.symbol}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 20 }}>
          ⚠ This action is IRREVERSIBLE. Your vote will be permanently recorded on the blockchain.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setConfirmCand(null)} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmVote} disabled={loading}>
            {loading ? 'Recording...' : '✓ Confirm Vote'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Done screen
  if (phase === 'done' && voteCast) return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Vote Cast Successfully</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Your vote is permanently recorded on the blockchain</div>
      </div>
      <hr className="divider" />
      <div className="grid-2" style={{ gap: 10, marginBottom: 14 }}>
        <div className="stat stat-blue"><div className="stat-label">Block Index</div><div className="stat-value">#{voteCast.blockIndex}</div></div>
        <div className="stat stat-green"><div className="stat-label">Status</div><div className="stat-value" style={{ fontSize: 14 }}>Immutable ✓</div></div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Vote Hash (SHA-256) — verify in Blockchain Explorer</div>
        <div className="hash-box">{voteCast.voteHash}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Block Hash</div>
        <div className="hash-box">{voteCast.blockHash}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
        {new Date(voteCast.timestamp).toLocaleString()}
      </div>
    </div>
  );

  return (
    <>
      <ConfirmModal />
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Cast Your Vote</h2>

      {/* Steps indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12 }}>
        {['Face Verify', 'Select & Vote', 'Confirmed'].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                background: (phase === 'verify' && i === 0) || (phase === 'select' && i === 1) || (phase === 'done' && i === 2) ? 'var(--accent)' :
                  (i < (['verify','select','done'].indexOf(phase))) ? 'rgba(63,185,80,.2)' : 'var(--bg3)',
                color: (phase === 'verify' && i === 0) || (phase === 'select' && i === 1) || (phase === 'done' && i === 2) ? '#fff' :
                  (i < (['verify','select','done'].indexOf(phase))) ? 'var(--green)' : 'var(--text3)',
                border: '1px solid var(--border)' }}>
                {i < (['verify','select','done'].indexOf(phase)) ? '✓' : i + 1}
              </div>
              <span style={{ color: phase === ['verify','select','done'][i] ? 'var(--text)' : 'var(--text3)' }}>{s}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid-2">
        {/* Step 1: Face verify */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔍 Step 1: Face Verification</div>
            {phase !== 'verify' && <span className="badge badge-green">✓ Done</span>}
          </div>

          {phase === 'verify' ? (
            <>
              <div style={{ position: 'relative', width: 260, height: 195, margin: '0 auto 14px', borderRadius: 12, overflow: 'hidden', background: '#000',
                border: `2px solid ${faceDetected && cameraActive ? 'var(--green)' : 'var(--border2)'}`, transition: 'border-color .3s' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} muted playsInline />
                {!cameraActive && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text3)', fontSize: 11 }}>
                    <span style={{ fontSize: 32 }}>📷</span><span>Camera off</span>
                  </div>
                )}
                {cameraActive && faceDetected && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(63,185,80,.2)', border: '1px solid var(--green)', borderRadius: 12, padding: '2px 8px', fontSize: 10, color: 'var(--green)' }}>
                    ● Face Detected
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>
                {!cameraActive ? 'Click Start Camera to begin identity verification' :
                  faceDetected ? '✅ Face detected — click Verify Identity' : '🔍 Position face in frame...'}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {!cameraActive
                  ? <button className="btn btn-primary" onClick={handleStartVerify} disabled={loading}>Start Camera</button>
                  : <button className="btn btn-primary" onClick={handleVerify} disabled={loading || !faceDetected}>
                      {loading ? '🔍 Verifying...' : 'Verify Identity'}
                    </button>
                }
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--green)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 700 }}>Identity Verified</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>Biometric check passed</div>
            </div>
          )}
        </div>

        {/* Step 2: Select and vote */}
        <div className="card">
          <div className="card-header"><div className="card-title">🗳 Step 2: Cast Your Vote</div></div>

          {phase === 'verify' ? (
            <div className="empty-state"><div className="icon">🔒</div><div>Complete face verification first</div></div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Select Election</label>
                <select className="form-input" value={selectedElec} onChange={e => handleElectionChange(e.target.value)}>
                  <option value="">— Choose an active election —</option>
                  {elections.map(e => (
                    <option key={e._id} value={e._id} disabled={alreadyVotedIn(e._id)}>
                      {e.title}{alreadyVotedIn(e._id) ? ' (already voted)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedElec && alreadyVotedIn(selectedElec) && (
                <div style={{ background: 'rgba(248,81,73,.1)', border: '1px solid var(--red)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>
                  ⚠ You have already voted in this election. Each voter may vote only once per election.
                </div>
              )}

              {candidates.length > 0 && !alreadyVotedIn(selectedElec) && (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 10 }}>Select Candidate</div>
                  {candidates.map(c => (
                    <div key={c._id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 10, cursor: 'pointer', transition: 'all .15s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'rgba(88,166,255,.05)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.symbol} {c.userId?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.party}</div>
                          {c.statement && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, fontStyle: 'italic' }}>"{c.statement.slice(0, 80)}{c.statement.length > 80 ? '...' : ''}"</div>}
                        </div>
                        <button className="btn btn-primary" style={{ marginLeft: 12, flexShrink: 0 }}
                          onClick={() => handleVote(c)} disabled={loading}>
                          Vote →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedElec && candidates.length === 0 && !alreadyVotedIn(selectedElec) && (
                <div className="empty-state"><div>No approved candidates for this election</div></div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
