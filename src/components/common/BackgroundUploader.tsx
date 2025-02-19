import React, { useState } from 'react';
import { Box, Dialog, IconButton, Slider, Stack } from '@mui/material';
import { Add as AddIcon, ZoomIn, CropFree } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { useEditorStore } from '../../stores/editorStore';

export interface Background {
  url: string;
  type: 'image' | 'video';
  style: {
    scale: number;
    position: { x: number; y: number };
  };
  originalFile: File;
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
      console.log('Archivo recibido:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validar tipo de archivo
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('El archivo debe ser una imagen o video.');
      }

      // Si es un video, subir a B2 primero
      if (file.type.startsWith('video/')) {
        if (file.size < 1000000) { // 1MB
          throw new Error('El archivo de video debe ser al menos 1MB.');
        }

        const formData = new FormData();
        formData.append('file', file);
        
        try {
          console.log('Iniciando subida a B2...');
          const response = await fetch('https://assets-service-hm83.onrender.com/api/assets/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error de respuesta B2:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            throw new Error(errorData.error || `Error al subir el video: ${response.statusText}`);
          }

          const data = await response.json();
          if (!data.url) {
            throw new Error('No se recibió la URL del archivo');
          }

          // Verificar que el archivo sea accesible
          console.log('Verificando accesibilidad del archivo...');
          const fileCheck = await fetch(data.url, { method: 'HEAD' });
          if (!fileCheck.ok) {
            throw new Error('El archivo subido no es accesible');
          }

          // Establecer como fondo
          setBackground({
            url: data.url,
            type: 'video',
            style: {
              scale: 1,
              position: { x: 0, y: 0 },
            },
            originalFile: file
          });
        } catch (error) {
          console.error('Error detallado al subir a B2:', error);
          throw error instanceof Error 
            ? error 
            : new Error('Error inesperado al subir el archivo');
        }
      } else {
        // Si es una imagen, usar URL.createObjectURL
        const url = URL.createObjectURL(file);
        console.log('URL creada:', url);

        setBackground({
          url,
          type: 'image',
          style: {
            scale: 1,
            position: { x: 50, y: 50 },
          },
          originalFile: file
        });
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error al procesar el fondo:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar el archivo');
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
    </Stack>
  );
};

export default BackgroundUploader;