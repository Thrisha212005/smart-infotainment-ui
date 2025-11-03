import React, { useEffect, useState } from 'react';
import { Mic, Hand } from 'lucide-react';
import { useInfotainment } from '@/contexts/InfotainmentContext';

export const InputIndicator: React.FC = () => {
  const { lastInputType, setLastInputType } = useInfotainment();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (lastInputType) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setLastInputType(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastInputType, setLastInputType]);

  if (!show || !lastInputType) return null;

  return (
    <div className="fixed top-6 right-6 z-40 animate-fade-in">
      <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
        {lastInputType === 'voice' ? (
          <>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <Mic className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Voice</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <Hand className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Gesture</span>
          </>
        )}
      </div>
    </div>
  );
};
