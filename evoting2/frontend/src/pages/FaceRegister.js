import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useFaceRecognition from '../services/useFaceRecognition';
import { registerFace, getVoterProfile } from '../services/api';

export default function FaceRegister() {
  const face = useFaceRecognition();
  const [step,    setStep]    = useState('idle'); // idle|loading|camera|captured|saved
  const [emb,     setEmb]     = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getVoterProfile().then(r => setProfile(r.data.voter)).catch(() => {});
    return () => face.stopCamera();
  }, []);

  const handleStart = async () => {
    setStep('loading');
    try {
      if (!face.ready) { toast.info('Loading face AI models…'); await face.loadModels(); }
      await face.startCamera();
      setStep('camera');
    } catch (err) { toast.error(err.message); setStep('idle'); }
  };

  const handleCapture = async () => {
    try {
      toast.info('Hold still — capturing…');
      const e = await face.captureEmbedding();
      setEmb(e); setStep('captured');
      toast.success('Face captured');
    } catch (err) { toast.error(err.message); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await registerFace(emb);
      toast.success('Face registered successfully');
      setStep('saved'); face.stopCamera();
      getVoterProfile().then(r => setProfile(r.data.voter)).catch(() => {});
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (msg.includes('another account')) toast.error('This face is already linked to a different account.', { autoClose: 7000 });
    } finally { setSaving(false); }
  };

  const steps = [
    { label: 'Load AI models',                  done: face.ready },
    { label: 'Open webcam',                      done: face.cameraOn },
    { label: 'Capture 3-frame embedding',        done: !!emb },
    { label: 'Check for duplicate face',         done: step === 'saved' },
    { label: 'Store encrypted in MongoDB',       done: step === 'saved' },
  ];
  const activeIdx = steps.findIndex(s => !s.done);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', marginBottom: 2 }}>Face Registration</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Required before you can cast a vote</div>
      </div>

      {profile?.faceRegistered && step !== 'saved' && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: 'var(--green)' }}>
          ✓ Face already registered. You can re-register below to update it.
        </div>
      )}

      <div className="grid-2">
        {/* Camera card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Camera</div>
            {face.cameraOn && (
              <span className={`badge ${face.faceFound ? 'badge-green' : 'badge-amber'}`}>
                {face.faceFound ? '● Face detected' : '○ No face'}
              </span>
            )}
          </div>

          {/* Video box */}
          <div className={`webcam-box${face.faceFound && face.cameraOn ? ' detected' : ''}`}
            style={{ width: 270, height: 200, margin: '0 auto 16px' }}>
            <video ref={face.videoRef} className="webcam-video"
              style={{ display: face.cameraOn ? 'block' : 'none' }} muted playsInline />
            {!face.cameraOn && (
              <div className="webcam-empty">
                <div style={{ fontSize: 36, opacity: .2 }}>◎</div>
                <div style={{ fontSize: 12 }}>
                  {step === 'loading' ? 'Loading models…' : 'Camera inactive'}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', marginBottom: 14, minHeight: 18 }}>
            {face.status === 'idle'     && 'Press start to begin'}
            {face.status === 'loading'  && 'Loading AI models (first time ~20s)…'}
            {face.status === 'starting' && 'Starting camera…'}
            {face.status === 'scanning' && (face.faceFound ? '✓ Face found — press Capture' : 'Position face in frame')}
            {face.status === 'capturing'&& 'Sampling 3 frames…'}
            {face.status === 'done'     && '✓ Embedding captured'}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(step === 'idle' || step === 'saved') && (
              <button className="btn btn-primary" onClick={handleStart}>
                {step === 'saved' ? 'Re-register' : 'Start'}
              </button>
            )}
            {step === 'loading' && <button className="btn" disabled>Loading…</button>}
            {step === 'camera' && (
              <>
                <button className="btn btn-primary" onClick={handleCapture}
                  disabled={!face.faceFound || face.status === 'capturing'}>
                  {face.status === 'capturing' ? 'Capturing…' : 'Capture'}
                </button>
                <button className="btn btn-red btn-sm" onClick={() => { face.stopCamera(); setStep('idle'); }}>Cancel</button>
              </>
            )}
            {step === 'captured' && (
              <>
                <button className="btn btn-green" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save & Register'}
                </button>
                <button className="btn btn-sm" onClick={() => { setEmb(null); setStep('camera'); }}>Retry</button>
              </>
            )}
            {step === 'saved' && (
              <div style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>✓ Registration complete</div>
            )}
          </div>

          {emb && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>128-d vector preview</div>
              <div className="hash-box">[{emb.slice(0, 6).map(v => v.toFixed(4)).join(', ')}, …]</div>
            </div>
          )}
        </div>

        {/* Pipeline card */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Pipeline</div>
          {steps.map((s, i) => (
            <div key={i} className="step-row">
              <div className={`step-num ${s.done ? 's-done' : i === activeIdx ? 's-active' : 's-wait'}`}>
                {s.done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 12, paddingTop: 4 }}>{s.label}</div>
            </div>
          ))}

          <div className="divider" />

          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 2 }}>
            <div style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>Security</div>
            <div>Raw images are never stored</div>
            <div>Duplicate face blocked across all accounts</div>
            <div>Dual-gate verify: cosine ≥ 75% + euclidean ≤ 0.5</div>
            <div>3-frame average reduces spoofing</div>
          </div>

          <div className="divider" />

          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 2 }}>
            <div style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>Tips</div>
            <div>Face the camera directly</div>
            <div>Good lighting, no backlighting</div>
            <div>Stay still during capture</div>
            <div>Remove glasses if detection fails</div>
          </div>
        </div>
      </div>
    </div>
  );
}
