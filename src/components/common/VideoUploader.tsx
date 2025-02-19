import React, { useState } from 'react';
import { Box, Dialog, IconButton, Tooltip, CircularProgress, Typography } from '@mui/material';
import { VideoCall as VideoIcon } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { useEditorStore } from '../../stores/editorStore';

const VideoUploader: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const addElement = useEditorStore((state) => state.addElement);

  const verifyVideo = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      let timeoutId: number;
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('loadedmetadata', onLoad);
        video.removeEventListener('error', onError);
        video.src = '';
        video.remove();
      };

      const onLoad = () => {
        console.log('Video verificado:', {
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight
        });
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('El archivo de video no es válido o está corrupto'));
      };

      video.addEventListener('loadedmetadata', onLoad);
      video.addEventListener('error', onError);
      
      timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('Tiempo de espera agotado al cargar el video'));
      }, 30000); // 30 segundos de timeout

      video.src = url;
    });
  };

  const handleFileAccepted = async (file: File) => {
    let url: string | null = null;
    
    try {
      setUploading(true);
      setUploadProgress('Procesando archivo...');

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

      setUploadProgress('Leyendo archivo...');
      const arrayBuffer = await file.arrayBuffer();
      
      setUploadProgress('Creando blob...');
      const videoBlob = new Blob([arrayBuffer], { type: file.type });
      console.log('Blob creado:', {
        size: videoBlob.size,
        type: videoBlob.type
      });

      if (videoBlob.size !== file.size) {
        throw new Error('Error al procesar el video: el tamaño no coincide');
      }

      setUploadProgress('Creando URL...');
      url = URL.createObjectURL(videoBlob);
      console.log('URL creada:', url);

      setUploadProgress('Verificando video...');
      await verifyVideo(url);

      setUploadProgress('Agregando elemento...');
      addElement('video', {
        src: url,
        originalFile: file,
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

      setUploadProgress('¡Completado!');
      setTimeout(() => {
        setOpen(false);
        setUploading(false);
        setUploadProgress('');
      }, 1000);

    } catch (error) {
      if (url) {
        URL.revokeObjectURL(url);
      }
      console.error('Error al procesar el video:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar el video');
      setUploading(false);
      setUploadProgress('');
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
          onClose={() => !uploading && setOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <Box sx={{ p: 2, height: 300, position: 'relative' }}>
            {uploading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 2
                }}
              >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  {uploadProgress}
                </Typography>
              </Box>
            ) : (
              <FileUploader
                onFileAccepted={handleFileAccepted}
                accept={{
                  'video/*': ['.mp4', '.webm', '.ogg'],
                }}
                maxSize={52428800} // 50MB
                title="Arrastra un video aquí, o haz clic para seleccionar"
                icon={<VideoIcon />}
              />
            )}
          </Box>
        </Dialog>
      </span>
    </Tooltip>
  );
};

export default VideoUploader;