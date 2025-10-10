import React from 'react';
import { Home, Mic, MicOff, Hand, Sun, Moon } from 'lucide-react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { Button } from '@/components/ui/button';

export const ControlBar: React.FC = () => {
  const { 
    currentPanel, 
    setCurrentPanel, 
    voiceEnabled, 
    setVoiceEnabled, 
    gestureEnabled, 
    setGestureEnabled,
    isDarkMode,
    toggleDarkMode 
  } = useInfotainment();

  return (
    <div className="glass rounded-2xl p-4 flex items-center justify-between">
      <Button
        variant={currentPanel === 'dashboard' ? 'default' : 'ghost'}
        size="lg"
        onClick={() => setCurrentPanel('dashboard')}
        className="rounded-xl"
      >
        <Home className="w-5 h-5" />
      </Button>

      <div className="flex items-center gap-3">
        <Button
          variant={voiceEnabled ? 'default' : 'secondary'}
          size="lg"
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className="rounded-xl"
        >
          {voiceEnabled ? (
            <>
              <Mic className="w-5 h-5 mr-2" />
              Voice ON
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5 mr-2" />
              Voice OFF
            </>
          )}
        </Button>

        <Button
          variant={gestureEnabled ? 'default' : 'secondary'}
          size="lg"
          onClick={() => setGestureEnabled(!gestureEnabled)}
          className="rounded-xl"
        >
          {gestureEnabled ? (
            <>
              <Hand className="w-5 h-5 mr-2" />
              Gesture ON
            </>
          ) : (
            <>
              <Hand className="w-5 h-5 mr-2 opacity-50" />
              Gesture OFF
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={toggleDarkMode}
          className="rounded-xl"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
