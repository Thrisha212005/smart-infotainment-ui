import React, { useEffect, useRef, useState } from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { usePhone } from '@/contexts/PhoneContext';
import { useClimate } from '@/contexts/ClimateContext';
import { toast } from '@/hooks/use-toast';
import { VoiceCommandMatcher } from './VoiceCommandMatcher';
import { getTopMatches, shouldAutoExecute, CommandMatch } from '@/utils/voiceCommandEngine';

export const VoiceControl: React.FC = () => {
  const { voiceEnabled, addCommand, setCurrentPanel, speak, currentPanel } = useInfotainment();
  const { nextSong, previousSong, togglePlay, setVolume, isPlaying } = useMusicPlayer();
  const { navigateTo } = useNavigation();
  const { callContact, answerCall, rejectCall } = usePhone();
  const { setTemperature, setFanSpeed, toggleAC } = useClimate();
  
  const recognitionRef = useRef<any>(null);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [commandMatches, setCommandMatches] = useState<CommandMatch[]>([]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      speak('Voice control is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      console.log('Voice recognition started');
    };

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      
      // Process immediately without waiting
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      
      // Normalize command: lowercase, trim, remove punctuation
      const command = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '');
      
      console.log('✅ Voice command detected:', command, '| Confidence:', confidence.toFixed(2));
      setLastCommand(command);
      
      // Process immediately
      processVoiceCommand(command, confidence);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        speak('Microphone access denied. Please allow microphone access to use voice control.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
      }
    };

    recognition.onend = () => {
      // Restart if voice is still enabled
      if (voiceEnabled && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition restart delayed');
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }
    };
  }, [voiceEnabled]);

  useEffect(() => {
    if (voiceEnabled && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        speak('Voice control activated. Listening for commands.');
        console.log('Starting voice recognition');
      } catch (e) {
        console.log('Recognition start error:', e);
      }
    } else if (!voiceEnabled && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('Stopping voice recognition');
      } catch (e) {
        console.log('Recognition stop error:', e);
      }
    }
  }, [voiceEnabled]);

  const buildCommandPatterns = () => {
    return [
      // Music commands
      {
        keywords: ['play', 'music'],
        synonyms: ['start', 'begin'],
        action: () => {
          setCurrentPanel('music');
          if (!isPlaying) togglePlay();
          speak('Opening music player and starting playback');
        },
        description: 'Opens music panel and starts playback',
      },
      {
        keywords: ['pause', 'music'],
        synonyms: ['stop', 'halt', 'pause', 'stop playing'],
        action: () => {
          if (isPlaying) {
            togglePlay();
            speak('Music paused');
          } else {
            speak('Music is already paused');
          }
        },
        description: 'Pauses current music playback',
        confidenceBoost: 0.1, // Enhanced for problematic command
        minConfidence: 0.6, // Lower threshold
      },
      {
        keywords: ['next', 'song'],
        synonyms: ['skip', 'play next', 'next track'],
        action: () => {
          nextSong();
          speak('Playing next song');
        },
        description: 'Plays the next song',
      },
      {
        keywords: ['previous', 'song'],
        synonyms: ['go back', 'play previous', 'previous track', 'last song'],
        action: () => {
          previousSong();
          speak('Playing previous song');
        },
        description: 'Plays the previous song',
      },
      {
        keywords: ['volume', 'up'],
        synonyms: ['increase volume', 'louder', 'raise volume'],
        action: () => {
          setVolume(prev => Math.min(100, prev + 20));
          speak('Volume increased');
        },
        description: 'Increases volume by 20%',
      },
      {
        keywords: ['volume', 'down'],
        synonyms: ['decrease volume', 'quieter', 'lower volume'],
        action: () => {
          setVolume(prev => Math.max(0, prev - 20));
          speak('Volume decreased');
        },
        description: 'Decreases volume by 20%',
      },
      {
        keywords: ['open', 'music'],
        synonyms: ['music panel', 'show music', 'go to music'],
        action: () => {
          setCurrentPanel('music');
          speak('Opening music panel');
        },
        description: 'Opens music panel',
      },
      
      // Dashboard commands - Enhanced with state awareness
      {
        keywords: ['dashboard'],
        synonyms: ['go dash', 'show dash', 'main screen', 'home screen', 'back to home', 'go home', 'return dashboard'],
        action: () => {
          setCurrentPanel('dashboard');
          speak('Returning to main dashboard');
        },
        description: 'Returns to main dashboard',
        confidenceBoost: currentPanel !== 'dashboard' ? 0.15 : 0, // Boost if not already on dashboard
        minConfidence: 0.6,
      },
      
      // Navigation commands - Enhanced with location-aware matching
      {
        keywords: ['open', 'navigation'],
        synonyms: ['show navigation', 'go to navigation', 'navigation panel'],
        action: () => {
          setCurrentPanel('navigation');
          speak('Opening navigation panel');
        },
        description: 'Opens navigation panel',
      },
      {
        keywords: ['navigate', 'home'],
        synonyms: ['go home', 'navigate home', 'route home', 'directions home'],
        action: () => {
          setCurrentPanel('navigation');
          navigateTo('Home');
          speak('Navigating to home');
        },
        description: 'Navigate to home location',
        minConfidence: 0.65,
      },
      {
        keywords: ['navigate', 'work'],
        synonyms: ['go work', 'go to work', 'route work', 'directions work'],
        action: () => {
          setCurrentPanel('navigation');
          navigateTo('Work');
          speak('Navigating to work');
        },
        description: 'Navigate to work location',
        minConfidence: 0.65,
      },
      {
        keywords: ['nearest', 'fuel'],
        synonyms: ['gas station', 'petrol', 'fuel station', 'gas', 'find fuel'],
        action: () => {
          setCurrentPanel('navigation');
          navigateTo('Nearest Fuel Station');
          speak('Finding nearest fuel station');
        },
        description: 'Navigate to nearest fuel station',
        minConfidence: 0.65,
      },
      {
        keywords: ['nearest', 'coffee'],
        synonyms: ['coffee shop', 'cafe', 'find coffee'],
        action: () => {
          setCurrentPanel('navigation');
          navigateTo('Nearest Coffee Shop');
          speak('Showing route to the nearest coffee shop');
        },
        description: 'Navigate to nearest coffee shop',
        minConfidence: 0.65,
      },
      {
        keywords: ['nearest', 'restaurant'],
        synonyms: ['food', 'dining', 'eat', 'find restaurant'],
        action: () => {
          setCurrentPanel('navigation');
          navigateTo('Nearest Restaurant');
          speak('Displaying nearby restaurants');
        },
        description: 'Navigate to nearest restaurant',
        minConfidence: 0.65,
      },
      {
        keywords: ['nearest', 'hospital'],
        synonyms: ['medical', 'emergency', 'find hospital'],
        action: () => {
          setCurrentPanel('navigation');
          navigateTo('Nearest Hospital');
          speak('Navigating to the nearest hospital');
        },
        description: 'Navigate to nearest hospital',
        minConfidence: 0.65,
      },
      
      // Phone commands
      {
        keywords: ['show', 'contacts'],
        synonyms: ['open contacts', 'phone', 'contacts panel', 'go to phone'],
        action: () => {
          setCurrentPanel('phone');
          speak('Opening contacts panel');
        },
        description: 'Opens contacts panel',
      },
      {
        keywords: ['answer', 'call'],
        synonyms: ['answer', 'pick up', 'take call', 'accept call'],
        action: () => {
          answerCall();
          speak('Call answered');
        },
        description: 'Answers incoming call',
      },
      {
        keywords: ['reject', 'call'],
        synonyms: ['decline call', 'ignore call', 'hang up', 'reject', 'decline'],
        action: () => {
          rejectCall();
          speak('Call rejected');
        },
        description: 'Rejects incoming call',
        minConfidence: 0.65,
      },
      
      // Climate commands
      {
        keywords: ['adjust', 'climate'],
        synonyms: ['climate control', 'open climate', 'go to climate', 'climate panel'],
        action: () => {
          setCurrentPanel('climate');
          speak('Opening climate control panel');
        },
        description: 'Opens climate control panel',
      },
      {
        keywords: ['turn on', 'ac'],
        synonyms: ['air conditioning on', 'ac on', 'cooling on'],
        action: () => {
          setCurrentPanel('climate');
          toggleAC();
          speak('Air conditioning turned on');
        },
        description: 'Turns on air conditioning',
      },
      
      // Vehicle commands
      {
        keywords: ['vehicle', 'info'],
        synonyms: ['car info', 'vehicle information', 'car details'],
        action: () => {
          setCurrentPanel('vehicle');
          speak('Opening vehicle information');
        },
        description: 'Opens vehicle information panel',
      },
    ];
  };

  const processVoiceCommand = (command: string, confidence: number = 1.0) => {
    console.log('🎤 Processing command:', command, '| Confidence:', confidence.toFixed(2));
    
    // Special handling for help command
    if (command.includes('list all commands') || command.includes('what can i say') || command.includes('help')) {
      const commandList = `
🎵 Music Commands:
• Play music - Opens music player and starts playback
• Pause music or Stop music - Pauses the music
• Next song or Skip - Plays the next song
• Previous song or Go back - Plays the previous song
• Volume up - Increases volume
• Volume down - Decreases volume

🗺️ Navigation Commands:
• Open navigation - Opens navigation panel
• Navigate to home - Navigates to home location
• Navigate to work - Navigates to work location
• Nearest fuel station - Finds nearest fuel station
• Nearest coffee shop - Finds nearest coffee shop
• Nearest restaurant - Finds nearest restaurant
• Nearest hospital - Finds nearest hospital

📞 Phone Commands:
• Show contacts - Opens contacts panel
• Answer call - Answers incoming call
• Reject call - Rejects incoming call

❄️ Climate Commands:
• Adjust climate - Opens climate control panel
• Turn on AC - Turns on air conditioning
• Set temperature [number] - Sets temperature

🚗 System Commands:
• Dashboard - Returns to main dashboard
• Vehicle info - Opens vehicle information
• List all commands - Shows this help menu
      `.trim();

      toast({
        title: "🎤 Available Voice Commands",
        description: "Check console for full list",
        duration: 5000,
      });

      console.log(commandList);
      speak('Voice commands available. Say pause music, dashboard, navigate to location, or list all commands for help.');
      addCommand('voice', command);
      return;
    }
    
    // Special handling for set temperature
    if (command.includes('set temperature')) {
      const tempMatch = command.match(/(\d+)/);
      if (tempMatch) {
        const temp = parseInt(tempMatch[1]);
        setCurrentPanel('climate');
        setTemperature(temp);
        speak(`Temperature set to ${temp} degrees`);
        addCommand('voice', command);
        toast({
          title: "🎤 Voice Command",
          description: `Set temperature to ${temp}°`,
          duration: 2000,
        });
        return;
      }
    }
    
    // Special handling for call contacts
    if (command.includes('call')) {
      const names = ['john doe', 'jane smith', 'bob wilson', 'alice brown'];
      const foundName = names.find(name => command.includes(name));
      if (foundName) {
        const displayName = foundName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setCurrentPanel('phone');
        callContact(displayName);
        speak(`Calling ${displayName}`);
        addCommand('voice', command);
        toast({
          title: "🎤 Voice Command",
          description: `Calling ${displayName}`,
          duration: 2000,
        });
        return;
      }
    }
    
    // Get command patterns and find matches
    const patterns = buildCommandPatterns();
    const matches = getTopMatches(command, patterns, confidence);
    
    console.log('📊 Top matches:', matches.map(m => `${m.command} (${(m.confidence * 100).toFixed(0)}%)`).join(', '));
    
    if (matches.length === 0) {
      console.log('❌ No matches found for:', command);
      speak("Sorry, I didn't catch that. Please try again or say 'list all commands' for help.");
      toast({
        title: "⚠️ Command Not Recognized",
        description: "Say 'list all commands' for help",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Auto-execute if high confidence, otherwise show selection UI
    if (shouldAutoExecute(matches)) {
      const topMatch = matches[0];
      console.log('✅ Auto-executing command:', topMatch.command, '| Confidence:', (topMatch.confidence * 100).toFixed(0) + '%');
      topMatch.action();
      addCommand('voice', command);
      toast({
        title: "🎤 Voice Command",
        description: topMatch.command,
        duration: 2000,
      });
    } else {
      console.log('🔍 Showing command selection UI with', matches.length, 'matches');
      setCommandMatches(matches);
    }
  };

  const handleCommandSelection = (match: CommandMatch) => {
    console.log('✅ User selected:', match.command);
    match.action();
    addCommand('voice', match.command);
    toast({
      title: "🎤 Voice Command",
      description: match.command,
      duration: 2000,
    });
    setCommandMatches([]);
  };

  const handleCommandCancel = () => {
    console.log('❌ User cancelled command selection');
    speak("Command cancelled. Please try again.");
    setCommandMatches([]);
  };

  return (
    <>
      <VoiceCommandMatcher
        matches={commandMatches}
        onSelect={handleCommandSelection}
        onCancel={handleCommandCancel}
      />
    </>
  );
};
