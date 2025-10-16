import React, { useEffect, useRef, useState } from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { usePhone } from '@/contexts/PhoneContext';
import { useClimate } from '@/contexts/ClimateContext';
import { toast } from '@/hooks/use-toast';

export const VoiceControl: React.FC = () => {
  const { voiceEnabled, addCommand, setCurrentPanel, speak, toggleDarkMode } = useInfotainment();
  const { nextSong, previousSong, togglePlay, setVolume, isPlaying } = useMusicPlayer();
  const { navigateTo } = useNavigation();
  const { callContact, answerCall, rejectCall } = usePhone();
  const { setTemperature, setFanSpeed, toggleAC } = useClimate();
  
  const recognitionRef = useRef<any>(null);
  const [lastCommand, setLastCommand] = useState<string>('');

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

    recognition.onstart = () => {
      console.log('Voice recognition started');
    };

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      
      console.log('✅ Voice command detected:', command);
      setLastCommand(command);
      
      processVoiceCommand(command);
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

  const processVoiceCommand = (command: string) => {
    let commandRecognized = false;

    // Help command - List all commands
    if (command.includes('list all commands') || command.includes('what can i say') || command.includes('help')) {
      const commandList = `
🎵 Music Commands:
• Play music - Opens music player and starts playback
• Pause music or Stop music - Pauses the music
• Next song or Play next - Plays the next song
• Previous song or Play previous - Plays the previous song
• Increase volume or Volume up - Increases volume
• Decrease volume or Volume down - Decreases volume

🗺️ Navigation Commands:
• Open navigation or Show navigation - Opens navigation panel
• Navigate to home - Navigates to home location
• Navigate to work - Navigates to work location
• Navigate to fuel or gas station - Finds nearest fuel station

📞 Phone Commands:
• Show contacts or Open contacts - Opens contacts panel
• Call [contact name] - Calls a specific contact
• Answer call - Answers incoming call
• Reject call or Decline call - Rejects incoming call

❄️ Climate Commands:
• Adjust climate or Climate control - Opens climate control
• Turn on AC or Air conditioning on - Turns on AC
• Set temperature [number] - Sets temperature to specified degrees

🚗 System Commands:
• Go to dashboard or Dashboard - Returns to main dashboard
• Vehicle info or Car info - Opens vehicle information
• List all commands or What can I say - Shows this help menu
      `.trim();

      toast({
        title: "🎤 Available Voice Commands",
        description: "Check console for full list",
        duration: 5000,
      });

      console.log(commandList);
      speak('Here are all available voice commands. Music commands: play music, pause music, next song, previous song, volume up, volume down. Navigation commands: open navigation, navigate to home, work, or fuel station. Phone commands: show contacts, call contact name, answer call, reject call. Climate commands: adjust climate, turn on AC, set temperature. System commands: go to dashboard, vehicle info, and list all commands.');
      commandRecognized = true;
    }
    
    // Music commands - Play Music
    else if (command.includes('play music')) {
      setCurrentPanel('music');
      if (!isPlaying) togglePlay();
      speak('Opening music player and starting playback');
      commandRecognized = true;
    }
    // Pause Music
    else if (command.includes('pause music') || command.includes('stop music')) {
      if (isPlaying) {
        togglePlay();
        speak('Music paused');
      } else {
        speak('Music is already paused');
      }
      commandRecognized = true;
    }
    // Music navigation
    else if (command.includes('next song') || command.includes('play next')) {
      nextSong();
      speak('Playing next song');
      commandRecognized = true;
    } else if (command.includes('previous song') || command.includes('play previous')) {
      previousSong();
      speak('Playing previous song');
      commandRecognized = true;
    }
    // Volume control
    else if (command.includes('increase volume') || command.includes('volume up')) {
      setVolume(prev => Math.min(100, prev + 20));
      speak('Volume increased');
      commandRecognized = true;
    } else if (command.includes('decrease volume') || command.includes('volume down')) {
      setVolume(prev => Math.max(0, prev - 20));
      speak('Volume decreased');
      commandRecognized = true;
    }
    
    // Navigation Panel
    else if (command.includes('open navigation') || command.includes('show navigation')) {
      setCurrentPanel('navigation');
      speak('Opening navigation panel');
      commandRecognized = true;
    }
    // Specific navigation destinations
    else if (command.includes('navigate to') || command.includes('go to')) {
      if (command.includes('home')) {
        setCurrentPanel('navigation');
        navigateTo('Home');
        speak('Navigating to home');
        commandRecognized = true;
      } else if (command.includes('work')) {
        setCurrentPanel('navigation');
        navigateTo('Work');
        speak('Navigating to work');
        commandRecognized = true;
      } else if (command.includes('fuel') || command.includes('gas station')) {
        setCurrentPanel('navigation');
        navigateTo('Nearest Fuel Station');
        speak('Finding nearest fuel station');
        commandRecognized = true;
      }
    }
    
    // Phone/Contacts Panel
    else if (command.includes('show contacts') || command.includes('open contacts') || command.includes('phone')) {
      setCurrentPanel('phone');
      speak('Opening contacts panel');
      commandRecognized = true;
    }
    // Call commands
    else if (command.includes('call')) {
      const names = ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown'];
      const foundName = names.find(name => 
        command.includes(name.toLowerCase())
      );
      if (foundName) {
        setCurrentPanel('phone');
        callContact(foundName);
        speak(`Calling ${foundName}`);
        commandRecognized = true;
      }
    } else if (command.includes('answer call')) {
      answerCall();
      speak('Call answered');
      commandRecognized = true;
    } else if (command.includes('reject call') || command.includes('decline call')) {
      rejectCall();
      speak('Call rejected');
      commandRecognized = true;
    }
    
    // Climate Control Panel
    else if (command.includes('adjust climate') || command.includes('climate control') || command.includes('open climate')) {
      setCurrentPanel('climate');
      speak('Opening climate control panel');
      commandRecognized = true;
    }
    // Climate commands
    else if (command.includes('turn on ac') || command.includes('air conditioning on')) {
      setCurrentPanel('climate');
      toggleAC();
      speak('Air conditioning turned on');
      commandRecognized = true;
    } else if (command.includes('set temperature')) {
      const tempMatch = command.match(/(\d+)/);
      if (tempMatch) {
        const temp = parseInt(tempMatch[1]);
        setCurrentPanel('climate');
        setTemperature(temp);
        speak(`Temperature set to ${temp} degrees`);
        commandRecognized = true;
      }
    }
    
    // Dashboard
    else if (command.includes('go to dashboard') || command.includes('open dashboard') || command.includes('dashboard')) {
      setCurrentPanel('dashboard');
      speak('Returning to main dashboard');
      commandRecognized = true;
    }
    // Vehicle info
    else if (command.includes('vehicle info') || command.includes('car info')) {
      setCurrentPanel('vehicle');
      speak('Opening vehicle information');
      commandRecognized = true;
    }
    
    // If no command was recognized
    if (!commandRecognized) {
      console.log('❌ Command not recognized:', command);
      speak('Command not recognized. Try saying "list all commands" to hear what I can do.');
      toast({
        title: "⚠️ Command Not Recognized",
        description: "Say 'list all commands' for help",
        variant: "destructive",
        duration: 3000,
      });
    } else {
      // Only add to command log if recognized
      addCommand('voice', command);
      toast({
        title: "🎤 Voice Command",
        description: command,
        duration: 2000,
      });
    }
  };

  return null;
};
