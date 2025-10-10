import React from 'react';
import { Thermometer, Wind, Power } from 'lucide-react';
import { useClimate } from '@/contexts/ClimateContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export const ClimatePanel: React.FC = () => {
  const { temperature, fanSpeed, isACOn, setTemperature, setFanSpeed, toggleAC } = useClimate();

  return (
    <div className="glass rounded-2xl p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-climate rounded-2xl flex items-center justify-center">
            <Thermometer className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Climate Control</h2>
        </div>
        
        <Button
          onClick={toggleAC}
          size="lg"
          variant={isACOn ? "default" : "secondary"}
          className={isACOn ? "gradient-climate" : ""}
        >
          <Power className={`w-5 h-5 mr-2 ${isACOn ? 'text-white' : ''}`} />
          {isACOn ? 'AC On' : 'AC Off'}
        </Button>
      </div>

      {/* Temperature Display */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline">
            <span className="text-8xl font-bold">{temperature}</span>
            <span className="text-4xl text-muted-foreground ml-2">°C</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Temperature</span>
            <span className="text-sm font-medium">{temperature}°C</span>
          </div>
          <Slider 
            value={[temperature]} 
            min={16}
            max={30}
            step={0.5}
            onValueChange={([value]) => setTemperature(value)}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>16°C</span>
            <span>30°C</span>
          </div>
        </div>
      </div>

      {/* Fan Speed */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Wind className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Fan Speed</h3>
        </div>
        
        <div className="mb-4">
          <Slider 
            value={[fanSpeed]} 
            min={0}
            max={5}
            step={1}
            onValueChange={([value]) => setFanSpeed(value)}
            className="mb-3"
          />
          <div className="flex justify-between">
            {[0, 1, 2, 3, 4, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setFanSpeed(speed)}
                className={`w-12 h-12 rounded-xl transition-all ${
                  fanSpeed === speed 
                    ? 'gradient-climate text-white shadow-lg scale-110' 
                    : 'glass hover:bg-card/60'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Climate Zones */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Driver</p>
          <p className="text-2xl font-bold">{temperature}°C</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Passenger</p>
          <p className="text-2xl font-bold">{temperature}°C</p>
        </div>
      </div>
    </div>
  );
};
