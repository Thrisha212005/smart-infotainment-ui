import React, { useEffect, useRef } from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { usePhone } from '@/contexts/PhoneContext';
import { useClimate } from '@/contexts/ClimateContext';

export const VoiceControl: React.FC = () => {
  const { voiceEnabled, addCommand, setCurrentPanel, speak, toggleDarkMode } = useInfotainment();
  const { nextSong, previousSong, togglePlay, setVolume, isPlaying } = useMusicPlayer();
  const { navigateTo } = useNavigation();
  const { callContact, answerCall, rejectCall } = usePhone();
  const { setTemperature, setFanSpeed, toggleAC } = useClimate();
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      
      addCommand('voice', command);
      processVoiceCommand(command);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (voiceEnabled && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Recognition already started');
      }
    } else if (!voiceEnabled && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Recognition already stopped');
      }
    }
  }, [voiceEnabled]);

  const processVoiceCommand = (command: string) => {
    // Music commands
    if (command.includes('play next') || command.includes('next song')) {
      nextSong();
      speak('Playing next song');
    } else if (command.includes('previous song') || command.includes('play previous')) {
      previousSong();
      speak('Playing previous song');
    } else if (command.includes('pause music')) {
      if (isPlaying) togglePlay();
      speak('Music paused');
    } else if (command.includes('resume music') || command.includes('play music')) {
      if (!isPlaying) togglePlay();
      speak('Resuming music');
    } else if (command.includes('mute audio')) {
      setVolume(0);
      speak('Audio muted');
    } else if (command.includes('increase volume')) {
      setVolume(prev => Math.min(100, prev + 20));
      speak('Volume increased');
    } else if (command.includes('decrease volume')) {
      setVolume(prev => Math.max(0, prev - 20));
      speak('Volume decreased');
    }
    
    // Navigation commands
    else if (command.includes('go to navigation') || command.includes('open navigation')) {
      setCurrentPanel('navigation');
      speak('Opening navigation');
    } else if (command.includes('navigate to') || command.includes('go to')) {
      if (command.includes('home')) {
        navigateTo('Home');
        speak('Navigating to home');
      } else if (command.includes('work')) {
        navigateTo('Work');
        speak('Navigating to work');
      } else if (command.includes('fuel') || command.includes('gas station')) {
        navigateTo('Nearest Fuel Station');
        speak('Finding nearest fuel station');
      } else if (command.includes('coffee')) {
        navigateTo('Coffee Shop');
        speak('Finding nearest coffee shop');
      } else if (command.includes('restaurant')) {
        navigateTo('Restaurant');
        speak('Finding nearby restaurant');
      } else if (command.includes('mall') || command.includes('shopping')) {
        navigateTo('Shopping Mall');
        speak('Navigating to shopping mall');
      } else if (command.includes('gym')) {
        navigateTo('Gym');
        speak('Navigating to gym');
      } else if (command.includes('hospital')) {
        navigateTo('Hospital');
        speak('Finding nearest hospital');
      }
    }
    
    // Phone commands
    else if (command.includes('call')) {
      const names = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown'];
      const foundName = names.find(name => 
        command.includes(name.toLowerCase())
      );
      if (foundName) {
        callContact(foundName);
        speak(`Calling ${foundName}`);
      }
    } else if (command.includes('answer call')) {
      answerCall();
      speak('Call answered');
    } else if (command.includes('reject call') || command.includes('decline call')) {
      rejectCall();
      speak('Call rejected');
    }
    
    // Climate commands
    else if (command.includes('turn on ac') || command.includes('turn on air conditioning')) {
      toggleAC();
      speak('Air conditioning turned on');
    } else if (command.includes('set temperature')) {
      const tempMatch = command.match(/(\d+)/);
      if (tempMatch) {
        const temp = parseInt(tempMatch[1]);
        setTemperature(temp);
        speak(`Temperature set to ${temp} degrees`);
      }
    } else if (command.includes('fan speed')) {
      const speedMatch = command.match(/(\d+)/);
      if (speedMatch) {
        const speed = parseInt(speedMatch[1]);
        setFanSpeed(Math.min(5, speed));
        speak(`Fan speed set to ${speed}`);
      }
    }
    
    // System commands
    else if (command.includes('go to dashboard') || command.includes('open dashboard')) {
      setCurrentPanel('dashboard');
      speak('Opening dashboard');
    } else if (command.includes('vehicle info') || command.includes('car info')) {
      setCurrentPanel('vehicle');
      speak('Opening vehicle information');
    } else if (command.includes('night mode') || command.includes('dark mode')) {
      toggleDarkMode();
      speak('Night mode toggled');
    }
  };

  return null;
};
