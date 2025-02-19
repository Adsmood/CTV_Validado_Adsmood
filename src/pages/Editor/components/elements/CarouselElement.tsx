import React, { useState, useEffect } from 'react';
import { Box, IconButton, Stack, Dialog, Typography } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import FileUploader from '../../../../components/common/FileUploader';
import { useEditorStore } from '../../../../stores/editorStore';

interface CarouselElementProps {
  data: {
    images: string[];
    currentIndex?: number;
    style?: {
      scale: number;
      position: { x: number; y: number };
    };
  };
  isSelected: boolean;
  elementId?: string;
}

const CarouselElement: React.FC<CarouselElementProps> = ({ data, isSelected, elementId }) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const updateElement = useEditorStore((state) => state.updateElement);

  const handleFileAccepted = async (file: File) => {
    try {
      const imageUrl = URL.createObjectURL(file);
      if (elementId) {
        const currentImages = data.images || [];
        const currentStyle = data.style || { scale: 1, position: { x: 50, y: 50 } };
        
        updateElement(elementId, {
          content: {
            ...data,
            images: [...currentImages, imageUrl],
            currentIndex: currentImages.length,
            style: currentStyle,
          },
        });
      }
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
    }
  };

  const handleDeleteImage = (index: number) => {
    if (elementId) {
      const newImages = [...(data.images || [])];
      newImages.splice(index, 1);
      const newIndex = Math.min(data.currentIndex || 0, newImages.length - 1);
      updateElement(elementId, {
        content: {
          ...data,
          images: newImages,
          currentIndex: newIndex,
        },
      });
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (elementId && data.images?.length > 0) {
      const currentIndex = data.currentIndex || 0;
      const newIndex = direction === 'next' 
        ? (currentIndex + 1) % data.images.length
        : (currentIndex - 1 + data.images.length) % data.images.length;
      
      updateElement(elementId, {
        content: {
          ...data,
          currentIndex: newIndex,
        },
      });
    }
  };

  const style = data.style || { scale: 1, position: { x: 50, y: 50 } };
  const currentIndex = data.currentIndex || 0;
  const hasImages = Array.isArray(data.images) && data.images.length > 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected || !data.images?.length) return;

      const currentFocus = focusedIndex ?? data.currentIndex ?? 0;
      let newIndex = currentFocus;

      switch (e.key) {
        case 'ArrowLeft':
          newIndex = Math.max(0, currentFocus - 1);
          break;
        case 'ArrowRight':
          newIndex = Math.min(data.images.length - 1, currentFocus + 1);
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex !== null) {
            updateElement(elementId!, {
              content: {
                ...data,
                currentIndex: focusedIndex,
              },
            });
            e.preventDefault();
          }
          break;
        default:
          return;
      }

      if (newIndex !== currentFocus) {
        setFocusedIndex(newIndex);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, data.images, focusedIndex, data.currentIndex, elementId, data]);

  return (
    <Box
      tabIndex={isSelected ? 0 : -1}
      onKeyDown={(e) => {
        if (!isSelected || !data.images?.length) return;
        
        switch (e.key) {
          case 'ArrowLeft':
            handleNavigate('prev');
            e.preventDefault();
            break;
          case 'ArrowRight':
            handleNavigate('next');
            e.preventDefault();
            break;
        }
      }}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        bgcolor: hasImages ? 'transparent' : 'action.hover',
        outline: 'none',
        '&:focus': {
          outline: isSelected ? '2px solid #fff' : 'none',
        },
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transform: `scale(${style.scale}) translate(${style.position.x - 50}%, ${style.position.y - 50}%)`,
          transformOrigin: 'center',
        }}
      >
        {hasImages ? (
          <>
            {data.images.map((image, index) => (
              <Box
                key={index}
                component="img"
                src={image}
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 1,
                  opacity: index === currentIndex ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              />
            ))}
          </>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <EditIcon sx={{ mr: 1 }} />
            Haz clic para añadir imágenes
          </Box>
        )}

        {hasImages && data.images.length > 1 && (
          <>
            <IconButton
              onClick={() => handleNavigate('prev')}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                zIndex: 2,
              }}
            >
              <ChevronLeft />
            </IconButton>

            <IconButton
              onClick={() => handleNavigate('next')}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
                zIndex: 2,
              }}
            >
              <ChevronRight />
            </IconButton>
          </>
        )}
      </Box>

      {isSelected && (
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            zIndex: 2,
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
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Gestionar imágenes del carrusel
          </Typography>

          <Stack spacing={2}>
            <Box sx={{ height: 200 }}>
              <FileUploader
                onFileAccepted={handleFileAccepted}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg'],
                }}
                maxSize={5242880} // 5MB
                title="Arrastra imágenes aquí, o haz clic para seleccionar"
                icon={<EditIcon />}
              />
            </Box>

            {hasImages && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {data.images.map((image, index) => (
                  <Box
                    key={index}
                    tabIndex={isSelected ? 0 : -1}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    sx={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      border: index === currentIndex ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      outline: focusedIndex === index ? '2px solid #fff' : 'none',
                      '&:focus': {
                        outline: '2px solid #fff',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={image}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteImage(index)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default CarouselElement; 