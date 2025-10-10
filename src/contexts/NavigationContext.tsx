import React, { createContext, useContext, useState } from 'react';

interface NavigationContextType {
  currentDestination: string | null;
  destinations: string[];
  navigateTo: (destination: string) => void;
}

const destinations = [
  'Home',
  'Work',
  'Nearest Fuel Station',
  'Coffee Shop',
  'Restaurant',
  'Shopping Mall',
  'Gym',
  'Hospital',
];

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDestination, setCurrentDestination] = useState<string | null>(null);

  const navigateTo = (destination: string) => {
    setCurrentDestination(destination);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentDestination,
        destinations,
        navigateTo,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
