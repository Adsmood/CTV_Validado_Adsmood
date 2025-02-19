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
  const setBackground = useEditorStore((state) => state.setBackground);

  const uploadToB2 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Preparando archivo para B2:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const response = await fetch('https://assets-service-hm83.onrender.com/api/assets/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error respuesta B2:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Error al subir a B2: ${errorText}`);
    }

    const data = await response.json();
    console.log('Respuesta B2:', data);

    if (!data.url) {
      throw new Error('No se recibió la URL del archivo');
    }

    // Verificar que el archivo sea accesible
    const fileCheck = await fetch(data.url, { method: 'HEAD' });
    if (!fileCheck.ok) {
      throw new Error('El archivo subido no es accesible');
    }

    const contentLength = fileCheck.headers.get('content-length');
    console.log('Verificación archivo:', {
      url: data.url,
      contentLength,
      contentType: fileCheck.headers.get('content-type')
    });

    // Verificar que el tamaño coincida aproximadamente (permitiendo una pequeña variación)
    if (contentLength && Math.abs(parseInt(contentLength) - file.size) > 1024) {
      throw new Error('El tamaño del archivo subido no coincide con el original');
    }

    return data.url;
  };

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
      }, 60000); // 60 segundos de timeout

      video.src = url;
    });
  };

  const handleFileAccepted = async (file: File) => {
    let url: string | null = null;
    
    try {
      setUploading(true);
      setUploadProgress('Validando archivo...');

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

      setUploadProgress('Subiendo a B2...');
      url = await uploadToB2(file);
      console.log('URL de B2:', url);

      setUploadProgress('Verificando video...');
      await verifyVideo(url);

      setUploadProgress('Agregando elemento y estableciendo fondo...');
      
      // Agregar como elemento
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
          position: { x: 0, y: 0 }
        }
      });

      // Establecer como fondo
      setBackground({
        url,
        type: 'video',
        style: {
          scale: 1,
          position: { x: 0, y: 0 },
        },
        originalFile: file
      });

      setUploadProgress('¡Completado!');
      setTimeout(() => {
        setOpen(false);
        setUploading(false);
        setUploadProgress('');
      }, 1000);

    } catch (error) {
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