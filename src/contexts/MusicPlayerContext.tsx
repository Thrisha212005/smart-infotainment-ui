import React, { createContext, useContext, useState, useEffect } from 'react';

interface Song {
  id: number;
  title: string;
  artist: string;
  duration: number;
}

interface MusicPlayerContextType {
  currentSong: Song;
  isPlaying: boolean;
  volume: number;
  progress: number;
  playlist: Song[];
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  setVolume: (volume: number | ((prev: number) => number)) => void;
  setProgress: (progress: number) => void;
}

const songs: Song[] = [
  { id: 1, title: 'Midnight Drive', artist: 'Synthwave Artist', duration: 240 },
  { id: 2, title: 'Electric Dreams', artist: 'Neon Lights', duration: 195 },
  { id: 3, title: 'Highway Nights', artist: 'Retro Wave', duration: 210 },
  { id: 4, title: 'City Lights', artist: 'Urban Sound', duration: 225 },
];

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(0);

  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextSong();
          return 0;
        }
        return prev + (100 / currentSong.duration);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSongIndex]);

  const togglePlay = () => setIsPlaying(prev => !prev);

  const nextSong = () => {
    setCurrentSongIndex(prev => (prev + 1) % songs.length);
    setProgress(0);
  };

  const previousSong = () => {
    setCurrentSongIndex(prev => (prev - 1 + songs.length) % songs.length);
    setProgress(0);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        volume,
        progress,
        playlist: songs,
        togglePlay,
        nextSong,
        previousSong,
        setVolume,
        setProgress,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
};
