import React from 'react';
import { Phone as PhoneIcon, PhoneCall, PhoneOff, User } from 'lucide-react';
import { usePhone } from '@/contexts/PhoneContext';
import { Button } from '@/components/ui/button';

export const PhonePanel: React.FC = () => {
  const { contacts, incomingCall, activeCall, callContact, answerCall, rejectCall, endCall } = usePhone();

  if (activeCall) {
    return (
      <div className="glass rounded-2xl p-8 h-full flex flex-col items-center justify-center">
        <div className="mb-8">
          <div className="w-32 h-32 gradient-phone rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
            <User className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-center mb-2">{activeCall.name}</h2>
          <p className="text-xl text-muted-foreground text-center">{activeCall.phone}</p>
          <p className="text-lg text-primary text-center mt-4">Call in progress...</p>
        </div>

        <Button
          onClick={endCall}
          size="lg"
          variant="destructive"
          className="w-20 h-20 rounded-full"
        >
          <PhoneOff className="w-8 h-8" />
        </Button>
      </div>
    );
  }

  if (incomingCall) {
    return (
      <div className="glass rounded-2xl p-8 h-full flex flex-col items-center justify-center">
        <div className="mb-8">
          <div className="w-32 h-32 gradient-phone rounded-full flex items-center justify-center mb-6 animate-pulse">
            <User className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-center mb-2">{incomingCall.name}</h2>
          <p className="text-xl text-muted-foreground text-center">{incomingCall.phone}</p>
          <p className="text-lg text-primary text-center mt-4">Incoming call...</p>
        </div>

        <div className="flex gap-6">
          <Button
            onClick={rejectCall}
            size="lg"
            variant="destructive"
            className="w-20 h-20 rounded-full"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
          <Button
            onClick={answerCall}
            size="lg"
            className="w-20 h-20 rounded-full gradient-phone"
          >
            <PhoneCall className="w-8 h-8 text-white" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 gradient-phone rounded-2xl flex items-center justify-center">
          <PhoneIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Contacts</h2>
      </div>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => callContact(contact.name)}
            className="w-full glass-hover rounded-xl p-4 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 gradient-phone rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg">{contact.name}</h3>
              <p className="text-sm text-muted-foreground">{contact.phone}</p>
            </div>
            <PhoneCall className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
