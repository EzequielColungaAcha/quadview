import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import axios from 'axios';
import { proxyUrl } from '../utils/ProxyUrl';

interface VideoFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mtime: string;
  duration: number;
}

interface VideoPlayerContextType {
  playlist: VideoFile[];
  currentIndex: number;
  isPlaying: boolean;
  repeat: boolean;
  shuffle: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  handlePlay: () => void;
  handlePause: () => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleToggleRepeat: () => void;
  handleToggleShuffle: () => void;
  handleVolumeChange: (volume: number) => void;
  handleSeek: (time: number) => void;
  handleSelectVideo: (index: number) => void;
  handleRemoveVideo: (index: number) => void;
  handleDragEnd: (oldIndex: number, newIndex: number) => void;
  handleVideoEnded: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  refreshPlaylist: () => Promise<void>;
}

const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null);

export function VideoPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [playlist, setPlaylist] = useState<VideoFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldAutoplay = useRef(false);

  const refreshPlaylist = async () => {
    try {
      const response = await axios.get(proxyUrl + 'videos/playlist');
      setPlaylist(response.data);
    } catch (error) {
      console.error('Error fetching playlist:', error);
    }
  };

  useEffect(() => {
    refreshPlaylist();
  }, []);

  const handlePlay = () => {
    if (videoRef.current && playlist.length > 0) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const getRandomIndex = (excludeIndex: number): number => {
    if (playlist.length <= 1) return 0;
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * playlist.length);
    } while (newIndex === excludeIndex);
    return newIndex;
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    shouldAutoplay.current = true;
    if (shuffle) {
      setCurrentIndex(getRandomIndex(currentIndex));
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    shouldAutoplay.current = true;
    if (shuffle) {
      setCurrentIndex(getRandomIndex(currentIndex));
    } else {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  const handleToggleRepeat = () => setRepeat(!repeat);
  const handleToggleShuffle = () => setShuffle(!shuffle);

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSelectVideo = (index: number) => {
    if (index === currentIndex) return;
    shouldAutoplay.current = true;
    setCurrentIndex(index);
    setIsLoading(true);
  };

  const handleRemoveVideo = (index: number) => {
    const wasPlaying = isPlaying;

    setPlaylist((prev) => {
      const newPlaylist = [...prev];
      newPlaylist.splice(index, 1);

      if (newPlaylist.length === 0) {
        setCurrentIndex(0);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      } else if (index === currentIndex) {
        shouldAutoplay.current = wasPlaying;
        setCurrentIndex(
          index >= newPlaylist.length ? newPlaylist.length - 1 : index
        );
      } else if (index < currentIndex) {
        setCurrentIndex((prev) => prev - 1);
      }

      return newPlaylist;
    });
  };

  const handleDragEnd = (oldIndex: number, newIndex: number) => {
    setPlaylist((prev) => {
      const newPlaylist = arrayMove(prev, oldIndex, newIndex);
      if (currentIndex === oldIndex) {
        setCurrentIndex(newIndex);
      } else if (currentIndex === newIndex) {
        setCurrentIndex(oldIndex);
      }
      return newPlaylist;
    });
  };

  const handleVideoEnded = () => {
    if (repeat) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    } else {
      shouldAutoplay.current = true;
      handleNext();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (shouldAutoplay.current) {
        videoRef.current.play();
        setIsPlaying(true);
        shouldAutoplay.current = false;
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [currentIndex, volume]);

  const value = {
    playlist,
    currentIndex,
    isPlaying,
    repeat,
    shuffle,
    volume,
    currentTime,
    duration,
    isLoading,
    videoRef,
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
    handleVideoEnded,
    handleTimeUpdate,
    handleLoadedMetadata,
    refreshPlaylist,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
}