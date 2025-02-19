import React from 'react';
import { Box, Dialog, IconButton, Tooltip } from '@mui/material';
import { VideoCall as VideoIcon } from '@mui/icons-material';
import FileUploader from './FileUploader';
import { useEditorStore } from '../../stores/editorStore';

const VideoUploader: React.FC = () => {
  const [open, setOpen] = React.useState(false);
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