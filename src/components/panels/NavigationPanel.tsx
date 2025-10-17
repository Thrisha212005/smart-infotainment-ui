import React from 'react';
import { MapPin, Navigation as NavIcon, Home, Briefcase, Fuel, Coffee, Utensils, Hospital, ShoppingBag, Dumbbell } from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';

export const NavigationPanel: React.FC = () => {
  const { currentDestination, destinations, navigateTo } = useNavigation();

  const getDestinationIcon = (dest: string) => {
    if (dest.includes('Home')) return <Home className="w-5 h-5" />;
    if (dest.includes('Work')) return <Briefcase className="w-5 h-5" />;
    if (dest.includes('Fuel')) return <Fuel className="w-5 h-5" />;
    if (dest.includes('Coffee')) return <Coffee className="w-5 h-5" />;
    if (dest.includes('Restaurant')) return <Utensils className="w-5 h-5" />;
    if (dest.includes('Hospital')) return <Hospital className="w-5 h-5" />;
    if (dest.includes('Mall')) return <ShoppingBag className="w-5 h-5" />;
    if (dest.includes('Gym')) return <Dumbbell className="w-5 h-5" />;
    return <MapPin className="w-5 h-5" />;
  };

  return (
    <div className="glass rounded-2xl p-8 h-full">
      {/* Map Display */}
      <div className="mb-8 relative">
        <div className="w-full h-64 gradient-navigation rounded-2xl flex items-center justify-center shadow-xl">
          <div className="text-center text-white">
            <NavIcon className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            {currentDestination ? (
              <>
                <p className="text-lg opacity-90 mb-2">Navigating to</p>
                <h3 className="text-3xl font-bold">{currentDestination}</h3>
              </>
            ) : (
              <p className="text-xl">Select a destination</p>
            )}
          </div>
        </div>
      </div>

      {/* Current Route Info */}
      {currentDestination && (
        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estimated Time</p>
              <p className="text-2xl font-bold">12 min</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Distance</p>
              <p className="text-2xl font-bold">5.2 km</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Arrival</p>
              <p className="text-2xl font-bold">3:45 PM</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Destinations */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Quick Destinations
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {destinations.map((dest) => (
            <Button
              key={dest}
              onClick={() => navigateTo(dest)}
              variant={currentDestination === dest ? "default" : "secondary"}
              className="justify-start h-auto py-3 px-4 gap-3"
            >
              {getDestinationIcon(dest)}
              <div className="text-left">
                <p className="font-medium">{dest}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
