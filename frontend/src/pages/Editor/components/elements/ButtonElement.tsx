import React, { useState, useEffect } from 'react';
import { Box, TextField, Dialog, IconButton, Stack } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import FileUploader from '../../../../components/common/FileUploader';
import { useEditorStore } from '../../../../stores/editorStore';

interface ButtonElementProps {
  data: {
    image?: string;
    url?: string;
    style?: {
      scale: number;
      position: { x: number; y: number };
    };
  };
  isSelected: boolean;
  elementId?: string;
}

const ButtonElement: React.FC<ButtonElementProps> = ({ data, isSelected, elementId }) => {
  const [open, setOpen] = useState(false);
  const updateElement = useEditorStore((state) => state.updateElement);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected || !data.url || !data.image) return;

      if (e.key === 'Enter' || e.key === ' ') {
        window.open(data.url, '_blank');
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, data.url, data.image]);

  const handleFileAccepted = async (file: File) => {
    try {
      const imageUrl = URL.createObjectURL(file);
      if (elementId) {
        updateElement(elementId, {
          content: {
            ...data,
            image: imageUrl,
            style: data.style || { scale: 1, position: { x: 50, y: 50 } },
          },
        });
      }
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    if (elementId) {
      updateElement(elementId, {
        content: {
          ...data,
          url: newUrl,
          style: data.style || { scale: 1, position: { x: 50, y: 50 } },
        },
      });
    }
  };

  const handleClick = () => {
    if (!isSelected && data.url && data.image) {
      window.open(data.url, '_blank');
    }
  };

  const style = data.style || { scale: 1, position: { x: 50, y: 50 } };

  return (
    <Box
      tabIndex={isSelected ? 0 : -1}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        cursor: !isSelected && data.url && data.image ? 'pointer' : 'default',
        outline: 'none',
        '&:focus': {
          outline: isSelected ? '2px solid #fff' : 'none',
        },
      }}
      onClick={handleClick}
    >
      {data.image ? (
        <Box
          component="img"
          src={data.image}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `scale(${style.scale}) translate(${style.position.x - 50}%, ${style.position.y - 50}%)`,
            transformOrigin: 'center',
            bgcolor: 'transparent',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Haz clic para añadir una imagen
        </Box>
      )}

      {isSelected && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <EditIcon />
        </IconButton>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ height: 200 }}>
              <FileUploader
                onFileAccepted={handleFileAccepted}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg'],
                }}
                maxSize={5242880} // 5MB
                title="Arrastra una imagen PNG aquí, o haz clic para seleccionar"
                icon={<EditIcon />}
              />
            </Box>

            <TextField
              fullWidth
              label="URL de redirección"
              value={data.url || ''}
              onChange={handleUrlChange}
              placeholder="https://ejemplo.com"
              variant="outlined"
              size="small"
              type="url"
            />
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ButtonElement; 