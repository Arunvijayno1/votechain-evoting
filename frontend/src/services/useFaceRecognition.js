import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * useFaceRecognition
 * Uses @vladmandic/face-api — modern maintained fork, no tensor shape issues.
 * Models auto-loaded from CDN — no manual file placement needed.
 */

let faceapi = null;
let modelsGloballyLoaded = false;
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

const loadFaceApi = async () => {
  if (!faceapi) faceapi = await import('@vladmandic/face-api');
  return faceapi;
};

const useFaceRecognition = () => {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(modelsGloballyLoaded);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [status,       setStatus]       = useState('idle');

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const loadModels = useCallback(async () => {
    if (modelsGloballyLoaded) { setModelsLoaded(true); return; }
    setStatus('loading-models');
    try {
      const api = await loadFaceApi();
      // Try local /models first, fall back to CDN
      const localUrl = window.location.origin + '/models';
      const tryLoad = async (net) => {
        try { await net.loadFromUri(localUrl); }
        catch { await net.loadFromUri(MODEL_URL); }
      };
      await Promise.all([
        tryLoad(api.nets.tinyFaceDetector),
        tryLoad(api.nets.faceLandmark68TinyNet),
        tryLoad(api.nets.faceRecognitionNet),
      ]);
      modelsGloballyLoaded = true;
      setModelsLoaded(true);
      setStatus('ready-for-camera');
    } catch (err) {
      setStatus('error');
      throw new Error('Failed to load AI models: ' + err.message);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) throw new Error('Video element not mounted');
    setStatus('camera-starting');
    try {
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
      setCameraActive(true);
      setStatus('scanning');
      // Live face detection feedback every 400ms
      const api = await loadFaceApi();
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused) return;
        try {
          const det = await api.detectSingleFace(
            videoRef.current,
            new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
          );
          setFaceDetected(!!det);
        } catch { /* ignore frame errors */ }
      }, 400);
    } catch (err) {
      setStatus('error');
      if (err.name === 'NotAllowedError')
        throw new Error('Camera permission denied. Allow camera access in browser settings.');
      throw new Error('Camera error: ' + err.message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)  { videoRef.current.srcObject = null; }
    setCameraActive(false);
    setFaceDetected(false);
    setStatus('idle');
  }, []);

  /**
   * Capture 128-d face embedding — averages 3 frames for stability
   */
  const captureEmbedding = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded) throw new Error('Camera or models not ready');
    setStatus('capturing');
    const api = await loadFaceApi();
    const opts = new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    const samples = [];
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 250));
      const det = await api.detectSingleFace(videoRef.current, opts)
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      if (det) samples.push(Array.from(det.descriptor));
    }
    if (samples.length === 0) {
      setStatus('scanning');
      throw new Error('No face detected. Position face clearly in frame with good lighting.');
    }
    // Average the samples for robustness
    const avg = samples[0].map((_, i) => samples.reduce((s, e) => s + e[i], 0) / samples.length);
    setStatus('success');
    return avg;
  }, [modelsLoaded]);

  return { videoRef, modelsLoaded, cameraActive, faceDetected, status, loadModels, startCamera, stopCamera, captureEmbedding };
};

export default useFaceRecognition;
