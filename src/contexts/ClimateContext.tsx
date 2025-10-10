import React, { createContext, useContext, useState } from 'react';

interface ClimateContextType {
  temperature: number;
  fanSpeed: number;
  isACOn: boolean;
  setTemperature: (temp: number) => void;
  setFanSpeed: (speed: number) => void;
  toggleAC: () => void;
}

const ClimateContext = createContext<ClimateContextType | undefined>(undefined);

export const ClimateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [temperature, setTemperature] = useState(22);
  const [fanSpeed, setFanSpeed] = useState(2);
  const [isACOn, setIsACOn] = useState(true);

  const toggleAC = () => setIsACOn(prev => !prev);

  return (
    <ClimateContext.Provider
      value={{
        temperature,
        fanSpeed,
        isACOn,
        setTemperature,
        setFanSpeed,
        toggleAC,
      }}
    >
      {children}
    </ClimateContext.Provider>
  );
};

export const useClimate = () => {
  const context = useContext(ClimateContext);
  if (!context) {
    throw new Error('useClimate must be used within ClimateProvider');
  }
  return context;
};
