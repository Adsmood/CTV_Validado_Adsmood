import React from 'react';
import { Box, Slider, IconButton, Typography } from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  FastRewind as RewindIcon,
  FastForward as ForwardIcon,
} from '@mui/icons-material';
import { useEditorStore } from '../../../stores/editorStore';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Timeline: React.FC = () => {
  const { timeline, updateTimeline } = useEditorStore();
  const { currentTime, isPlaying, duration } = timeline;

  const togglePlayPause = () => {
    updateTimeline({ isPlaying: !isPlaying });
  };

  const handleTimeChange = (_: Event, value: number | number[]) => {
    updateTimeline({ currentTime: value as number });
  };

  const handleRewind = () => {
    updateTimeline({ currentTime: 0 });
  };

  const handleForward = () => {
    updateTimeline({ currentTime: duration });
  };

  return (
    <Box className="timeline">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <IconButton onClick={handleRewind} size="small">
          <RewindIcon />
        </IconButton>
        <IconButton onClick={togglePlayPause} size="small">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        <IconButton onClick={handleForward} size="small">
          <ForwardIcon />
        </IconButton>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" sx={{ minWidth: 45 }}>
            {formatTime(currentTime)}
          </Typography>
          <Slider
            value={currentTime}
            onChange={handleTimeChange}
            min={0}
            max={duration}
            step={0.1}
          />
          <Typography variant="caption" sx={{ minWidth: 45 }}>
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Timeline; 