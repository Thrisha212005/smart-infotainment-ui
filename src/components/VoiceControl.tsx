import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { usePhone } from '@/contexts/PhoneContext';
import { useClimate } from '@/contexts/ClimateContext';
import { toast } from '@/hooks/use-toast';
import { VoiceRecognitionOverlay } from './VoiceRecognitionOverlay';

type ConfirmationState = {
  active: boolean;
  suggestedCommand: string;
};

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
  const { navigateTo } = useNavigation();
  const { callContact, answerCall, rejectCall } = usePhone();
  const { setTemperature, setFanSpeed, toggleAC, isACOn } = useClimate();
  
  const recognitionRef = useRef<any>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const confirmationRef = useRef<ConfirmationState>({ active: false, suggestedCommand: '' });

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      
      if (result.isFinal) {
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const command = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '');
        
        console.log('✅ Voice:', command, '| Confidence:', confidence.toFixed(2));
        setRecognizedText(transcript);
        
        setTimeout(() => handleInput(command, confidence), 100);
      } else {
        setRecognizedText(result[0].transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      if (event.error === 'not-allowed') {
        speak('Microphone access denied.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (voiceEnabled && recognitionRef.current && voiceOverlayActive) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognitionRef.current?.stop(); } catch (e) {}
    };
  }, [voiceEnabled, voiceOverlayActive]);

  useEffect(() => {
    if (voiceEnabled && voiceOverlayActive && recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setRecognizedText('');
      setSuggestions([]);
      confirmationRef.current = { active: false, suggestedCommand: '' };
    }
  }, [voiceEnabled, voiceOverlayActive]);

  const closeOverlay = useCallback(() => {
    setVoiceOverlayActive(false);
    setRecognizedText('');
    setSuggestions([]);
    confirmationRef.current = { active: false, suggestedCommand: '' };
  }, [setVoiceOverlayActive]);

  // Handles both confirmation responses and regular commands
  const handleInput = useCallback((command: string, confidence: number = 1.0) => {
    // If we're waiting for a yes/no confirmation
    if (confirmationRef.current.active) {
      const trimmed = command.trim();
      if (trimmed.includes('yes') || trimmed === 'yeah' || trimmed === 'yep' || trimmed === 'sure') {
        // Execute the suggested command
        const cmd = confirmationRef.current.suggestedCommand;
        confirmationRef.current = { active: false, suggestedCommand: '' };
        setSuggestions([]);
        setRecognizedText('');
        processVoiceCommand(cmd, 1.0);
        return;
      } else if (trimmed.includes('no') || trimmed === 'nope' || trimmed === 'nah' || trimmed === 'cancel') {
        confirmationRef.current = { active: false, suggestedCommand: '' };
        setSuggestions([]);
        setRecognizedText('');
        speak('Okay, please try again.');
        return;
      }
      // If neither yes nor no, treat as a new command (exit confirmation mode)
      confirmationRef.current = { active: false, suggestedCommand: '' };
      setSuggestions([]);
    }

    processVoiceCommand(command, confidence);
  }, []);

  const processVoiceCommand = useCallback((command: string, confidence: number = 1.0) => {
    let recognized = false;
    setLastInputType('voice');

    // Turn off mic
    if (command.includes('turn off mic') || command.includes('disable mic') || command.includes('stop listening')) {
      setVoiceEnabled(false);
      speak('Voice recognition disabled');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Help
    else if (command.includes('list all commands') || command.includes('help') || command.includes('what can i say')) {
      speak('Music: play, pause, next, previous, volume up, volume down. Navigation: navigate to home, work, fuel station, coffee shop, restaurant, hospital, shopping mall, gym. Climate: turn on or off AC, set fan speed 1 to 5, set temperature. System: go to dashboard, vehicle info, contacts, list all commands, turn off mic.', 0.8);
      recognized = true;
      setTimeout(() => closeOverlay(), 1000);
    }
    // Light/Dark mode
    else if (command.includes('light mode')) {
      if (isDarkMode) { toggleDarkMode(); speak('Light mode activated'); }
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    else if (command.includes('dark mode')) {
      if (!isDarkMode) { toggleDarkMode(); speak('Dark mode activated'); }
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Play music
    else if (command.includes('play music') || command.includes('start music') || command.includes('resume music')) {
      setCurrentPanel('music');
      if (!isPlaying) togglePlay();
      speak('Playing music');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Pause music
    else if (command.includes('pause') || command.includes('stop music')) {
      if (isPlaying) { togglePlay(); speak('Music paused'); }
      else { speak('Music is already paused'); }
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Next song (always resumes)
    else if (command.includes('next song') || command.includes('play next') || command.includes('skip') || command.includes('next track')) {
      if (!isPlaying) togglePlay();
      nextSong();
      speak('Playing next track');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Previous song
    else if (command.includes('previous song') || command.includes('play previous') || command.includes('previous track')) {
      previousSong();
      speak('Playing previous song');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Volume
    else if (command.includes('increase volume') || command.includes('volume up') || command.includes('louder')) {
      const v = Math.min(100, volume + 10);
      setVolume(v);
      speak(`Volume set to ${v} percent`);
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    else if (command.includes('decrease volume') || command.includes('volume down') || command.includes('quieter') || command.includes('lower volume')) {
      const v = Math.max(0, volume - 10);
      setVolume(v);
      speak(`Volume set to ${v} percent`);
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Navigation
    else if (command.includes('navigate') || (command.includes('go to') && !command.includes('dashboard'))) {
      const map: Record<string, string> = {
        'home': 'Home', 'work': 'Work',
        'fuel': 'Nearest Fuel Station', 'gas': 'Nearest Fuel Station', 'petrol': 'Nearest Fuel Station',
        'coffee': 'Nearest Coffee Shop', 'cafe': 'Nearest Coffee Shop',
        'restaurant': 'Nearest Restaurant', 'food': 'Nearest Restaurant',
        'hospital': 'Nearest Hospital', 'medical': 'Nearest Hospital',
        'shopping': 'Nearest Shopping Mall', 'mall': 'Nearest Shopping Mall',
        'gym': 'Gym',
      };
      let dest = null;
      for (const [key, val] of Object.entries(map)) {
        if (command.includes(key)) { dest = val; break; }
      }
      if (dest) {
        setCurrentPanel('navigation');
        navigateTo(dest);
        speak(`Navigating to ${dest}`);
        recognized = true;
        setTimeout(() => closeOverlay(), 800);
      }
    }
    // Contacts
    else if (command.includes('contacts') || command.includes('phone')) {
      setCurrentPanel('phone');
      speak('Opening contacts');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Call
    else if (command.includes('call')) {
      const names = ['john doe', 'jane smith', 'bob wilson', 'alice brown'];
      const found = names.find(n => command.includes(n));
      if (found) {
        const proper = found.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        setCurrentPanel('phone');
        callContact(proper);
        speak(`Calling ${proper}`);
        recognized = true;
        setTimeout(() => closeOverlay(), 800);
      }
    }
    else if (command.includes('answer') || command.includes('pick up')) {
      answerCall(); speak('Call answered'); recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    else if (command.includes('reject') || command.includes('decline') || command.includes('hang up')) {
      rejectCall(); speak('Call rejected'); recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Climate
    else if (command.includes('turn on ac') || command.includes('ac on')) {
      setCurrentPanel('climate');
      if (!isACOn) { toggleAC(); speak('Air conditioning turned on'); }
      else { speak('Air conditioning is already on'); }
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    else if (command.includes('turn off ac') || command.includes('ac off')) {
      setCurrentPanel('climate');
      if (isACOn) { toggleAC(); speak('Air conditioning turned off'); }
      else { speak('Air conditioning is already off'); }
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    else if (command.includes('fan speed')) {
      const m = command.match(/(\d+)/);
      if (m) {
        const s = parseInt(m[1]);
        if (s >= 1 && s <= 5) {
          setCurrentPanel('climate');
          setFanSpeed(s);
          speak(`Fan speed set to level ${s}`);
          recognized = true;
          setTimeout(() => closeOverlay(), 800);
        }
      }
    }
    else if (command.includes('set temperature') || command.includes('temperature to')) {
      const m = command.match(/(\d+)/);
      if (m) {
        const t = parseInt(m[1]);
        setCurrentPanel('climate');
        setTemperature(t);
        speak(`Temperature set to ${t} degrees`);
        recognized = true;
        setTimeout(() => closeOverlay(), 800);
      }
    }
    // Dashboard
    else if (command.includes('dashboard') || command.includes('go dash') || command.includes('main screen') || command.includes('home screen')) {
      setCurrentPanel('dashboard');
      speak('Returning to dashboard');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Vehicle info
    else if (command.includes('vehicle') || command.includes('car info')) {
      setCurrentPanel('vehicle');
      speak('Opening vehicle information');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Open music panel
    else if (command.includes('open music') || command.includes('music panel')) {
      setCurrentPanel('music');
      speak('Opening music panel');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Climate panel
    else if (command.includes('climate') || command.includes('climate control')) {
      setCurrentPanel('climate');
      speak('Opening climate control');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    // Navigation panel
    else if (command.includes('navigation panel') || command.includes('open navigation')) {
      setCurrentPanel('navigation');
      speak('Opening navigation');
      recognized = true;
      setTimeout(() => closeOverlay(), 800);
    }
    
    if (!recognized) {
      if (confidence >= 0.5) {
        // Enter confirmation mode - do NOT treat next yes/no as a new command
        confirmationRef.current = { active: true, suggestedCommand: command };
        setSuggestions([command]);
        speak(`Did you mean ${command}?`);
      } else {
        speak("Sorry, I didn't catch that. Please try again.");
        setTimeout(() => setRecognizedText(''), 2000);
      }
    } else {
      addCommand('voice', command);
      toast({ title: "🎤 Voice Command", description: command, duration: 2000 });
    }
  }, [isPlaying, volume, isDarkMode, isACOn, closeOverlay]);

  return (
    <VoiceRecognitionOverlay
      isActive={voiceOverlayActive}
      onClose={closeOverlay}
      recognizedText={recognizedText}
      isListening={isListening}
      suggestions={suggestions}
    />
  );
};
