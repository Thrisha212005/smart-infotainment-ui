import React from 'react';
import { InfotainmentProvider, useInfotainment } from '@/contexts/InfotainmentContext';
import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { PhoneProvider } from '@/contexts/PhoneContext';
import { ClimateProvider } from '@/contexts/ClimateContext';
import { Dashboard } from '@/components/Dashboard';
import { MusicPanel } from '@/components/panels/MusicPanel';
import { NavigationPanel } from '@/components/panels/NavigationPanel';
import { PhonePanel } from '@/components/panels/PhonePanel';
import { ClimatePanel } from '@/components/panels/ClimatePanel';
import { VehiclePanel } from '@/components/panels/VehiclePanel';
import { ControlBar } from '@/components/ControlBar';
import { CommandLog } from '@/components/CommandLog';
import { GestureControl } from '@/components/GestureControl';
import { VoiceControl } from '@/components/VoiceControl';
import { InputIndicator } from '@/components/InputIndicator';

const InfotainmentContent: React.FC = () => {
  const { currentPanel } = useInfotainment();

  const getPanelAnimation = (panel: string) => {
    switch (panel) {
      case 'music':
        return 'animate-fade-in';
      case 'navigation':
        return 'animate-slide-left';
      case 'phone':
        return 'animate-zoom-in';
      case 'climate':
        return 'animate-slide-up';
      case 'vehicle':
        return 'animate-zoom-in';
      default:
        return 'animate-fade-in';
    }
  };

  const renderPanel = () => {
    const animation = getPanelAnimation(currentPanel);
    
    switch (currentPanel) {
      case 'music':
        return <div key="music" className={animation}><MusicPanel /></div>;
      case 'navigation':
        return <div key="navigation" className={animation}><NavigationPanel /></div>;
      case 'phone':
        return <div key="phone" className={animation}><PhonePanel /></div>;
      case 'climate':
        return <div key="climate" className={animation}><ClimatePanel /></div>;
      case 'vehicle':
        return <div key="vehicle" className={animation}><VehiclePanel /></div>;
      default:
        return <div key="dashboard" className={animation}><Dashboard /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <VoiceControl />
      <InputIndicator />
      
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
            Smart Infotainment System
          </h1>
          <p className="text-muted-foreground">Voice & Gesture Controlled Dashboard</p>
        </div>
        
        <ControlBar />
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2">
          {renderPanel()}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Gesture Control Camera */}
          <div className="h-[320px]">
            <h3 className="text-lg font-semibold mb-3">Gesture Control</h3>
            <GestureControl />
          </div>

          {/* Command Log */}
          <div>
            <CommandLog />
          </div>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <InfotainmentProvider>
      <MusicPlayerProvider>
        <NavigationProvider>
          <PhoneProvider>
            <ClimateProvider>
              <InfotainmentContent />
            </ClimateProvider>
          </PhoneProvider>
        </NavigationProvider>
      </MusicPlayerProvider>
    </InfotainmentProvider>
  );
};

export default Index;
