import React, { useState } from 'react';
import { Box, Dialog, IconButton, Tooltip, Stack, Slider } from '@mui/material';
import { VideoCall as VideoIcon, ZoomIn, CropFree } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { useEditorStore } from '../../stores/editorStore';

const VideoUploader: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { background, setBackground } = useEditorStore((state) => ({
    background: state.background,
    setBackground: state.setBackground,
  }));
  const [style, setStyle] = useState({
    scale: 1,
    position: { x: 50, y: 50 },
  });

  const addElement = useEditorStore((state) => state.addElement);

  const handleFileAccepted = async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      addElement('video', {
        src: url,
        style: {
          scale: 1,
          position: { x: 50, y: 50 },
        },
      });
      setOpen(false);
    } catch (error) {
      console.error('Error al procesar el video:', error);
    }
  };

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
                onChange={(_: Event, value: number | number[]) => 
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
                onChange={(_: Event, value: number | number[]) =>
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
              onChange={(_: Event, value: number | number[]) =>
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