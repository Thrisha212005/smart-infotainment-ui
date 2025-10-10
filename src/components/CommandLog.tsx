import React from 'react';
import { useInfotainment } from '@/contexts/InfotainmentContext';
import { Mic, Hand } from 'lucide-react';

export const CommandLog: React.FC = () => {
  const { commands } = useInfotainment();

  return (
    <div className="glass rounded-2xl p-6 h-full">
      <h3 className="text-lg font-semibold mb-4">Command Log</h3>
      
      <div className="space-y-2 overflow-y-auto max-h-[400px]">
        {commands.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No commands yet. Try voice or gesture control!
          </p>
        ) : (
          commands.map((cmd) => (
            <div
              key={cmd.id}
              className="glass-hover rounded-lg p-3 flex items-start gap-3 animate-fade-in"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                cmd.type === 'voice' ? 'bg-primary/20' : 'bg-purple-500/20'
              }`}>
                {cmd.type === 'voice' ? (
                  <Mic className="w-4 h-4 text-primary" />
                ) : (
                  <Hand className="w-4 h-4 text-purple-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{cmd.command}</p>
                <p className="text-xs text-muted-foreground">
                  {cmd.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
