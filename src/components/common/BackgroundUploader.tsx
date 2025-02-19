import React, { useState } from 'react';
import { Box, Dialog, IconButton, Slider, Stack } from '@mui/material';
import { Add as AddIcon, ZoomIn, CropFree } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { useEditorStore } from '../../stores/editorStore';

interface Background {
  url: string;
  type: 'image' | 'video';
  style: {
    scale: number;
    position: { x: number; y: number };
  };
}

const BackgroundUploader: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { background, setBackground } = useEditorStore((state) => ({
    background: state.background,
    setBackground: state.setBackground,
  }));
  const [style, setStyle] = useState({
    scale: 1,
    position: { x: 50, y: 50 },
  });

  const handleFileAccepted = async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      setBackground({
        url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        style,
      });
      setOpen(false);
    } catch (error) {
      console.error('Error al procesar el fondo:', error);
    }
  };

  const handleStyleChange = (key: 'scale' | 'position', value: any) => {
    const newStyle = { ...style };
    if (key === 'position') {
      newStyle.position = { ...newStyle.position, ...value };
    } else {
      newStyle[key] = value;
    }
    setStyle(newStyle);
    if (background) {
      setBackground({
        ...background,
        style: newStyle,
      });
    }
  };

  return (
    <>
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
        <IconButton onClick={() => setOpen(true)}>
          <AddIcon />
        </IconButton>
        
        {background && (
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
      </Stack>

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
              'image/*': ['.png', '.jpg', '.jpeg'],
              'video/*': ['.mp4', '.webm', '.ogg'],
            }}
            maxSize={52428800} // 50MB
            title="Arrastra una imagen o video aquí, o haz clic para seleccionar"
            icon={<AddIcon />}
          />
        </Box>
      </Dialog>
    </>
  );
};

export default BackgroundUploader; 