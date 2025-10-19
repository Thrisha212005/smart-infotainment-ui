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
      const transcript = event.results[last][0].transcript;
      const confidence = event.results[last][0].confidence;
      
      // Normalize command: lowercase, trim, remove punctuation
      const command = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '');
      
      console.log('✅ Voice command detected:', command, '| Confidence:', confidence.toFixed(2));
      setLastCommand(command);
      
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

  const fuzzyMatch = (command: string, keywords: string[]): boolean => {
    return keywords.some(keyword => command.includes(keyword));
  };

  const processVoiceCommand = (command: string, confidence: number = 1.0) => {
    let commandRecognized = false;
    
    // Log for debugging
    console.log('🎤 Processing command:', command, '| Confidence:', confidence.toFixed(2));

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
• Open music or Music panel - Opens music panel

🗺️ Navigation Commands:
• Open navigation or Show navigation - Opens navigation panel
• Navigate to home or Go home - Navigates to home location
• Navigate to work or Go to work - Navigates to work location
• Find nearest fuel station or Gas station - Finds nearest fuel station
• Find nearest coffee shop - Finds nearest coffee shop
• Find nearest restaurant - Finds nearest restaurant
• Find nearest hospital - Finds nearest hospital

📞 Phone Commands:
• Show contacts or Open contacts - Opens contacts panel
• Call [contact name] - Calls a specific contact (John Doe, Jane Smith, Bob Wilson, Alice Brown)
• Answer call - Answers incoming call
• Reject call or Decline call - Rejects incoming call

❄️ Climate Commands:
• Adjust climate or Climate control - Opens climate control panel
• Turn on AC or Air conditioning on - Turns on AC
• Set temperature [number] - Sets temperature to specified degrees

🚗 System Commands:
• Go to dashboard or Return to dashboard or Back to home - Returns to main dashboard
• Vehicle info or Car info - Opens vehicle information
• List all commands or What can I say or Help - Shows this help menu
      `.trim();

      toast({
        title: "🎤 Available Voice Commands",
        description: "Check console for full list",
        duration: 5000,
      });

      console.log(commandList);
      speak('Here are all available voice commands. Music commands: play music, pause music, next song, previous song, volume up, volume down. Navigation commands: open navigation, navigate to home, work, fuel station, coffee shop, restaurant, or hospital. Phone commands: show contacts, call contact name, answer call, reject call. Climate commands: adjust climate, turn on AC, set temperature. System commands: go to dashboard, go to vehicle info, and list all commands.');
      commandRecognized = true;
    }
    
    // Music commands - Open Music Panel
    else if (command.includes('open music') || command.includes('go to music') || command.includes('music panel')) {
      setCurrentPanel('music');
      speak('Opening music panel');
      commandRecognized = true;
    }
    // Play Music
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
    // Music navigation - Enhanced matching
    else if (
      command.includes('next song') || 
      command.includes('play next') || 
      command.includes('skip') ||
      (command.includes('next') && (command.includes('song') || command.includes('track')))
    ) {
      console.log('✅ Next song command recognized');
      nextSong();
      speak('Playing next song');
      commandRecognized = true;
    } else if (
      command.includes('previous song') || 
      command.includes('play previous') ||
      command.includes('go back') ||
      (command.includes('previous') && (command.includes('song') || command.includes('track')))
    ) {
      console.log('✅ Previous song command recognized');
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
    else if (command.includes('open navigation') || command.includes('show navigation') || command.includes('go to navigation') || command.includes('navigation panel')) {
      setCurrentPanel('navigation');
      speak('Opening navigation panel');
      commandRecognized = true;
    }
    // Specific navigation destinations
    else if (fuzzyMatch(command, ['navigate to', 'go to', 'go home', 'navigate home'])) {
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
      }
    }
    // Find nearest destinations
    else if (fuzzyMatch(command, ['find nearest', 'nearest', 'find', 'show'])) {
      if (fuzzyMatch(command, ['fuel', 'gas', 'gas station', 'petrol'])) {
        setCurrentPanel('navigation');
        navigateTo('Nearest Fuel Station');
        speak('Finding nearest fuel station');
        commandRecognized = true;
      } else if (fuzzyMatch(command, ['coffee', 'coffee shop', 'cafe'])) {
        setCurrentPanel('navigation');
        navigateTo('Nearest Coffee Shop');
        speak('Showing route to the nearest coffee shop');
        commandRecognized = true;
      } else if (fuzzyMatch(command, ['restaurant', 'food', 'dining', 'eat'])) {
        setCurrentPanel('navigation');
        navigateTo('Nearest Restaurant');
        speak('Displaying nearby restaurants');
        commandRecognized = true;
      } else if (fuzzyMatch(command, ['hospital', 'medical', 'emergency'])) {
        setCurrentPanel('navigation');
        navigateTo('Nearest Hospital');
        speak('Navigating to the nearest hospital');
        commandRecognized = true;
      }
    }
    
    // Phone/Contacts Panel
    else if (command.includes('show contacts') || command.includes('open contacts') || command.includes('phone') || command.includes('go to contacts') || command.includes('go to phone') || command.includes('contacts panel')) {
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
    } else if (
      fuzzyMatch(command, ['answer call', 'answer', 'pick up', 'take call']) ||
      command.includes('answer')
    ) {
      console.log('✅ Answer call command recognized');
      answerCall();
      speak('Call answered');
      commandRecognized = true;
    } else if (
      fuzzyMatch(command, ['reject call', 'decline call', 'ignore call', 'hang up', 'reject']) ||
      (command.includes('reject') || command.includes('decline') || command.includes('hang'))
    ) {
      console.log('✅ Reject call command recognized');
      rejectCall();
      speak('Call rejected');
      commandRecognized = true;
    }
    
    // Climate Control Panel
    else if (command.includes('adjust climate') || command.includes('climate control') || command.includes('open climate') || command.includes('go to climate') || command.includes('climate panel')) {
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
    
    // Dashboard - Enhanced fuzzy matching
    else if (
      fuzzyMatch(command, ['dashboard', 'go to dashboard', 'return to dashboard', 'back to home', 'go home', 'home screen', 'main screen']) ||
      command.includes('dashboard') ||
      (command.includes('go') && command.includes('home')) ||
      (command.includes('back') && (command.includes('home') || command.includes('main')))
    ) {
      console.log('✅ Dashboard command recognized');
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
      console.log('❌ Command not recognized:', command, '| Confidence:', confidence.toFixed(2));
      
      // If confidence is moderate (0.5-0.75), ask for confirmation
      if (confidence >= 0.5 && confidence < 0.75) {
        speak(`Did you say ${command}? Please try again more clearly.`);
      } else {
        speak("Sorry, I didn't catch that. Please say that again.");
      }
      
      toast({
        title: "⚠️ Command Not Recognized",
        description: "Say 'list all commands' for help",
        variant: "destructive",
        duration: 3000,
      });
    } else {
      // Only add to command log if recognized
      console.log('✅ Command executed successfully:', command);
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
