import React, { useState, useCallback } from 'react';
import { Box, Dialog, IconButton, Tooltip, Stack, Slider } from '@mui/material';
import { VideoCall as VideoIcon, ZoomIn, CropFree } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { useEditorStore } from '../../stores/editorStore';
import type { Background } from '../../stores/editorStore';

const VideoUploader: React.FC = () => {
  const [open, setOpen] = useState(false);
  const background = useEditorStore((state) => state.background);
  const setBackground = useEditorStore((state) => state.setBackground);
  const [style, setStyle] = useState(() => ({
    scale: background?.style?.scale ?? 1,
    position: {
      x: background?.style?.position?.x ?? 50,
      y: background?.style?.position?.y ?? 50
    }
  }));

  const handleStyleChange = useCallback((key: 'scale' | 'position', value: number | { x?: number; y?: number }) => {
    const newStyle = {
      scale: style.scale,
      position: { ...style.position }
    };

    if (key === 'position') {
      Object.assign(newStyle.position, value);
    } else {
      newStyle.scale = value as number;
    }

    setStyle(newStyle);
    
    if (background) {
      const updatedBackground: Background = {
        url: background.url,
        type: background.type,
        style: newStyle,
        originalFile: background.originalFile
      };
      setBackground(updatedBackground);
    }
  }, [style, background, setBackground]);

  const handleFileAccepted = useCallback(async (file: File) => {
    try {
      if (file.size < 1000000) { // 1MB
        throw new Error('El archivo es demasiado pequeño. Debe ser al menos 1MB.');
      }

      if (!file.type.startsWith('video/')) {
        throw new Error('El archivo debe ser un video.');
      }

      const fileCopy = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });

      const url = URL.createObjectURL(fileCopy);

      const newBackground: Background = {
        url,
        type: 'video',
        style: {
          scale: 1,
          position: { x: 50, y: 50 }
        },
        originalFile: fileCopy
      };

      setBackground(newBackground);
      setOpen(false);
    } catch (error) {
      console.error('Error al procesar el video:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar el video');
    }
  }, [setBackground]);

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        position: 'absolute',
        right: 16,
        top: 16,
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 1,
        zIndex: 1000,
      }}
    >
      <Tooltip title="Añadir Video" placement="bottom">
        <IconButton onClick={() => setOpen(true)}>
          <VideoIcon />
        </IconButton>
      </Tooltip>

      {background && background.type === 'video' && (
        <Box sx={{ width: 150 }}>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ZoomIn sx={{ mr: 1 }} />
              <Slider
                size="small"
                value={style.scale}
                min={0.1}
                max={2}
                step={0.1}
                onChange={(_, value) => 
                  handleStyleChange('scale', Array.isArray(value) ? value[0] : value)
                }
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CropFree sx={{ mr: 1 }} />
              <Slider
                size="small"
                value={style.position.x}
                min={0}
                max={100}
                onChange={(_, value) =>
                  handleStyleChange('position', { x: Array.isArray(value) ? value[0] : value })
                }
              />
            </Box>
            <Slider
              size="small"
              value={style.position.y}
              min={0}
              max={100}
              orientation="vertical"
              sx={{ height: 100 }}
              onChange={(_, value) =>
                handleStyleChange('position', { y: Array.isArray(value) ? value[0] : value })
              }
            />
          </Stack>
        </Box>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2, height: 300 }}>
          <FileUploader
            onFileAccepted={handleFileAccepted}
            accept={{
              'video/*': ['.mp4', '.webm', '.ogg'],
            }}
            maxSize={52428800} // 50MB
            title="Arrastra un video aquí, o haz clic para seleccionar"
            icon={<VideoIcon />}
          />
        </Box>
      </Dialog>
    </Stack>
  );
};

export default VideoUploader;