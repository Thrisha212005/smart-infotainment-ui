import React from 'react';
import { Car, Gauge, Droplet, Battery, Navigation } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const VehiclePanel: React.FC = () => {
  const vehicleData = {
    speed: 65,
    fuelLevel: 72,
    batteryLevel: 88,
    odometer: 45678,
    range: 380,
    engineTemp: 92,
  };

  return (
    <div className="glass rounded-2xl p-8 h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 gradient-vehicle rounded-2xl flex items-center justify-center">
          <Car className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Vehicle Information</h2>
      </div>

      {/* Speed Display */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-baseline">
            <span className="text-7xl font-bold">{vehicleData.speed}</span>
            <span className="text-3xl text-muted-foreground ml-2">km/h</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Current Speed</p>
        </div>
      </div>

      {/* Vehicle Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Fuel Level */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Droplet className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium">Fuel Level</span>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold">{vehicleData.fuelLevel}%</span>
          </div>
          <Progress value={vehicleData.fuelLevel} className="h-2" />
        </div>

        {/* Battery */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Battery className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">Battery</span>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold">{vehicleData.batteryLevel}%</span>
          </div>
          <Progress value={vehicleData.batteryLevel} className="h-2" />
        </div>

        {/* Range */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium">Range</span>
          </div>
          <div>
            <span className="text-3xl font-bold">{vehicleData.range}</span>
            <span className="text-lg text-muted-foreground ml-1">km</span>
          </div>
        </div>

        {/* Engine Temp */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium">Engine Temp</span>
          </div>
          <div>
            <span className="text-3xl font-bold">{vehicleData.engineTemp}</span>
            <span className="text-lg text-muted-foreground ml-1">°C</span>
          </div>
        </div>
      </div>

      {/* Odometer */}
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">Total Distance</p>
        <p className="text-4xl font-bold">
          {vehicleData.odometer.toLocaleString()} <span className="text-xl text-muted-foreground">km</span>
        </p>
      </div>

      {/* Warning Messages */}
      <div className="mt-6 space-y-2">
        <div className="glass rounded-lg p-3 flex items-center gap-3 border-l-4 border-green-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-sm">All systems operational</p>
        </div>
      </div>
    </div>
  );
};
