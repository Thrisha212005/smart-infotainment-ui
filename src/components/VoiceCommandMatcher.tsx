import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CommandMatch {
  command: string;
  action: () => void;
  confidence: number;
  description: string;
}

interface VoiceCommandMatcherProps {
  matches: CommandMatch[];
  onSelect: (match: CommandMatch) => void;
  onCancel: () => void;
}

export const VoiceCommandMatcher: React.FC<VoiceCommandMatcherProps> = ({
  matches,
  onSelect,
  onCancel,
}) => {
  if (matches.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="bg-card/95 backdrop-blur-sm border-border p-6 max-w-md w-full space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Did you mean?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select the command you intended:
          </p>
        </div>
        
        <div className="space-y-2">
          {matches.map((match, index) => (
            <Button
              key={index}
              onClick={() => onSelect(match)}
              variant={index === 0 ? "default" : "outline"}
              className="w-full justify-start text-left h-auto py-3"
            >
              <div className="flex flex-col items-start gap-1 w-full">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{match.command}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    match.confidence >= 0.8 ? 'bg-green-500/20 text-green-300' :
                    match.confidence >= 0.6 ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {Math.round(match.confidence * 100)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{match.description}</span>
              </div>
            </Button>
          ))}
        </div>

        <Button
          onClick={onCancel}
          variant="ghost"
          className="w-full"
        >
          Cancel - Try again
        </Button>
      </Card>
    </div>
  );
};
