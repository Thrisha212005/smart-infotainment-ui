import React from 'react';
import { Music, Navigation, Phone, Thermometer, Car, Home } from 'lucide-react';
import { useInfotainment } from '@/contexts/InfotainmentContext';

const features = [
  { 
    id: 'music', 
    name: 'Music', 
    icon: Music, 
    gradient: 'gradient-music',
    color: 'hsl(193 97% 58%)'
  },
  { 
    id: 'navigation', 
    name: 'Navigation', 
    icon: Navigation, 
    gradient: 'gradient-navigation',
    color: 'hsl(142 76% 56%)'
  },
  { 
    id: 'phone', 
    name: 'Phone', 
    icon: Phone, 
    gradient: 'gradient-phone',
    color: 'hsl(221 83% 63%)'
  },
  { 
    id: 'climate', 
    name: 'Climate', 
    icon: Thermometer, 
    gradient: 'gradient-climate',
    color: 'hsl(25 95% 58%)'
  },
  { 
    id: 'vehicle', 
    name: 'Vehicle', 
    icon: Car, 
    gradient: 'gradient-vehicle',
    color: 'hsl(271 81% 65%)'
  },
];

export const Dashboard: React.FC = () => {
  const { setCurrentPanel } = useInfotainment();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Home className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setCurrentPanel(feature.id)}
            className="feature-card group relative overflow-hidden"
          >
            <div className="relative z-10">
              <div 
                className={`w-16 h-16 rounded-2xl ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{feature.name}</h3>
              <p className="text-muted-foreground text-sm">Tap to open</p>
            </div>
            
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
              style={{ background: feature.color }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
