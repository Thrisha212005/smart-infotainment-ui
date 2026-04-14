import React, { useEffect, useRef, useState } from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Camera } from 'lucide-react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { toast } from '@/hooks/use-toast';

export const GestureControl: React.FC = () => {
  const { gestureEnabled, addCommand, setCurrentPanel, speak, setLastInputType, voiceEnabled, setVoiceEnabled, setVoiceOverlayActive } = useInfotainment();
  const { nextSong, previousSong, togglePlay, setVolume, isPlaying, volume } = useMusicPlayer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectionActive, setDetectionActive] = useState(false);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const lastGestureRef = useRef<string>('');
  const lastGestureTimeRef = useRef<number>(0);
  const gestureConfirmationRef = useRef<{ gesture: string; count: number }>({ gesture: '', count: 0 });
  const [volumeControlActive, setVolumeControlActive] = useState(false);
  const micActivationGestureRef = useRef<{ detected: boolean; startTime: number }>({ detected: false, startTime: 0 });
  const isPlayingRef = useRef(isPlaying);

  // Keep ref in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (gestureEnabled) {
      initializeGestureRecognition();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      gestureRecognizerRef.current = null;
    };
  }, [gestureEnabled]);

  const initializeGestureRecognition = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      
      gestureRecognizerRef.current = recognizer;
      await startCamera();
      setDetectionActive(true);
      detectGestures();
    } catch (error) {
      console.error('Error initializing gesture recognition:', error);
      setDetectionActive(false);
    }
  };

  const detectGestures = () => {
    if (!gestureEnabled || !videoRef.current || !canvasRef.current || !gestureRecognizerRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) {
      requestAnimationFrame(detectGestures);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const nowInMs = Date.now();
    const results = gestureRecognizerRef.current.recognizeForVideo(video, nowInMs);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let isPinchDetected = false;

    if (results.landmarks && results.landmarks.length > 0) {
      const drawingUtils = new DrawingUtils(ctx);
      
      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 3
        });
        drawingUtils.drawLandmarks(landmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3
        });
      }

      // Check for pinch gesture via detected gesture name
      if (results.gestures && results.gestures.length > 0) {
        const detectedGesture = results.gestures[0][0].categoryName;
        
        // Only do volume control for pinch-like gestures (None with close thumb-index)
        // We'll check thumb-index distance only when no other gesture is strongly detected
        if (detectedGesture === 'None' || detectedGesture === '') {
          const landmarks = results.landmarks[0];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          
          if (thumbTip && indexTip) {
            const distance = Math.sqrt(
              Math.pow((thumbTip.x - indexTip.x) * canvas.width, 2) +
              Math.pow((thumbTip.y - indexTip.y) * canvas.height, 2)
            );

            // Only activate pinch volume when fingers are very close (< 80px)
            if (distance < 80) {
              isPinchDetected = true;
              setVolumeControlActive(true);

              // Draw line between fingertips
              ctx.beginPath();
              ctx.moveTo(thumbTip.x * canvas.width, thumbTip.y * canvas.height);
              ctx.lineTo(indexTip.x * canvas.width, indexTip.y * canvas.height);
              ctx.strokeStyle = '#FFD700';
              ctx.lineWidth = 3;
              ctx.stroke();

              const minDist = 10;
              const maxDist = 80;
              const normalized = Math.max(minDist, Math.min(maxDist, distance));
              const volumeLevel = Math.round(((normalized - minDist) / (maxDist - minDist)) * 100);
              setVolume(volumeLevel);

              // Volume overlay
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(10, 10, 200, 60);
              ctx.fillStyle = '#FFFFFF';
              ctx.font = '20px Arial';
              ctx.fillText(`Volume: ${volumeLevel}%`, 20, 35);
              ctx.fillStyle = '#FFD700';
              ctx.fillRect(20, 45, (volumeLevel / 100) * 180, 15);
            }
          }
        }
      }
    }

    if (!isPinchDetected) {
      setVolumeControlActive(false);
    }

    // Process named gestures only when pinch is not active
    if (results.gestures && results.gestures.length > 0 && !isPinchDetected) {
      const detectedGesture = results.gestures[0][0].categoryName;
      
      if (detectedGesture === 'Victory') {
        handleMicActivationGesture();
      } else {
        processDetectedGesture(detectedGesture);
      }
    }

    requestAnimationFrame(detectGestures);
  };

  const handleMicActivationGesture = () => {
    const now = Date.now();
    
    if (!micActivationGestureRef.current.detected) {
      micActivationGestureRef.current = { detected: true, startTime: now };
    } else if (now - micActivationGestureRef.current.startTime >= 500) {
      if (!voiceEnabled) {
        setVoiceEnabled(true);
        setVoiceOverlayActive(true);
        speak('Voice recognition activated');
        addCommand('gesture', '✌️ Victory Hold → Mic Activated');
        toast({
          title: "🎤 Mic Activated",
          description: "Voice recognition enabled",
          duration: 2000,
        });
      }
      micActivationGestureRef.current = { detected: false, startTime: 0 };
    }
  };

  const processDetectedGesture = (gesture: string) => {
    micActivationGestureRef.current = { detected: false, startTime: 0 };
    
    if (gesture === 'None' || !gesture) {
      gestureConfirmationRef.current = { gesture: '', count: 0 };
      return;
    }

    // 3-frame confirmation
    if (gestureConfirmationRef.current.gesture === gesture) {
      gestureConfirmationRef.current.count++;
    } else {
      gestureConfirmationRef.current = { gesture, count: 1 };
      return;
    }

    if (gestureConfirmationRef.current.count < 3) return;

    const now = Date.now();
    // 800ms cooldown
    if (gesture === lastGestureRef.current && now - lastGestureTimeRef.current < 800) return;

    lastGestureRef.current = gesture;
    lastGestureTimeRef.current = now;
    gestureConfirmationRef.current = { gesture: '', count: 0 };
    setLastInputType('gesture');

    console.log('✋ Gesture detected:', gesture);

    let actionMessage = '';

    switch (gesture) {
      case 'Thumb_Up':
        setCurrentPanel('music');
        speak('Opening music player');
        actionMessage = '👍 Opening Music Panel';
        addCommand('gesture', '👍 Thumb Up → Music Panel');
        break;
        
      case 'Thumb_Down': {
        const playing = isPlayingRef.current;
        togglePlay();
        if (playing) {
          speak('Music paused');
          actionMessage = '👎 ⏸️ Music Paused';
          addCommand('gesture', '👎 Thumb Down → Paused');
        } else {
          speak('Playing music');
          actionMessage = '👎 ▶️ Music Playing';
          addCommand('gesture', '👎 Thumb Down → Playing');
        }
        break;
      }
        
      case 'Open_Palm':
        nextSong();
        speak('Next song');
        actionMessage = '🖐️ Next Song';
        addCommand('gesture', '🖐️ Open Palm → Next Song');
        break;
        
      case 'Closed_Fist':
        previousSong();
        speak('Previous song');
        actionMessage = '✊ Previous Song';
        addCommand('gesture', '✊ Closed Fist → Previous Song');
        break;
      
      case 'Pointing_Up':
        setCurrentPanel('dashboard');
        speak('Opening dashboard');
        actionMessage = '☝️ Dashboard';
        addCommand('gesture', '☝️ Pointing Up → Dashboard');
        break;
        
      default:
        console.log('⚠️ Unmapped gesture:', gesture);
        return;
    }

    if (actionMessage) {
      toast({
        title: "✋ Gesture Detected",
        description: actionMessage,
        duration: 2000,
      });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  if (!gestureEnabled) {
    return (
      <div className="glass rounded-2xl p-6 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Gesture control disabled</p>
          <p className="text-xs mt-2 opacity-70">Enable to activate camera</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 h-full relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 glass px-3 py-1 rounded-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-xs font-medium">
            {detectionActive ? 'AI DETECTING' : 'CAMERA ACTIVE'}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 glass px-4 py-3 rounded-xl">
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p className="font-semibold">Gesture Commands:</p>
          <p>👍 Music | 👎 Play/Pause | 🖐️ Next Song | ✊ Previous Song</p>
          <p>🤏 Pinch: Volume | ☝️ Dashboard | ✌️ Hold 0.5s: Mic</p>
        </div>
      </div>
      
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-xl"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-cover rounded-xl pointer-events-none"
        />
      </div>
      
      {!cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-xl">
          <div className="text-center">
            <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Initializing AI gesture recognition...</p>
          </div>
        </div>
      )}
    </div>
  );
};
