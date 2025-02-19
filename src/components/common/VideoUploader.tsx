import React, { useState } from 'react';
import { Box, Dialog, IconButton, Tooltip } from '@mui/material';
import { VideoCall as VideoIcon } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { useEditorStore } from '../../stores/editorStore';

const VideoUploader: React.FC = () => {
  const [open, setOpen] = useState(false);
  const addElement = useEditorStore((state) => state.addElement);

  const handleFileAccepted = async (file: File) => {
    try {
      console.log('Archivo recibido:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      if (file.size < 1000000) { // 1MB
        throw new Error('El archivo es demasiado pequeño. Debe ser al menos 1MB.');
      }

      if (!file.type.startsWith('video/')) {
        throw new Error('El archivo debe ser un video.');
      }

      // Crear un Blob con el archivo original
      const videoBlob = new Blob([file], { type: file.type });
      console.log('Blob creado:', {
        size: videoBlob.size,
        type: videoBlob.type
      });

      // Verificar que el tamaño del Blob coincida con el archivo original
      if (videoBlob.size !== file.size) {
        throw new Error('Error al procesar el video: el tamaño no coincide');
      }

      // Crear URL del Blob
      const url = URL.createObjectURL(videoBlob);
      console.log('URL creada:', url);

      // Verificar que el video sea reproducible
      try {
        const video = document.createElement('video');
        video.src = url;
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = reject;
        });
        console.log('Video verificado:', {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
      } catch (error) {
        console.error('Error al verificar el video:', error);
        URL.revokeObjectURL(url);
        throw new Error('El archivo de video no es válido o está corrupto');
      }

      // Agregar el elemento
      addElement('video', {
        src: url,
        originalFile: file, // Guardamos el archivo original sin modificar
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        },
        style: {
          scale: 1,
          position: { x: 50, y: 50 }
        }
      });

      setOpen(false);
    } catch (error) {
      console.error('Error al procesar el video:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar el video');
    }
  };

  return (
    <Tooltip title="Añadir Video" placement="right">
      <span>
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            width: '44px',
            height: '44px',
          }}
        >
          <VideoIcon />
        </IconButton>

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
      </span>
    </Tooltip>
  );
};

export default VideoUploader;