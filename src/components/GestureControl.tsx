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
  const handPositionRef = useRef<{ x: number; y: number; timestamp: number } | null>(null);
  const [movementArrow, setMovementArrow] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const lastPositionTriggerRef = useRef<number>(0);
  const [handSide, setHandSide] = useState<'left' | 'right' | null>(null);
  const [handDetected, setHandDetected] = useState(false);

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
      setHandDetected(true);
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

        // Track hand position for swipe and movement detection
        const wrist = landmarks[0];
        if (wrist) {
          const currentX = wrist.x * canvas.width;
          const currentY = wrist.y * canvas.height;
          
          // Position-based detection: left/right side of frame
          const centerX = canvas.width / 2;
          const detectionThreshold = canvas.width * 0.15; // Hand must be at least 15% from center
          
          if (currentX < centerX - detectionThreshold) {
            // Hand on LEFT side
            if (nowInMs - lastPositionTriggerRef.current > 1500) {
              setHandSide('left');
              handlePositionGesture('left');
              lastPositionTriggerRef.current = nowInMs;
            }
          } else if (currentX > centerX + detectionThreshold) {
            // Hand on RIGHT side
            if (nowInMs - lastPositionTriggerRef.current > 1500) {
              setHandSide('right');
              handlePositionGesture('right');
              lastPositionTriggerRef.current = nowInMs;
            }
          } else {
            setHandSide(null);
          }
          
          // Keep swipe detection
          if (handPositionRef.current) {
            const deltaX = currentX - handPositionRef.current.x;
            const deltaY = currentY - handPositionRef.current.y;
            const deltaTime = nowInMs - handPositionRef.current.timestamp;
            
            const threshold = 100;
            
            // Detect movement direction
            if (deltaTime < 500) {
              if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
                // Horizontal movement
                if (deltaX > 0) {
                  handleSwipeGesture('right'); // Next song
                } else {
                  handleSwipeGesture('left'); // Previous song
                }
                handPositionRef.current = null;
              } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
                // Vertical movement
                if (deltaY < 0) {
                  handleSwipeGesture('up'); // Play music
                } else {
                  handleSwipeGesture('down'); // Pause music
                }
                handPositionRef.current = null;
              }
            } else if (deltaTime > 500) {
              handPositionRef.current = { x: currentX, y: currentY, timestamp: nowInMs };
            }
          } else {
            handPositionRef.current = { x: currentX, y: currentY, timestamp: nowInMs };
          }
        }

        // Thumb-index pinch gesture detection for volume control
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        
        if (thumbTip && indexTip && middleTip && ringTip && pinkyTip) {
          const thumbIndexDist = Math.sqrt(
            Math.pow((thumbTip.x - indexTip.x) * canvas.width, 2) +
            Math.pow((thumbTip.y - indexTip.y) * canvas.height, 2)
          );

          // Check other fingers are extended (to ensure it's a deliberate pinch, not a fist)
          const middleExtended = middleTip.y < landmarks[10].y; // Middle tip above middle knuckle
          const ringExtended = ringTip.y < landmarks[14].y;
          const pinkyExtended = pinkyTip.y < landmarks[18].y;
          
          // Strict pinch detection: thumb and index close, other fingers extended
          const isPinching = thumbIndexDist < 100 && (middleExtended || ringExtended || pinkyExtended);
          
          if (isPinching) {
            setVolumeControlActive(true);
            
            // Draw line between fingertips
            ctx.beginPath();
            ctx.moveTo(thumbTip.x * canvas.width, thumbTip.y * canvas.height);
            ctx.lineTo(indexTip.x * canvas.width, indexTip.y * canvas.height);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Calculate volume (distance range: 20-100 pixels for pinch)
            const minDistance = 20;
            const maxDistance = 100;
            const normalizedDistance = Math.max(minDistance, Math.min(maxDistance, thumbIndexDist));
            const volumeLevel = Math.round(((normalizedDistance - minDistance) / (maxDistance - minDistance)) * 100);
            
            setVolume(volumeLevel);
            
            // Display volume indicator
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, 200, 60);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.fillText(`🤏 Volume: ${volumeLevel}%`, 20, 35);
            
            // Volume bar
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(20, 45, (volumeLevel / 100) * 180, 15);
          } else {
            setVolumeControlActive(false);
          }
        }
      }
    } else {
      setHandDetected(false);
    }

    // Process other gestures only when volume control is not active
    if (results.gestures && results.gestures.length > 0 && !volumeControlActive) {
      const detectedGesture = results.gestures[0][0].categoryName;
      processDetectedGesture(detectedGesture);
    }

    requestAnimationFrame(detectGestures);
  };

  const handlePositionGesture = (side: 'left' | 'right') => {
    setLastInputType('gesture');
    
    if (side === 'left') {
      if (!isPlaying) togglePlay();
      previousSong();
      speak('Playing previous song');
      addCommand('gesture', '🤚 Left Hand Position - Previous Song');
    } else {
      if (!isPlaying) togglePlay();
      nextSong();
      speak('Playing next song');
      addCommand('gesture', '🤚 Right Hand Position - Next Song');
    }
  };

  const handleSwipeGesture = (direction: 'left' | 'right' | 'up' | 'down') => {
    const now = Date.now();
    
    // Cooldown to prevent double triggering
    if (now - lastGestureTimeRef.current < 800) {
      return;
    }
    
    lastGestureTimeRef.current = now;
    setLastInputType('gesture');
    
    switch (direction) {
      case 'right':
        if (!isPlaying) togglePlay();
        nextSong();
        speak('Playing next song');
        addCommand('gesture', '👉 Right Movement - Next Song');
        break;
        
      case 'left':
        if (!isPlaying) togglePlay();
        previousSong();
        speak('Playing previous song');
        addCommand('gesture', '👈 Left Movement - Previous Song');
        break;
        
      case 'up':
        setCurrentPanel('music');
        if (!isPlaying) togglePlay();
        speak('Playing music');
        addCommand('gesture', '👆 Up Movement - Play Music');
        break;
        
      case 'down':
        if (isPlaying) togglePlay();
        speak('Music paused');
        addCommand('gesture', '👇 Down Movement - Pause Music');
        break;
    }
  };

  const handleMicActivationGesture = () => {
    const now = Date.now();
    
    if (!micActivationGestureRef.current.detected) {
      // Start tracking the gesture
      micActivationGestureRef.current = { detected: true, startTime: now };
    } else if (now - micActivationGestureRef.current.startTime >= 500) {
      // Gesture held for 0.5 seconds, activate mic
      if (!voiceEnabled) {
        setVoiceEnabled(true);
        setVoiceOverlayActive(true);
        speak('Voice recognition activated');
        addCommand('gesture', 'Mic Activation (Victory gesture held)');
        toast({
          title: "🎤 Mic Activated",
          description: "Voice recognition enabled",
          duration: 2000,
        });
      }
      // Reset after activation
      micActivationGestureRef.current = { detected: false, startTime: 0 };
    }
  };

  const processDetectedGesture = (gesture: string) => {
    // Reset mic activation gesture if different gesture detected
    micActivationGestureRef.current = { detected: false, startTime: 0 };
    // Filter out "None" gestures
    if (gesture === 'None' || !gesture) {
      gestureConfirmationRef.current = { gesture: '', count: 0 };
      return;
    }

    // 3-frame confirmation for accuracy
    if (gestureConfirmationRef.current.gesture === gesture) {
      gestureConfirmationRef.current.count++;
    } else {
      gestureConfirmationRef.current = { gesture, count: 1 };
      return;
    }

    if (gestureConfirmationRef.current.count < 3) {
      return;
    }

    const now = Date.now();
    
    // Cooldown to prevent double triggering (0.5s)
    if (gesture === lastGestureRef.current && now - lastGestureTimeRef.current < 500) {
      return;
    }

    lastGestureRef.current = gesture;
    lastGestureTimeRef.current = now;
    gestureConfirmationRef.current = { gesture: '', count: 0 };
    setLastInputType('gesture');

    console.log('✋ Gesture detected:', gesture);
    addCommand('gesture', `${gesture}`);

    let actionTaken = false;
    let actionMessage = '';

    switch (gesture) {
      case 'Thumb_Up':
        // 👍 Music Panel
        setCurrentPanel('music');
        speak('Opening music player');
        actionMessage = '👍 Music Panel';
        actionTaken = true;
        break;
        
      case 'Victory':
        // ✌️ Hold for Mic Activation
        handleMicActivationGesture();
        actionMessage = '✌️ Mic Activation (Hold)';
        actionTaken = true;
        break;
        
      case 'Thumb_Down':
        // 👎 Play/Pause
        togglePlay();
        speak(isPlaying ? 'Music paused' : 'Playing music');
        actionMessage = `👎 ${isPlaying ? 'Paused' : 'Playing'}`;
        actionTaken = true;
        break;
        
      case 'Closed_Fist':
        // ✊ Contacts Panel
        setCurrentPanel('phone');
        speak('Opening contacts');
        actionMessage = '✊ Contacts';
        actionTaken = true;
        break;
        
      case 'Pointing_Up':
        // ☝️ Climate Control
        setCurrentPanel('climate');
        speak('Opening climate control');
        actionMessage = '☝️ Climate Control';
        actionTaken = true;
        break;
        
      case 'ILoveYou':
        // 🤟 Vehicle Info
        setCurrentPanel('vehicle');
        speak('Opening vehicle information');
        actionMessage = '🤟 Vehicle Info';
        actionTaken = true;
        break;
        
      case 'Open_Palm':
        // ✋ Hold for Mic Activation
        handleMicActivationGesture();
        actionMessage = '✋ Mic Activation (Hold)';
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

      {handDetected && (
        <div className="absolute bottom-4 left-4 right-4 z-10 glass px-4 py-3 rounded-xl">
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p className="font-semibold text-primary">🎯 Hand Gesture Commands</p>
            <p><span className="font-medium">Position:</span> 🤚 Left Side: Previous | 🤚 Right Side: Next</p>
            <p><span className="font-medium">Panels:</span> 👍 Music | ✊ Contacts | ☝️ Climate | 🤟 Vehicle</p>
            <p><span className="font-medium">Controls:</span> 👎 Play/Pause | 🤏 Pinch: Volume | ✌️ Hold 0.5s: Activate Mic</p>
          </div>
        </div>
      )}
      
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
