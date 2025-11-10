import React, { useEffect, useRef, useState } from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { usePhone } from '@/contexts/PhoneContext';
import { useClimate } from '@/contexts/ClimateContext';
import { toast } from '@/hooks/use-toast';
import { VoiceRecognitionOverlay } from './VoiceRecognitionOverlay';

export const VoiceControl: React.FC = () => {
  const { 
    voiceEnabled, 
    setVoiceEnabled,
    addCommand, 
    setCurrentPanel, 
    speak, 
    voiceOverlayActive, 
    setVoiceOverlayActive,
    setLastInputType,
    isDarkMode,
    toggleDarkMode
  } = useInfotainment();
  const { nextSong, previousSong, togglePlay, setVolume, isPlaying, volume } = useMusicPlayer();
  const { navigateTo, destinations } = useNavigation();
  const { callContact, answerCall, rejectCall } = usePhone();
  const { setTemperature, setFanSpeed, toggleAC, isACOn } = useClimate();
  
  const recognitionRef = useRef<any>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [manualMicOff, setManualMicOff] = useState(false);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      speak('Voice control is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      
      if (result.isFinal) {
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const command = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '');
        
        console.log('✅ Voice command detected:', command, '| Confidence:', confidence.toFixed(2));
        setRecognizedText(transcript);
        
        // Process immediately
        setTimeout(() => {
          processVoiceCommand(command, confidence);
        }, 100);
      } else {
        // Show interim results
        const transcript = result[0].transcript;
        setRecognizedText(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        speak('Microphone access denied. Please allow microphone access to use voice control.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart if voice is still enabled
      if (voiceEnabled && recognitionRef.current && voiceOverlayActive) {
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
  }, [voiceEnabled, voiceOverlayActive]);

  useEffect(() => {
    if (voiceEnabled && voiceOverlayActive && recognitionRef.current) {
      try {
        recognitionRef.current.start();
        console.log('Starting voice recognition');
      } catch (e) {
        console.log('Recognition start error:', e);
      }
    } else if ((!voiceEnabled || !voiceOverlayActive) && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setRecognizedText('');
        setSuggestions([]);
        console.log('Stopping voice recognition');
      } catch (e) {
        console.log('Recognition stop error:', e);
      }
    }
  }, [voiceEnabled, voiceOverlayActive]);

  const closeOverlay = () => {
    // Add fade-out animation before closing
    const overlay = document.querySelector('.fixed.inset-0.z-50');
    if (overlay) {
      overlay.classList.add('opacity-0');
      setTimeout(() => {
        setVoiceOverlayActive(false);
        setRecognizedText('');
        setSuggestions([]);
        setIsConfirming(false);
      }, 500);
    } else {
      setVoiceOverlayActive(false);
      setRecognizedText('');
      setSuggestions([]);
      setIsConfirming(false);
    }
  };

  const toggleMicManually = () => {
    if (voiceOverlayActive) {
      // Turn off mic manually
      setVoiceEnabled(false);
      setManualMicOff(true);
      closeOverlay();
      speak('Voice recognition disabled');
    } else {
      // Turn on mic manually
      setVoiceEnabled(true);
      setManualMicOff(false);
      setVoiceOverlayActive(true);
      speak('Voice recognition activated');
    }
  };

  const validateCommand = (command: string): boolean => {
    const validCommands = [
      'play music', 'pause', 'stop music', 'next song', 'previous song', 'skip', 
      'increase volume', 'decrease volume', 'volume up', 'volume down',
      'navigate', 'go to', 'show contacts', 'call', 'answer', 'reject',
      'turn on ac', 'turn off ac', 'ac on', 'ac off', 'set fan speed', 'set temperature',
      'dashboard', 'vehicle info', 'open music', 'open navigation', 'climate control',
      'light mode', 'dark mode', 'turn off mic', 'disable mic', 'list all commands', 'help'
    ];
    return validCommands.some(valid => command.includes(valid));
  };

  const processVoiceCommand = (command: string, confidence: number = 1.0) => {
    let commandRecognized = false;
    setLastInputType('voice');
    
    console.log('🎤 Processing command:', command, '| Confidence:', confidence.toFixed(2));

    // Turn off mic
    if (command.includes('turn off mic') || command.includes('disable mic') || command.includes('stop listening')) {
      setVoiceEnabled(false);
      setManualMicOff(true);
      speak('Voice recognition disabled');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Yes/No confirmation responses
    else if (command.includes('yes') && suggestions.length > 0 && !isConfirming) {
      setIsConfirming(true);
      const confirmedCommand = suggestions[0].replace(/"/g, '').toLowerCase().trim();
      
      // Clear suggestions immediately to prevent re-processing
      setSuggestions([]);
      setRecognizedText('');
      
      // Validate if the confirmed command actually exists
      if (!validateCommand(confirmedCommand)) {
        speak('No such command exists. Please try again.');
        setIsConfirming(false);
        commandRecognized = true;
      } else {
        // Execute the confirmed command immediately
        processVoiceCommand(confirmedCommand, 1.0);
        setIsConfirming(false);
        commandRecognized = true;
      }
    } else if (command.includes('no') && suggestions.length > 0) {
      setSuggestions([]);
      setRecognizedText('');
      setIsConfirming(false);
      speak('Okay, please say the command again');
      commandRecognized = true;
    }
    // Help command - List all commands (slower rate)
    else if (command.includes('list all commands') || command.includes('what can i say') || command.includes('help')) {
      const commandList = `Music commands: play music, pause music, next song, previous song, increase volume, decrease volume. Navigation commands: navigate to home, work, fuel station, coffee shop, restaurant, hospital, shopping mall, or gym. Phone commands: show contacts, call contact name, answer call, reject call. Climate commands: turn on AC, turn off AC, set fan speed to 1 through 5, set temperature. System commands: go to dashboard, vehicle info, list all commands, turn off mic.`;
      
      speak(commandList, 0.8); // Slower speech rate
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 1000);
    }
    // Light mode toggle
    else if (command.includes('turn on light mode') || command.includes('enable light mode') || command.includes('light mode')) {
      if (isDarkMode) {
        toggleDarkMode();
        speak('Light mode activated');
        commandRecognized = true;
        setTimeout(() => closeOverlay(), 800);
      }
    } else if (command.includes('turn on dark mode') || command.includes('enable dark mode') || command.includes('dark mode')) {
      if (!isDarkMode) {
        toggleDarkMode();
        speak('Dark mode activated');
        commandRecognized = true;
        setTimeout(() => closeOverlay(), 800);
      }
    }
    // Music Panel
    else if (command.includes('open music') || command.includes('go to music') || command.includes('music panel')) {
      setCurrentPanel('music');
      speak('Opening music panel');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Play Music
    else if (command.includes('play music') || command.includes('start music') || command.includes('resume music')) {
      setCurrentPanel('music');
      if (!isPlaying) {
        togglePlay();
        speak('Playing music');
      } else {
        speak('Music is already playing');
      }
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Pause Music
    else if (command.includes('pause music') || command.includes('stop music') || command.includes('halt music')) {
      setCurrentPanel('music');
      if (isPlaying) {
        togglePlay();
        speak('Music paused');
      } else {
        speak('Music is already paused');
      }
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Pause/Play toggle (when just "pause" or "play" is said)
    else if (command === 'pause' || command === 'play') {
      setCurrentPanel('music');
      togglePlay();
      speak(isPlaying ? 'Music paused' : 'Playing music');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Music navigation - Next Song (always resumes if paused)
    else if (
      command.includes('next song') || 
      command.includes('play next') || 
      command.includes('skip') ||
      command.includes('next track')
    ) {
      if (!isPlaying) {
        togglePlay(); // Resume playback if paused
      }
      nextSong();
      speak('Playing next track');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    } else if (
      command.includes('previous song') || 
      command.includes('play previous') ||
      command.includes('go back') ||
      command.includes('previous track')
    ) {
      previousSong();
      speak('Playing previous song');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Volume control - smooth adjustments
    else if (command.includes('increase volume') || command.includes('volume up') || command.includes('louder')) {
      const newVolume = Math.min(100, volume + 10);
      setVolume(newVolume);
      speak(`Volume set to ${newVolume} percent`);
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    } else if (command.includes('decrease volume') || command.includes('volume down') || command.includes('quieter')) {
      const newVolume = Math.max(0, volume - 10);
      setVolume(newVolume);
      speak(`Volume set to ${newVolume} percent`);
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Navigation Panel
    else if (command.includes('open navigation') || command.includes('show navigation') || command.includes('navigation panel')) {
      setCurrentPanel('navigation');
      speak('Opening navigation panel');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Navigation destinations with fuzzy matching
    else if (
      command.includes('navigate') || 
      command.includes('go to') || 
      command.includes('find') ||
      command.includes('show route')
    ) {
      const destinationMap: { [key: string]: string } = {
        'home': 'Home',
        'work': 'Work',
        'fuel': 'Nearest Fuel Station',
        'gas': 'Nearest Fuel Station',
        'petrol': 'Nearest Fuel Station',
        'coffee': 'Nearest Coffee Shop',
        'cafe': 'Nearest Coffee Shop',
        'restaurant': 'Nearest Restaurant',
        'food': 'Nearest Restaurant',
        'hospital': 'Nearest Hospital',
        'medical': 'Nearest Hospital',
        'shopping': 'Nearest Shopping Mall',
        'mall': 'Nearest Shopping Mall',
        'gym': 'Gym',
      };

      let foundDestination = null;
      for (const [key, dest] of Object.entries(destinationMap)) {
        if (command.includes(key)) {
          foundDestination = dest;
          break;
        }
      }

      if (foundDestination) {
        setCurrentPanel('navigation');
        navigateTo(foundDestination);
        speak(`Navigating to ${foundDestination}`);
        commandRecognized = true;
        setTimeout(() => closeOverlay(), 800);
      }
    }
    // Phone/Contacts Panel
    else if (command.includes('show contacts') || command.includes('open contacts') || command.includes('phone') || command.includes('contacts panel')) {
      setCurrentPanel('phone');
      speak('Opening contacts panel');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Call commands
    else if (command.includes('call')) {
      const names = ['john doe', 'jane smith', 'bob wilson', 'alice brown'];
      const foundName = names.find(name => command.includes(name));
      if (foundName) {
        const properName = foundName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setCurrentPanel('phone');
        callContact(properName);
        speak(`Calling ${properName}`);
        commandRecognized = true;
        setTimeout(() => closeOverlay(), 800);
      }
    } else if (command.includes('answer') || command.includes('pick up') || command.includes('take call')) {
      answerCall();
      speak('Call answered');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    } else if (command.includes('reject') || command.includes('decline') || command.includes('hang up')) {
      rejectCall();
      speak('Call rejected');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Climate Control Panel
    else if (command.includes('climate control') || command.includes('open climate') || command.includes('adjust climate')) {
      setCurrentPanel('climate');
      speak('Opening climate control panel');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // AC commands - fixed logic
    else if (command.includes('turn on ac') || command.includes('air conditioning on') || command.includes('ac on')) {
      setCurrentPanel('climate');
      if (!isACOn) {
        toggleAC();
        speak('Air conditioning turned on');
      } else {
        speak('Air conditioning is already on');
      }
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    } else if (command.includes('turn off ac') || command.includes('air conditioning off') || command.includes('ac off')) {
      setCurrentPanel('climate');
      if (isACOn) {
        toggleAC();
        speak('Air conditioning turned off');
      } else {
        speak('Air conditioning is already off');
      }
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Fan speed control
    else if (command.includes('set fan speed') || command.includes('fan speed')) {
      const speedMatch = command.match(/(\d+)/);
      if (speedMatch) {
        const speed = parseInt(speedMatch[1]);
        if (speed >= 1 && speed <= 5) {
          setCurrentPanel('climate');
          setFanSpeed(speed);
          speak(`Fan speed set to level ${speed}`);
          commandRecognized = true;
          setTimeout(() => closeOverlay(), 800);
        }
      }
    }
    // Temperature control
    else if (command.includes('set temperature')) {
      const tempMatch = command.match(/(\d+)/);
      if (tempMatch) {
        const temp = parseInt(tempMatch[1]);
        setCurrentPanel('climate');
        setTemperature(temp);
        speak(`Temperature set to ${temp} degrees`);
        commandRecognized = true;
        setTimeout(() => closeOverlay(), 800);
      }
    }
    // Dashboard - enhanced matching with state awareness
    else if (
      command.includes('dashboard') ||
      command.includes('go dash') ||
      command.includes('show dash') ||
      command.includes('main screen') ||
      command.includes('home screen') ||
      (command.includes('go') && command.includes('home') && !command.includes('navigate'))
    ) {
      setCurrentPanel('dashboard');
      speak('Returning to dashboard');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Vehicle info
    else if (command.includes('vehicle info') || command.includes('car info') || command.includes('vehicle panel')) {
      setCurrentPanel('vehicle');
      speak('Opening vehicle information');
      commandRecognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    
    // If no command was recognized
    if (!commandRecognized) {
      console.log('❌ Command not recognized:', command, '| Confidence:', confidence.toFixed(2));
      
      // Show suggestion if confidence is moderate
      if (confidence >= 0.5) {
        setSuggestions([`"${command}"`]);
        speak(`Did you mean ${command}?`);
      } else {
        speak("Sorry, I didn't catch that. Please try again.");
        setTimeout(() => {
          setRecognizedText('');
        }, 2000);
      }
    } else {
      // Command executed successfully
      console.log('✅ Command executed successfully:', command);
      addCommand('voice', command);
      
      toast({
        title: "🎤 Voice Command",
        description: command,
        duration: 2000,
      });
    }
  };

  const handleSuggestionSelect = (response: string) => {
    if (response === 'yes' && suggestions.length > 0) {
      // Extract the actual command from the suggestion
      const command = suggestions[0].replace(/"/g, '').toLowerCase().trim();
      processVoiceCommand(command, 1.0);
    }
    setSuggestions([]);
    setRecognizedText('');
  };

  return (
    <VoiceRecognitionOverlay
      isActive={voiceOverlayActive}
      onClose={toggleMicManually}
      recognizedText={recognizedText}
      isListening={isListening}
      suggestions={suggestions}
      onSelectSuggestion={handleSuggestionSelect}
    />
  );
};
