import React, { useState } from 'react';
import { proxyUrl } from '../utils/ProxyUrl';
import { Languages, Subtitles } from 'lucide-react';

interface AudioTrack {
  index: number;
  language: string;
  title: string;
  codec: string;
}

interface SubtitleTrack {
  index: number;
  language: string;
  title: string;
  codec: string;
}

interface VideoPlayerProps {
  currentVideo: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  onEnded: () => void;
  onTimeUpdate: () => void;
  onPlay: () => void;
  onPause: () => void;
  onLoadedMetadata: () => void;
  audioTracks?: AudioTrack[];
  subtitles?: SubtitleTrack[];
}

export function VideoPlayer({
  currentVideo,
  videoRef,
  onEnded,
  onTimeUpdate,
  onPlay,
  onPause,
  onLoadedMetadata,
  audioTracks = [],
  subtitles = [],
}: VideoPlayerProps) {
  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState<number | null>(null);

  const handleAudioChange = (trackIndex: number) => {
    setSelectedAudio(trackIndex);
    if (videoRef.current) {
      videoRef.current.src = `${proxyUrl}videos/stream/${currentVideo}?audio=${trackIndex}`;
      videoRef.current.play();
    }
  };

  const handleSubtitleChange = (trackIndex: number) => {
    setSelectedSubtitle(trackIndex);
    if (videoRef.current) {
      videoRef.current.src = `${proxyUrl}videos/stream/${currentVideo}?subtitle=${trackIndex}${
        selectedAudio !== null ? `&audio=${selectedAudio}` : ''
      }`;
      videoRef.current.play();
    }
  };

  return (
    <div className='h-full bg-black flex flex-col relative'>
      <div className='flex-1 flex items-center justify-center'>
        {currentVideo ? (
          <div className='w-full h-full flex justify-center'>
            <video
              ref={videoRef}
              src={`${proxyUrl}videos/stream/${currentVideo}${
                selectedAudio !== null ? `?audio=${selectedAudio}` : ''
              }${
                selectedSubtitle !== null
                  ? `${
                      selectedAudio !== null ? '&' : '?'
                    }subtitle=${selectedSubtitle}`
                  : ''
              }`}
              className='max-h-full max-w-full object-contain'
              onEnded={onEnded}
              onTimeUpdate={onTimeUpdate}
              onPlay={onPlay}
              onPause={onPause}
              onLoadedMetadata={onLoadedMetadata}
            />
          </div>
        ) : (
          <div className='text-white text-center'>
            <p>No video selected</p>
          </div>
        )}
      </div>

      {currentVideo && (audioTracks.length > 0 || subtitles.length > 0) && (
        <div className='absolute bottom-0 right-0 p-2 flex gap-2'>
          {audioTracks.length > 0 && (
            <div className='relative group'>
              <button
                className='p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors'
                title='Audio tracks'
              >
                <Languages className='w-5 h-5 text-white' />
              </button>
              <div className='absolute bottom-full right-0 mb-2 hidden group-hover:block'>
                <div className='bg-black/90 rounded p-2 text-white text-sm min-w-[200px]'>
                  {audioTracks.map((track) => (
                    <button
                      key={track.index}
                      className={`block w-full text-left px-3 py-1 rounded hover:bg-white/10 ${
                        selectedAudio === track.index ? 'text-blue-400' : ''
                      }`}
                      onClick={() => handleAudioChange(track.index)}
                    >
                      {track.title} ({track.language})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {subtitles.length > 0 && (
            <div className='relative group'>
              <button
                className='p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors'
                title='Subtitles'
              >
                <Subtitles className='w-5 h-5 text-white' />
              </button>
              <div className='absolute bottom-full right-0 mb-2 hidden group-hover:block'>
                <div className='bg-black/90 rounded p-2 text-white text-sm min-w-[200px]'>
                  <button
                    className={`block w-full text-left px-3 py-1 rounded hover:bg-white/10 ${
                      selectedSubtitle === null ? 'text-blue-400' : ''
                    }`}
                    onClick={() => setSelectedSubtitle(null)}
                  >
                    Off
                  </button>
                  {subtitles.map((track) => (
                    <button
                      key={track.index}
                      className={`block w-full text-left px-3 py-1 rounded hover:bg-white/10 ${
                        selectedSubtitle === track.index ? 'text-blue-400' : ''
                      }`}
                      onClick={() => handleSubtitleChange(track.index)}
                    >
                      {track.title} ({track.language})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
