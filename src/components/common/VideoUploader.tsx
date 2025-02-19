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

      addElement('video', {
        src: url,
        originalFile: fileCopy,
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