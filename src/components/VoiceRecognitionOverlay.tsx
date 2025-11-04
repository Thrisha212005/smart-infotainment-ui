import React, { useEffect, useState } from 'react';
import { Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecognitionOverlayProps {
  isActive: boolean;
  onClose: () => void;
  recognizedText: string;
  isListening: boolean;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
}

export const VoiceRecognitionOverlay: React.FC<VoiceRecognitionOverlayProps> = ({
  isActive,
  onClose,
  recognizedText,
  isListening,
  suggestions = [],
  onSelectSuggestion,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [suggestions]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm transition-opacity duration-500 ease-in-out animate-fade-in">
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-destructive/20"
          title="Turn off microphone"
        >
          <X className="w-6 h-6 text-destructive" />
        </Button>

        <div className="flex flex-col items-center gap-8 max-w-2xl w-full">
          {/* Animated Mic Icon */}
          <div className="relative">
            <div
              className={`w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-300 ${
                isListening ? 'scale-110 animate-pulse' : 'scale-100'
              }`}
            >
              <Mic className="w-16 h-16 text-primary" />
            </div>
            {isListening && (
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
            )}
          </div>

          {/* Status Text */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {isListening ? 'Listening...' : 'Voice Recognition'}
            </h2>
            <p className="text-muted-foreground">
              {isListening ? 'Speak your command' : 'Ready to listen'}
            </p>
          </div>

          {/* Real-time Voice-to-Text Display */}
          <div className="w-full glass rounded-2xl p-6 min-h-[80px] flex items-center justify-center animate-fade-in">
            {recognizedText ? (
              <p className="text-lg text-center font-medium">{recognizedText}</p>
            ) : (
              <p className="text-muted-foreground text-center italic">Speak now...</p>
            )}
          </div>

          {/* Command Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="w-full glass rounded-2xl p-6 space-y-4 animate-fade-in">
              <p className="text-center text-lg text-muted-foreground">Did you mean:</p>
              <p className="text-center text-xl font-medium italic">
                {suggestions[0]}
              </p>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Say "Yes" to confirm or "No" to try again
              </p>
            </div>
          )}

          {/* Voice Commands Hint */}
          {!recognizedText && !showSuggestions && (
            <div className="text-center text-sm text-muted-foreground max-w-md">
              <p>Try saying:</p>
              <p className="mt-2 opacity-70">
                "Play music" • "Navigate to home" • "Set fan speed to 3" • "List all commands"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
