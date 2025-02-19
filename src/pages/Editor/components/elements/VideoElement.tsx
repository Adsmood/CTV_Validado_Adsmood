import React from 'react';
import { Box, IconButton, Stack, Slider } from '@mui/material';
import { ZoomIn, CropFree } from '@mui/icons-material';
import { useEditorStore } from '../../../../stores/editorStore';

interface VideoElementProps {
  data: {
    src?: string;
    style?: {
      scale: number;
      position: { x: number; y: number };
    };
  };
  isSelected: boolean;
  elementId?: string;
}

const VideoElement: React.FC<VideoElementProps> = ({ data, isSelected, elementId }) => {
  const updateElement = useEditorStore((state) => state.updateElement);

  const handleStyleChange = (key: 'scale' | 'position', value: any) => {
    if (elementId) {
      const newStyle = {
        ...data.style,
        [key]: key === 'position' ? { ...data.style?.position, ...value } : value,
      };
      
      updateElement(elementId, {
        content: {
          ...data,
          style: newStyle,
        },
      });
    }
  };

  if (!data.src) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'action.hover',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Agrega un video desde el panel de herramientas
      </Box>
    );
  }

  const scale = data.style?.scale || 1;
  const position = data.style?.position || { x: 50, y: 50 };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
      }}
    >
      <Box
        component="video"
        src={data.src}
        autoPlay
        loop
        muted
        playsInline
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      />

      {isSelected && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            bgcolor: 'background.paper',
            borderRadius: 1,
            p: 1,
          }}
        >
          <Box sx={{ width: 150 }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ZoomIn sx={{ mr: 1 }} />
                <Slider
                  size="small"
                  value={scale}
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
                  value={position.x}
                  min={0}
                  max={100}
                  onChange={(_: Event, value: number | number[]) =>
                    handleStyleChange('position', { x: Array.isArray(value) ? value[0] : value })
                  }
                />
              </Box>
              <Slider
                size="small"
                value={position.y}
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
        </Stack>
      )}
    </Box>
  );
};

export default VideoElement; 