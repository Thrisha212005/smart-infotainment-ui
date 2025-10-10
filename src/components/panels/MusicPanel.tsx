import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export const MusicPanel: React.FC = () => {
  const { 
    currentSong, 
    isPlaying, 
    volume, 
    progress, 
    togglePlay, 
    nextSong, 
    previousSong,
    setVolume,
    setProgress 
  } = useMusicPlayer();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = (progress / 100) * currentSong.duration;
  const remainingTime = currentSong.duration - currentTime;

  return (
    <div className="glass rounded-2xl p-8 h-full flex flex-col">
      {/* Album Art */}
      <div className="mb-8 mx-auto">
        <div className="w-64 h-64 gradient-music rounded-3xl flex items-center justify-center shadow-2xl">
          <div className="text-center text-white">
            <div className="text-6xl mb-2">🎵</div>
            <div className="text-sm opacity-80">Now Playing</div>
          </div>
        </div>
      </div>

      {/* Song Info */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{currentSong.title}</h2>
        <p className="text-xl text-muted-foreground">{currentSong.artist}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <Slider 
          value={[progress]} 
          max={100}
          step={1}
          onValueChange={([value]) => setProgress(value)}
          className="mb-3"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(remainingTime)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <Button
          variant="ghost"
          size="lg"
          onClick={previousSong}
          className="w-14 h-14 rounded-full hover:bg-primary/20"
        >
          <SkipBack className="w-6 h-6" />
        </Button>
        
        <Button
          onClick={togglePlay}
          size="lg"
          className="w-20 h-20 rounded-full gradient-music hover:scale-105 transition-transform shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 text-white" fill="white" />
          ) : (
            <Play className="w-8 h-8 text-white" fill="white" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="lg"
          onClick={nextSong}
          className="w-14 h-14 rounded-full hover:bg-primary/20"
        >
          <SkipForward className="w-6 h-6" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-4">
        <Volume2 className="w-5 h-5 text-muted-foreground" />
        <Slider 
          value={[volume]} 
          max={100}
          step={1}
          onValueChange={([value]) => setVolume(value)}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-12 text-right">{volume}%</span>
      </div>
    </div>
  );
};
