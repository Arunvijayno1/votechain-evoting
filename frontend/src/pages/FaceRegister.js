import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useFaceRecognition from '../services/useFaceRecognition';
import { registerFace, getVoterProfile } from '../services/api';

export default function FaceRegister() {
  const { videoRef, modelsLoaded, cameraActive, faceDetected, status, loadModels, startCamera, stopCamera, captureEmbedding } = useFaceRecognition();
  const [phase,    setPhase]    = useState('idle');
  const [embedding,setEmbed]   = useState(null);
  const [saving,   setSaving]  = useState(false);
  const [profile,  setProfile] = useState(null);

  useEffect(() => {
    getVoterProfile().then(r => setProfile(r.data.voter)).catch(() => {});
    return () => stopCamera();
  }, [stopCamera]);

  const handleStart = async () => {
    setPhase('loading');
    try {
      if (!modelsLoaded) { toast.info('Loading AI models (may take ~15s first time)...'); await loadModels(); }
      await startCamera();
      setPhase('camera');
    } catch (err) { toast.error(err.message); setPhase('idle'); }
  };

  const handleCapture = async () => {
    try {
      toast.info('Hold still — capturing 3 frames...');
      const emb = await captureEmbedding();
      setEmbed(emb);
      setPhase('captured');
      toast.success('Face captured!');
    } catch (err) { toast.error(err.message); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await registerFace(embedding);
      toast.success('✓ Face registered successfully');
      setPhase('saved');
      stopCamera();
      getVoterProfile().then(r => setProfile(r.data.voter)).catch(() => {});
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (msg.includes('already registered')) {
        toast.warning('This face belongs to another account. Each person can only have one voter account.', { autoClose: 8000 });
      }
    } finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <div className="section-title">Face Registration</div>

      {profile?.faceRegistered && phase !== 'saved' && (
        <div style={{ background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:10, padding:'12px 18px', marginBottom:20, fontSize:12, color:'var(--green)' }}>
          ✓ Face already registered on {new Date(profile.registeredAt).toLocaleDateString()}. You can re-register to update it.
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">◉ Webcam</div>
            {cameraActive && (
              <span className={`badge ${faceDetected ? 'badge-green' : 'badge-amber'}`}>
                {faceDetected ? '● Face Detected' : '○ No Face'}
              </span>
            )}
          </div>

          <div className="webcam-box" style={{ width:280, height:210, margin:'0 auto 18px', border:`2px solid ${faceDetected && cameraActive ? 'var(--green)' : phase === 'camera' ? 'var(--gold-dim)' : 'var(--border2)'}` }}>
            <video ref={videoRef} className="webcam-video" style={{ display: cameraActive ? 'block' : 'none' }} muted playsInline />
            {!cameraActive && (
              <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'var(--text3)' }}>
                <span style={{ fontSize:40, opacity:.3 }}>◉</span>
                <span style={{ fontSize:12 }}>{phase === 'loading' ? 'Loading AI models...' : 'Camera inactive'}</span>
              </div>
            )}
            {cameraActive && (
              <div className="webcam-overlay">
                <div className={`face-ring ${faceDetected ? 'detected' : ''}`} style={{ width:150, height:175 }}>
                  {[['0px','0px','top'],['0px','calc(100% - 18px)','bottom'],['calc(100% - 18px)','0px','right-top'],['calc(100% - 18px)','calc(100% - 18px)','right-bottom']].map(([t,l,k]) => (
                    <div key={k} style={{ position:'absolute', top:t, left:l, width:18, height:18, border:`2px solid ${faceDetected?'var(--green)':'var(--gold)'}`, borderRadius:2, transition:'border-color .3s' }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign:'center', fontSize:12, color:'var(--text2)', marginBottom:16, minHeight:20 }}>
            {status === 'idle'           && 'Click Start to begin'}
            {status === 'loading-models' && '⏳ Loading AI models...'}
            {status === 'camera-starting'&& '⏳ Starting camera...'}
            {status === 'scanning'       && (faceDetected ? '✓ Face detected — click Capture' : '🔍 Position face in frame...')}
            {status === 'capturing'      && '📸 Sampling 3 frames for accuracy...'}
            {status === 'success'        && '✓ Face embedding generated'}
            {status === 'error'          && '✗ Error — check camera permissions'}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            {(phase === 'idle' || phase === 'saved') && (
              <button className="btn btn-gold btn-lg" onClick={handleStart}>
                {phase === 'saved' ? 'Re-Register Face' : 'Start Registration'}
              </button>
            )}
            {phase === 'loading' && <button className="btn" disabled>Loading...</button>}
            {phase === 'camera' && (
              <>
                <button className="btn btn-gold" onClick={handleCapture} disabled={!faceDetected || status === 'capturing'}>
                  {status === 'capturing' ? '📸 Sampling...' : '📸 Capture Face'}
                </button>
                <button className="btn btn-red btn-sm" onClick={() => { stopCamera(); setPhase('idle'); }}>Cancel</button>
              </>
            )}
            {phase === 'captured' && (
              <>
                <button className="btn btn-gold" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '✓ Save & Register'}</button>
                <button className="btn btn-sm" onClick={() => { setEmbed(null); setPhase('camera'); }}>↺ Retry</button>
              </>
            )}
          </div>

          {embedding && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>128-d embedding vector (first 6 values):</div>
              <div className="hash-box">[{embedding.slice(0,6).map(v=>v.toFixed(5)).join(', ')}, …+122 more]</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom:16 }}>Security Pipeline</div>
          {[
            { label:'Load TinyFaceDetector + Recognition models', done: modelsLoaded },
            { label:'Webcam — align face in oval frame', done: cameraActive },
            { label:'3-frame averaged 128-d embedding capture', done: !!embedding },
            { label:'Duplicate face check across all accounts', done: phase === 'saved' },
            { label:'Encrypted embedding stored in MongoDB', done: phase === 'saved' },
          ].map((s, i) => (
            <div key={i} className="step-item">
              <div className={`step-num ${s.done ? 'step-done' : i === [false,modelsLoaded,cameraActive,!!embedding,phase==='saved'].findIndex(x=>!x) ? 'step-active' : 'step-wait'}`}>
                {s.done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize:12, lineHeight:1.5 }}>{s.label}</div>
            </div>
          ))}

          <div className="divider" />

          <div style={{ fontSize:11, lineHeight:2, color:'var(--text3)' }}>
            <div style={{ color:'var(--gold)', fontWeight:700, marginBottom:4 }}>Security Guarantees</div>
            <div>• Raw images are <b style={{color:'var(--red)'}}>NEVER stored</b></div>
            <div>• Dual-gate: cosine ≥ 0.75 <b>AND</b> euclidean ≤ 0.5</div>
            <div>• Duplicate face detection blocks multi-accounts</div>
            <div>• 3-frame average prevents spoofing with photos</div>
          </div>

          <div className="divider" />
          <div style={{ fontSize:11, color:'var(--text3)', lineHeight:2 }}>
            <div style={{ color:'var(--gold)', fontWeight:700, marginBottom:4 }}>Tips for Best Results</div>
            <div>• Face camera directly in good lighting</div>
            <div>• No backlighting behind you</div>
            <div>• Stay still during the 3-frame capture</div>
            <div>• Remove glasses if detection fails</div>
          </div>
        </div>
      </div>
    </div>
  );
}
