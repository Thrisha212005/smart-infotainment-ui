import React, { createContext, useContext, useState } from 'react';

interface Contact {
  id: number;
  name: string;
  phone: string;
}

interface PhoneContextType {
  contacts: Contact[];
  incomingCall: Contact | null;
  activeCall: Contact | null;
  callContact: (name: string) => void;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
}

const contactsList: Contact[] = [
  { id: 1, name: 'John Doe', phone: '+1 (555) 123-4567' },
  { id: 2, name: 'Jane Smith', phone: '+1 (555) 234-5678' },
  { id: 3, name: 'Bob Wilson', phone: '+1 (555) 345-6789' },
  { id: 4, name: 'Alice Brown', phone: '+1 (555) 456-7890' },
  { id: 5, name: 'Charlie Davis', phone: '+1 (555) 567-8901' },
];

const PhoneContext = createContext<PhoneContextType | undefined>(undefined);

export const PhoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState<Contact | null>(null);
  const [activeCall, setActiveCall] = useState<Contact | null>(null);

  const callContact = (name: string) => {
    const contact = contactsList.find(c => c.name === name);
    if (contact) {
      setActiveCall(contact);
    }
  };

  const answerCall = () => {
    if (incomingCall) {
      setActiveCall(incomingCall);
      setIncomingCall(null);
    }
  };

  const rejectCall = () => {
    setIncomingCall(null);
  };

  const endCall = () => {
    setActiveCall(null);
  };

  return (
    <PhoneContext.Provider
      value={{
        contacts: contactsList,
        incomingCall,
        activeCall,
        callContact,
        answerCall,
        rejectCall,
        endCall,
      }}
    >
      {children}
    </PhoneContext.Provider>
  );
};

export const usePhone = () => {
  const context = useContext(PhoneContext);
  if (!context) {
    throw new Error('usePhone must be used within PhoneProvider');
  }
  return context;
};
