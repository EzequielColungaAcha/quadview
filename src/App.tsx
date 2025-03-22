import React from 'react';
import { DollarRates } from './components/DollarRates';
import { WeatherCast } from './components/WeatherCast';
import { VideoPlayer } from './components/VideoPlayer';
import { PlaylistAndControls } from './components/PlaylistAndControls';
import { DateTime } from './components/DateTime';
import {
  VideoPlayerProvider,
  useVideoPlayer,
} from './contexts/VideoPlayerContext';
import { WeatherProvider } from './contexts/WeatherContext';

function VideoPlayerSection() {
  const {
    playlist,
    currentIndex,
    videoRef,
    handleVideoEnded,
    handleTimeUpdate,
    handlePlay,
    handlePause,
    handleLoadedMetadata,
  } = useVideoPlayer();

  return (
    <VideoPlayer
      currentVideo={playlist.length > 0 ? playlist[currentIndex].path : null}
      videoRef={videoRef}
      onEnded={handleVideoEnded}
      onTimeUpdate={handleTimeUpdate}
      onPlay={handlePlay}
      onPause={handlePause}
      onLoadedMetadata={handleLoadedMetadata}
    />
  );
}

function PlaylistSection() {
  const {
    handlePlay,
    handlePause,
    handleNext,
    handlePrevious,
    handleToggleRepeat,
    handleToggleShuffle,
    handleVolumeChange,
    handleSeek,
    handleSelectVideo,
    handleRemoveVideo,
    handleDragEnd,
    refreshPlaylist,
    isPlaying,
    repeat,
    shuffle,
    playlist,
    currentIndex,
    volume,
    currentTime,
    duration,
    isLoading,
  } = useVideoPlayer();

  return (
    <PlaylistAndControls
      onPlay={handlePlay}
      onPause={handlePause}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onToggleRepeat={handleToggleRepeat}
      onToggleShuffle={handleToggleShuffle}
      onVolumeChange={handleVolumeChange}
      onSeek={handleSeek}
      onSelectVideo={handleSelectVideo}
      onRemoveVideo={handleRemoveVideo}
      onDragEnd={handleDragEnd}
      onRefreshPlaylist={refreshPlaylist}
      isPlaying={isPlaying}
      repeat={repeat}
      shuffle={shuffle}
      hasVideos={playlist.length > 0}
      playlist={playlist}
      currentIndex={currentIndex}
      volume={volume}
      currentTime={currentTime}
      duration={duration}
      isLoading={isLoading}
    />
  );
}

function App() {
  return (
    <WeatherProvider>
      <VideoPlayerProvider>
        <div className='h-screen w-screen flex flex-col'>
          <div className='grid grid-cols-2 h-[55%]'>
            <div>
              <VideoPlayerSection />
            </div>
            <div className='max-h-full overflow-y-hidden'>
              <PlaylistSection />
            </div>
          </div>
          <div className='h-10'>
            <DateTime />
          </div>
          <div className='h-[45%] grid grid-cols-2'>
            <div>
              <WeatherCast />
            </div>
            <div>
              <DollarRates />
            </div>
          </div>
        </div>
      </VideoPlayerProvider>
    </WeatherProvider>
  );
}

export default App;