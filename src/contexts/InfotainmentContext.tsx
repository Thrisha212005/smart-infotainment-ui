import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface Command {
  id: string;
  type: 'voice' | 'gesture';
  command: string;
  timestamp: Date;
}

interface InfotainmentContextType {
  currentPanel: string;
  setCurrentPanel: (panel: string) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  gestureEnabled: boolean;
  setGestureEnabled: (enabled: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  commands: Command[];
  addCommand: (type: 'voice' | 'gesture', command: string) => void;
  speak: (text: string) => void;
}

const InfotainmentContext = createContext<InfotainmentContextType | undefined>(undefined);

export const InfotainmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPanel, setCurrentPanel] = useState('dashboard');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [commands, setCommands] = useState<Command[]>([]);

  const addCommand = useCallback((type: 'voice' | 'gesture', command: string) => {
    const newCommand: Command = {
      id: Date.now().toString(),
      type,
      command,
      timestamp: new Date(),
    };
    setCommands(prev => [newCommand, ...prev].slice(0, 50)); // Keep last 50 commands
  }, []);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (currentPanel === 'dashboard') {
      speak('Welcome to your Smart Infotainment System');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <InfotainmentContext.Provider
      value={{
        currentPanel,
        setCurrentPanel,
        voiceEnabled,
        setVoiceEnabled,
        gestureEnabled,
        setGestureEnabled,
        isDarkMode,
        toggleDarkMode,
        commands,
        addCommand,
        speak,
      }}
    >
      {children}
    </InfotainmentContext.Provider>
  );
};

export const useInfotainment = () => {
  const context = useContext(InfotainmentContext);
  if (!context) {
    throw new Error('useInfotainment must be used within InfotainmentProvider');
  }
  return context;
};
