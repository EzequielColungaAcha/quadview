import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Volume2,
  Volume1,
  VolumeX,
  GripVertical,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { removeExtension } from '../utils/FileWithoutExtension';

interface VideoFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mtime: string;
  duration: number;
}

interface PlaylistItemProps {
  id: string;
  name: string;
  duration: number;
  isCurrentVideo: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function PlaylistItem({
  id,
  name,
  duration,
  isCurrentVideo,
  onClick,
  onRemove,
}: PlaylistItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between px-3 py-1.5 hover:bg-gray-800 cursor-pointer ${
        isCurrentVideo ? 'bg-gray-800' : ''
      }`}
      onClick={onClick}
    >
      <div className='flex items-center space-x-2 flex-1 min-w-0'>
        {isCurrentVideo && (
          <Play className='w-3 h-3 text-blue-500 flex-shrink-0' />
        )}
        <span
          className={`text-xs truncate ${
            isCurrentVideo ? 'text-blue-500' : ''
          }`}
        >
          {removeExtension(name)}
        </span>
        <span className='text-xs text-gray-400 flex-shrink-0'>
          {formatDuration(duration)}
        </span>
      </div>
      <div className='flex items-center space-x-1 flex-shrink-0'>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className='p-1 text-gray-400 hover:text-red-500 transition-colors'
          title='Remove from playlist'
        >
          <Trash2 className='w-3 h-3' />
        </button>
        <div
          {...attributes}
          {...listeners}
          className='cursor-grab active:cursor-grabbing p-1'
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className='w-3 h-3 text-gray-400' />
        </div>
      </div>
    </div>
  );
}

interface PlaylistControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onSelectVideo: (index: number) => void;
  onRemoveVideo: (index: number) => void;
  onDragEnd: (oldIndex: number, newIndex: number) => void;
  onRefreshPlaylist: () => void;
  isPlaying: boolean;
  repeat: boolean;
  shuffle: boolean;
  hasVideos: boolean;
  playlist: VideoFile[];
  currentIndex: number;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
}

export function PlaylistAndControls({
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onToggleRepeat,
  onToggleShuffle,
  onVolumeChange,
  onSeek,
  onSelectVideo,
  onRemoveVideo,
  onDragEnd,
  onRefreshPlaylist,
  isPlaying,
  repeat,
  shuffle,
  hasVideos,
  playlist,
  currentIndex,
  volume,
  currentTime,
  duration,
  isLoading,
}: PlaylistControlsProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const formatTime = (seconds: number) => {
    if (!hasVideos || !seconds || isNaN(seconds)) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = playlist.findIndex((item) => item.id === active.id);
      const newIndex = playlist.findIndex((item) => item.id === over.id);
      onDragEnd(oldIndex, newIndex);
    }
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className='h-full flex flex-col bg-gray-900 text-white'>
      <div className='p-2 border-b border-gray-700 flex items-center space-x-3'>
        <button
          onClick={onRefreshPlaylist}
          className='px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center text-xs'
        >
          <RefreshCw className='w-3 h-3 mr-1' />
          Actualizar lista
        </button>

        <div className='flex-1 flex items-center justify-center space-x-2'>
          <button
            onClick={onToggleRepeat}
            className={`p-1 rounded ${
              repeat ? 'text-blue-500' : 'text-gray-400 hover:text-white'
            }`}
            title='Repeat'
          >
            <Repeat className='w-3 h-3' />
          </button>
          <button
            onClick={onToggleShuffle}
            className={`p-1 rounded ${
              shuffle ? 'text-blue-500' : 'text-gray-400 hover:text-white'
            }`}
            title='Shuffle'
          >
            <Shuffle className='w-3 h-3' />
          </button>
          <button
            onClick={onPrevious}
            className='p-1 text-gray-400 hover:text-white disabled:opacity-50'
            disabled={!hasVideos}
          >
            <SkipBack className='w-4 h-4' />
          </button>
          <button
            onClick={isPlaying ? onPause : onPlay}
            className='p-1 text-white hover:text-blue-500 disabled:opacity-50'
            disabled={!hasVideos}
          >
            {isPlaying ? (
              <Pause className='w-5 h-5' />
            ) : (
              <Play className='w-5 h-5' />
            )}
          </button>
          <button
            onClick={onNext}
            className='p-1 text-gray-400 hover:text-white disabled:opacity-50'
            disabled={!hasVideos}
          >
            <SkipForward className='w-4 h-4' />
          </button>
        </div>

        <div className='flex items-center space-x-1 min-w-[100px]'>
          <VolumeIcon className='w-3 h-3' />
          <input
            type='range'
            min='0'
            max='1'
            step='0.01'
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className='w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer'
          />
        </div>
      </div>

      <div className='flex items-center justify-center gap-1 mt-1'>
        {playlist.length ? (
          <>
            <h4 className='text-white'>
              {removeExtension(playlist[currentIndex].name)}
            </h4>
          </>
        ) : (
          ''
        )}
      </div>
      <div className='px-3 py-1.5 border-b border-gray-700 flex items-center space-x-3 text-xs'>
        {isLoading ? (
          <div className='flex items-center justify-center w-full'>
            <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
          </div>
        ) : (
          <>
            <span className='text-gray-400 w-8'>{formatTime(currentTime)}</span>
            <input
              type='range'
              min='0'
              max={duration || 100}
              value={currentTime || 0}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className='flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer'
              disabled={!hasVideos}
            />
            <span className='text-gray-400 w-8'>{formatTime(duration)}</span>
          </>
        )}
      </div>

      <div className='flex-1 overflow-y-auto overflow-x-hidden mt-2'>
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={playlist.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {playlist.map((item, index) => (
              <PlaylistItem
                key={item.id}
                id={item.id}
                name={item.name}
                duration={item.duration}
                isCurrentVideo={index === currentIndex}
                onClick={() => onSelectVideo(index)}
                onRemove={() => onRemoveVideo(index)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}