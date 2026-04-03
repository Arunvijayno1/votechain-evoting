import { useRef, useState, useCallback, useEffect } from 'react';

let faceapi = null;
let modelsLoaded = false;
const CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

const getApi = async () => {
  if (!faceapi) faceapi = await import('@vladmandic/face-api');
  return faceapi;
};

export default function useFaceRecognition() {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const timerRef   = useRef(null);

  const [ready,       setReady]       = useState(modelsLoaded);
  const [cameraOn,    setCameraOn]    = useState(false);
  const [faceFound,   setFaceFound]   = useState(false);
  const [status,      setStatus]      = useState('idle');

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  const loadModels = useCallback(async () => {
    if (modelsLoaded) { setReady(true); return; }
    setStatus('loading');
    const api = await getApi();
    const local = window.location.origin + '/models';
    const load  = async (net) => { try { await net.loadFromUri(local); } catch { await net.loadFromUri(CDN); } };
    await Promise.all([
      load(api.nets.tinyFaceDetector),
      load(api.nets.faceLandmark68TinyNet),
      load(api.nets.faceRecognitionNet),
    ]);
    modelsLoaded = true;
    setReady(true);
    setStatus('idle');
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) throw new Error('Video element not mounted');
    setStatus('starting');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    });
    videoRef.current.srcObject = stream;
    streamRef.current = stream;
    await new Promise((res, rej) => {
      videoRef.current.onloadedmetadata = res;
      videoRef.current.onerror = rej;
    });
    await videoRef.current.play();
    setCameraOn(true);
    setStatus('scanning');

    const api = await getApi();
    timerRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused) return;
      try {
        const det = await api.detectSingleFace(
          videoRef.current,
          new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
        );
        setFaceFound(!!det);
      } catch {}
    }, 400);
  }, []);

  const stopCamera = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setFaceFound(false);
    setStatus('idle');
  }, []);

  const captureEmbedding = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded) throw new Error('Camera or models not ready');
    setStatus('capturing');
    const api  = await getApi();
    const opts = new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    const samples = [];
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 250));
      const det = await api.detectSingleFace(videoRef.current, opts).withFaceLandmarks(true).withFaceDescriptor();
      if (det) samples.push(Array.from(det.descriptor));
    }
    if (!samples.length) {
      setStatus('scanning');
      throw new Error('No face detected. Face the camera in good lighting.');
    }
    const avg = samples[0].map((_, i) => samples.reduce((s, e) => s + e[i], 0) / samples.length);
    setStatus('done');
    return avg;
  }, []);

  return { videoRef, ready, cameraOn, faceFound, status, loadModels, startCamera, stopCamera, captureEmbedding };
}
