import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useFaceRecognition from '../services/useFaceRecognition';
import { registerFace, getVoterProfile } from '../services/api';

export default function FaceRegister() {
  const { videoRef, modelsLoaded, cameraActive, faceDetected, status, loadModels, startCamera, stopCamera, captureEmbedding } = useFaceRecognition();
  const [phase,      setPhase]      = useState('idle'); // idle|loading|camera|captured|saved
  const [embedding,  setEmbedding]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [profile,    setProfile]    = useState(null);

  useEffect(() => {
    getVoterProfile().then(r => setProfile(r.data.voter)).catch(() => {});
    return () => stopCamera();
  }, [stopCamera]);

  const handleStart = async () => {
    setPhase('loading');
    try {
      toast.info('Loading AI face recognition models...');
      await loadModels();
      toast.success('Models loaded! Starting camera...');
      await startCamera();
      setPhase('camera');
    } catch (err) {
      toast.error(err.message);
      setPhase('idle');
    }
  };

  const handleCapture = async () => {
    try {
      toast.info('Capturing face — hold still...');
      const emb = await captureEmbedding();
      setEmbedding(emb);
      setPhase('captured');
      toast.success('Face captured! Review and save.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSave = async () => {
    if (!embedding) return;
    setSaving(true);
    try {
      await registerFace(embedding);
      toast.success('✅ Face registered! You can now cast votes.');
      setPhase('saved');
      stopCamera();
      getVoterProfile().then(r => setProfile(r.data.voter)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setSaving(false); }
  };

  const handleRetry = () => { setEmbedding(null); setPhase('camera'); };

  const STEPS = [
    { label: 'Load face-api.js AI models (Tiny Face Detector + Recognition)', done: modelsLoaded },
    { label: 'Open webcam — align face in the frame', done: cameraActive },
    { label: 'Capture 128-dimensional face embedding vector (3 frame average)', done: !!embedding },
    { label: 'Encrypt & store embedding in MongoDB — raw image never saved', done: phase === 'saved' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Face Registration</h2>

      {profile?.faceRegistered && phase !== 'saved' && (
        <div style={{ background: 'rgba(63,185,80,.1)', border: '1px solid var(--green)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: 'var(--green)' }}>
          ✓ You already have a registered face. Re-registering will replace it.
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">🤳 Webcam</div>
            {faceDetected && cameraActive && <span className="badge badge-green">● Face Detected</span>}
            {!faceDetected && cameraActive && <span className="badge badge-amber">● No Face</span>}
          </div>

          {/* Video */}
          <div style={{ position: 'relative', width: 280, height: 210, margin: '0 auto 16px', borderRadius: 12, overflow: 'hidden', background: '#000', border: `2px solid ${faceDetected && cameraActive ? 'var(--green)' : 'var(--border2)'}`, transition: 'border-color .3s' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} muted playsInline />
            {!cameraActive && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text3)', fontSize: 11 }}>
                <span style={{ fontSize: 36 }}>📷</span>
                <span>{phase === 'loading' ? 'Loading models...' : 'Camera off'}</span>
              </div>
            )}
            {cameraActive && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: 160, height: 190, border: `2px solid ${faceDetected ? 'var(--green)' : 'var(--blue)'}`, borderRadius: '50%', transition: 'border-color .3s', position: 'relative' }}>
                  {/* Corner markers */}
                  {[['tl','top:0;left:0','2px 0 0 2px'],['tr','top:0;right:0','2px 2px 0 0'],['bl','bottom:0;left:0','0 0 2px 2px'],['br','bottom:0;right:0','0 2px 2px 0']].map(([k,pos,bw]) => (
                    <div key={k} style={{ position:'absolute',width:16,height:16,...Object.fromEntries(pos.split(';').map(p=>{const[k2,v]=p.split(':');return[k2.trim(),v?.trim()]})),borderStyle:'solid',borderColor:faceDetected?'var(--green)':'var(--blue)',borderWidth:bw,transition:'border-color .3s' }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status text */}
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text2)', marginBottom: 14, minHeight: 20 }}>
            {status === 'idle'           && 'Click Start Registration to begin'}
            {status === 'loading-models' && '⏳ Loading AI models (first time may take ~30s)...'}
            {status === 'camera-starting'&& '⏳ Starting camera...'}
            {status === 'scanning'       && (faceDetected ? '✅ Face detected — click Capture' : '🔍 Looking for face...')}
            {status === 'capturing'      && '📸 Capturing 3 frames for accuracy...'}
            {status === 'success'        && '✅ Face captured successfully'}
            {status === 'error'          && '❌ Error — see toast message'}
            {status === 'ready-for-camera' && '✅ Models loaded — click Start Camera'}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {phase === 'idle' && (
              <button className="btn btn-primary btn-lg" onClick={handleStart}>
                Start Registration
              </button>
            )}
            {phase === 'loading' && (
              <button className="btn" disabled>Loading AI Models...</button>
            )}
            {phase === 'camera' && (
              <>
                <button className="btn btn-primary" onClick={handleCapture}
                  disabled={status === 'capturing' || !faceDetected}
                  title={!faceDetected ? 'Wait for face to be detected' : ''}>
                  {status === 'capturing' ? '📸 Capturing...' : '📸 Capture Face'}
                </button>
                <button className="btn btn-red btn-sm" onClick={() => { stopCamera(); setPhase('idle'); }}>Cancel</button>
              </>
            )}
            {phase === 'captured' && (
              <>
                <button className="btn btn-green" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save & Register'}
                </button>
                <button className="btn btn-sm" onClick={handleRetry}>↺ Retry</button>
              </>
            )}
            {phase === 'saved' && (
              <div style={{ textAlign: 'center', color: 'var(--green)', fontWeight: 700 }}>
                ✅ Registration Complete!
              </div>
            )}
          </div>

          {/* Embedding preview */}
          {embedding && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>
                128-d embedding vector (preview — first 8 values):
              </div>
              <div className="hash-box">
                [{embedding.slice(0, 8).map(v => v.toFixed(5)).join(', ')}, …]
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">📋 Pipeline Steps</div></div>
          {STEPS.map((s, i) => (
            <div key={i} className="step-item">
              <div className={`step-num ${s.done ? 'step-done' : i === STEPS.findIndex(x => !x.done) ? 'step-active' : 'step-wait'}`}>
                {s.done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}

          <hr className="divider" />

          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 2 }}>
            <div>🔒 <b style={{ color: 'var(--text2)' }}>Privacy Guarantee:</b></div>
            <div>• Raw images are <b style={{ color: 'var(--red)' }}>NEVER stored</b> anywhere</div>
            <div>• Only the 128-float vector is saved in MongoDB</div>
            <div>• Similarity threshold for voting: <b style={{ color: 'var(--blue)' }}>≥ 0.6</b></div>
            <div>• 3-frame averaging for accuracy</div>
            <div>• TinyFaceDetector model — fast & private</div>
          </div>

          <hr className="divider" />

          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 2 }}>
            <div>💡 <b style={{ color: 'var(--text2)' }}>Tips for best results:</b></div>
            <div>• Face the camera directly</div>
            <div>• Ensure good lighting (no backlighting)</div>
            <div>• Remove glasses if detection fails</div>
            <div>• Stay still during capture</div>
          </div>
        </div>
      </div>
    </div>
  );
}
