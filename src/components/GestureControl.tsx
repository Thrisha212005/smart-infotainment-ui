import React, { useEffect, useRef, useState } from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Camera } from 'lucide-react';

export const GestureControl: React.FC = () => {
  const { gestureEnabled, addCommand, setCurrentPanel, speak } = useInfotainment();
  const { nextSong, previousSong, togglePlay, setVolume } = useMusicPlayer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    if (gestureEnabled) {
      startCamera();
      simulateGestureDetection();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [gestureEnabled]);

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

  const simulateGestureDetection = () => {
    // Simulated gesture detection for demo purposes
    // In production, this would use MediaPipe or TensorFlow.js
    const gestures = [
      'Right hand swipe',
      'Left hand swipe',
      'Closed fist',
      'Two fingers',
      'One finger up',
      'Waving hand'
    ];

    // Random gesture simulation every 8-15 seconds when enabled
    const interval = setInterval(() => {
      if (!gestureEnabled) return;
      
      const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
      processGesture(randomGesture);
    }, Math.random() * 7000 + 8000);

    return () => clearInterval(interval);
  };

  const processGesture = (gesture: string) => {
    addCommand('gesture', gesture);

    switch (gesture) {
      case 'Right hand swipe':
        nextSong();
        speak('Next song');
        break;
      case 'Left hand swipe':
        previousSong();
        speak('Previous song');
        break;
      case 'Closed fist':
        togglePlay();
        speak('Playback toggled');
        break;
      case 'Two fingers':
        setCurrentPanel('navigation');
        speak('Opening navigation');
        break;
      case 'Both hands':
        togglePlay();
        speak('Playback stopped');
        break;
      case 'One finger up':
        setVolume(prev => Math.min(100, prev + 10));
        speak('Volume up');
        break;
      case 'One finger down':
        setVolume(prev => Math.max(0, prev - 10));
        speak('Volume down');
        break;
      case 'Waving hand':
        speak('Voice assistant activated');
        break;
    }
  };

  if (!gestureEnabled) {
    return (
      <div className="glass rounded-2xl p-6 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Gesture control disabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 h-full relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 glass px-3 py-1 rounded-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium">LIVE</span>
        </div>
      </div>
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover rounded-xl"
      />
      
      {!cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-xl">
          <div className="text-center">
            <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Initializing camera...</p>
          </div>
        </div>
      )}
    </div>
  );
};
