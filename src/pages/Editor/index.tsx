import React from 'react';
import { Box, Stack } from '@mui/material';
import ToolsPanel from './components/ToolsPanel';
import Canvas from './components/Canvas';
import LayersPanel from './components/LayersPanel';
import Timeline from './components/Timeline';
import ProjectManager from './components/ProjectManager';

const Editor: React.FC = () => {
  return (
    <Box className="editor-container">
      <Box className="tools-panel">
        <Stack spacing={2} alignItems="center">
          <ProjectManager />
          <ToolsPanel />
        </Stack>
      </Box>
      <Box className="canvas-area">
        <Canvas />
        <Timeline />
      </Box>
      <LayersPanel />
    </Box>
  );
};

export default Editor; 