import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
}

interface MusicPlayerContextType {
  currentSong: Song;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  playlist: Song[];
  togglePlay: () => void;
  nextSong: () => void;
  previousSong: () => void;
  setVolume: (volume: number | ((prev: number) => number)) => void;
  setProgress: (progress: number) => void;
}

const songs: Song[] = [
  { id: 1, title: 'Midnight Drive', artist: 'Synthwave Artist', src: '/music/midnight-drive.wav' },
  { id: 2, title: 'Electric Dreams', artist: 'Neon Lights', src: '/music/electric-dreams.wav' },
  { id: 3, title: 'Highway Nights', artist: 'Retro Wave', src: '/music/highway-nights.wav' },
];

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(70);
  const [progress, setProgressState] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgressState((audio.currentTime / audio.duration) * 100);
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      // Auto next
      setCurrentSongIndex(prev => (prev + 1) % songs.length);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Load song when index changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const wasPlaying = isPlaying;
    audio.src = songs[currentSongIndex].src;
    audio.load();
    setProgressState(0);
    
    if (wasPlaying) {
      audio.play().catch(console.error);
    }
  }, [currentSongIndex]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const currentSong = songs[currentSongIndex];

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const nextSong = useCallback(() => {
    setCurrentSongIndex(prev => (prev + 1) % songs.length);
  }, []);

  const previousSong = useCallback(() => {
    setCurrentSongIndex(prev => (prev - 1 + songs.length) % songs.length);
  }, []);

  const setVolume = useCallback((v: number | ((prev: number) => number)) => {
    setVolumeState(prev => {
      const newVal = typeof v === 'function' ? v(prev) : v;
      return Math.max(0, Math.min(100, newVal));
    });
  }, []);

  const setProgress = useCallback((p: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = (p / 100) * audio.duration;
      setProgressState(p);
    }
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        volume,
        progress,
        duration,
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
