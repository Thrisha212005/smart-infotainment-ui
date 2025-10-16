import React, { useEffect, useRef, useState } from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Camera } from 'lucide-react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { toast } from '@/hooks/use-toast';

export const GestureControl: React.FC = () => {
  const { gestureEnabled, addCommand, setCurrentPanel, speak } = useInfotainment();
  const { nextSong, previousSong, togglePlay, setVolume, isPlaying } = useMusicPlayer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectionActive, setDetectionActive] = useState(false);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const lastGestureRef = useRef<string>('');
  const lastGestureTimeRef = useRef<number>(0);

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
        numHands: 2
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
    }

    if (results.gestures && results.gestures.length > 0) {
      processDetectedGesture(results.gestures[0][0].categoryName);
    }

    requestAnimationFrame(detectGestures);
  };

  const processDetectedGesture = (gesture: string) => {
    const now = Date.now();
    
    // Debounce: only process if same gesture not detected in last 2 seconds
    if (gesture === lastGestureRef.current && now - lastGestureTimeRef.current < 2000) {
      return;
    }

    lastGestureRef.current = gesture;
    lastGestureTimeRef.current = now;

    console.log('✋ Gesture detected:', gesture);
    addCommand('gesture', `${gesture}`);

    let actionTaken = false;
    let actionMessage = '';

    switch (gesture) {
      case 'Thumb_Up':
        // Open Music Panel
        setCurrentPanel('music');
        speak('Opening music player');
        actionMessage = 'Opening Music Panel';
        actionTaken = true;
        break;
        
      case 'Thumb_Down':
        // Pause Music
        if (isPlaying) {
          togglePlay();
          speak('Music paused');
          actionMessage = 'Music Paused';
        } else {
          speak('Music is already paused');
          actionMessage = 'Music Already Paused';
        }
        actionTaken = true;
        break;
        
      case 'Victory':
        // Open Navigation Panel (two-finger gesture)
        setCurrentPanel('navigation');
        speak('Opening navigation panel');
        actionMessage = 'Opening Navigation';
        actionTaken = true;
        break;
        
      case 'Open_Palm':
        // Return to Dashboard (hand wave)
        setCurrentPanel('dashboard');
        speak('Returning to dashboard');
        actionMessage = 'Back to Dashboard';
        actionTaken = true;
        break;
        
      case 'Closed_Fist':
        // Open Contacts/Phone Panel
        setCurrentPanel('phone');
        speak('Opening contacts');
        actionMessage = 'Opening Contacts';
        actionTaken = true;
        break;
        
      case 'Pointing_Up':
        // Open Climate Control
        setCurrentPanel('climate');
        speak('Opening climate control');
        actionMessage = 'Climate Control';
        actionTaken = true;
        break;
        
      case 'ILoveYou':
        // Open Vehicle Info
        setCurrentPanel('vehicle');
        speak('Opening vehicle information');
        actionMessage = 'Vehicle Info';
        actionTaken = true;
        break;
        
      default:
        console.log('⚠️ Unknown gesture:', gesture);
        actionMessage = 'Unknown Gesture';
        break;
    }

    if (actionTaken) {
      toast({
        title: "👋 Gesture Recognized",
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
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium">
            {detectionActive ? 'AI DETECTING' : 'CAMERA ACTIVE'}
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 glass px-4 py-3 rounded-xl">
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p className="font-semibold">Gesture Commands:</p>
          <p>👍 Music Panel | 👎 Pause Music | ✌️ Navigation | ✋ Dashboard</p>
          <p>✊ Contacts | ☝️ Climate | 🤟 Vehicle Info</p>
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
