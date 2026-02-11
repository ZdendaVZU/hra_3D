import { useEffect, useRef, useState } from 'react';
import './App.css';
import { Webcam } from './components/Webcam';
import { Canvas } from './components/Canvas';
import { createPoseLandmarker, createHandLandmarker, createFaceLandmarker, drawPose, drawHands, drawFace } from './utils/poseDetection';
import { PoseLandmarker, HandLandmarker, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';


import { SettingsModal } from './components/SettingsModal';
import { Scene3D } from './components/Scene3D';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [poseResult, setPoseResult] = useState<PoseLandmarkerResult | null>(null);

  // Settings state
  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [numPoses, setNumPoses] = useState(1);
  const [enableHands, setEnableHands] = useState(false);
  const [enableFace, setEnableFace] = useState(false);

  // Initialize AI Models
  useEffect(() => {
    const initModels = async () => {
      try {
        setLoading(true);
        console.log("Starting Models initialization...");

        const [pose, hand, face] = await Promise.all([
          createPoseLandmarker(numPoses),
          enableHands ? createHandLandmarker(numPoses * 2) : Promise.resolve(null),
          enableFace ? createFaceLandmarker(numPoses) : Promise.resolve(null)
        ]);

        console.log("Models initialized successfully");
        setLandmarker(pose);
        setHandLandmarker(hand);
        setFaceLandmarker(face);
        setLoading(false);
      } catch (error: any) {
        console.error("Error loading models:", error);
        setErrorMsg(`Failed to load AI Models: ${error.message || error}`);
        setLoading(false);
      }
    };
    initModels();
  }, [numPoses, enableHands, enableFace]);

  // Fetch devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    };
    // Request permission first to get labels, or call after permission is granted
    getDevices();
  }, []); // We might want to re-run this when permission is granted

  // Setup Webcam stream
  useEffect(() => {
    const setupCamera = async () => {
      if (videoRef.current) {
        // Cleanup previous stream
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }

        try {
          console.log("Requesting webcam access...");
          const constraints: MediaStreamConstraints = {
            video: {
              width: 320,
              height: 240,
              deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
            }
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log("Webcam access granted");
          videoRef.current.srcObject = stream;

          // Refresh device list to get labels if we didn't have them
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setDevices(videoDevices);

          if (!selectedDeviceId) {
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            if (settings.deviceId) {
              setSelectedDeviceId(settings.deviceId);
            }
          }

        } catch (error: any) {
          console.error("Error accessing webcam:", error);
          setErrorMsg(`Failed to access webcam: ${error.message || error}`);
        }
      }
    };
    setupCamera();
  }, [selectedDeviceId]);

  // Detection Loop
  useEffect(() => {
    if (!landmarker || !videoRef.current || !canvasRef.current) return;

    let requestAnimationFrameId: number;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const renderLoop = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        // Detect pose
        // Use timestamp to avoid MediaPipe warnings/errors
        const startTimeMs = performance.now();
        const poseResult = landmarker.detectForVideo(video, startTimeMs);
        setPoseResult(poseResult);

        let handResult = null;
        if (handLandmarker) {
          handResult = handLandmarker.detectForVideo(video, startTimeMs);
        }

        let faceResult = null;
        if (faceLandmarker) {
          faceResult = faceLandmarker.detectForVideo(video, startTimeMs);
        }

        // Clear canvas
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw result
          drawPose(ctx, poseResult);
          if (handResult) {
            drawHands(ctx, handResult);
          }
          if (faceResult) {
            drawFace(ctx, faceResult);
          }
        }
      }
      requestAnimationFrameId = requestAnimationFrame(renderLoop);
    };

    // Start loop when video is playing
    video.addEventListener('loadeddata', () => {
      renderLoop();
    });

    // If video is already ready (e.g. hot reload)
    if (video.readyState >= 2) {
      renderLoop();
    }

    return () => {
      cancelAnimationFrame(requestAnimationFrameId);
    };
  }, [landmarker, handLandmarker, faceLandmarker]);

  return (
    <div className="container" style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, color: 'white' }}>Loading AI Model...</div>}
      {errorMsg && <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', zIndex: 20, color: 'red', backgroundColor: 'rgba(0,0,0,0.8)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Error: {errorMsg}</div>}
      {/* Webcam and Debug Canvas - Hidden for Logic Only (Must be "visible" for browser to update) */}
      <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0.001, pointerEvents: 'none', zIndex: -100 }}>
        <Webcam ref={videoRef} width={320} height={240} />
        <Canvas ref={canvasRef} width={320} height={240} />
      </div>
      <button
        onClick={() => setIsSettingsOpen(true)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 50,
          background: 'rgba(50,50,50,0.8)',
          border: '2px solid white',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={setSelectedDeviceId}
        maxPoses={numPoses}
        onMaxPosesChange={setNumPoses}
        enableHands={enableHands}
        onEnableHandsChange={setEnableHands}
        enableFace={enableFace}
        onEnableFaceChange={setEnableFace}
      />

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#111' }}>
        <Scene3D poseResult={poseResult} />
      </div>


    </div>
  );
}

export default App;
