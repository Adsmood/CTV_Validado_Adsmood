import React from 'react';
import { Box, Dialog, IconButton, Tooltip } from '@mui/material';
import { VideoCall as VideoIcon } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { useEditorStore } from '../../stores/editorStore';

const VideoUploader: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const setBackground = useEditorStore((state) => state.setBackground);

  const handleFileAccepted = async (file: File) => {
    try {
      console.log('Archivo original recibido:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Validar tamaño mínimo
      if (file.size < 1000000) { // 1MB
        throw new Error('El archivo es demasiado pequeño. Debe ser al menos 1MB.');
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('video/')) {
        throw new Error('El archivo debe ser un video.');
      }

      // Crear una copia del archivo para preservar los metadatos
      const fileCopy = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });

      console.log('Copia del archivo creada:', {
        name: fileCopy.name,
        size: fileCopy.size,
        type: fileCopy.type,
        lastModified: fileCopy.lastModified
      });

      // Validar que la copia mantenga el tamaño
      if (fileCopy.size !== file.size) {
        throw new Error('Error al procesar el archivo.');
      }

      const url = URL.createObjectURL(fileCopy);
      console.log('URL creada:', url);

      // Establecer como fondo en lugar de agregar como elemento
      setBackground({
        url,
        type: 'video',
        style: {
          scale: 1,
          position: { x: 50, y: 50 },
        },
        originalFile: fileCopy // Guardar el archivo original
      });

      setOpen(false);
    } catch (error) {
      console.error('Error al procesar el video:', error);
      alert(error instanceof Error ? error.message : 'Error al procesar el video');
    }
  };

  return (
    <>
      <Tooltip title="Añadir Video" placement="right">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            width: '44px',
            height: '44px',
          }}
        >
          <VideoIcon />
        </IconButton>
      </Tooltip>

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
    </>
  );
};

export default VideoUploader; 