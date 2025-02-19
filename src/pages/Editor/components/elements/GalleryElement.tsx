import React, { useState, useEffect } from 'react';
import { Box, IconButton, Stack, Dialog, Typography, Grid } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import FileUploader from '../../../../components/common/FileUploader';
import { useEditorStore } from '../../../../stores/editorStore';

interface Media {
  id: string;
  url: string;
  type: 'image' | 'video';
}

interface GalleryElementProps {
  data: {
    media: Media[];
    currentIndex?: number;
    style?: {
      scale: number;
      position: { x: number; y: number };
    };
  };
  isSelected: boolean;
  elementId?: string;
}

const GalleryElement: React.FC<GalleryElementProps> = ({ data, isSelected, elementId }) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const updateElement = useEditorStore((state) => state.updateElement);

  const currentIndex = data.currentIndex || 0;
  const currentMedia = data.media?.[currentIndex];

  const handleFileAccepted = async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      if (elementId) {
        const currentMedia = data.media || [];
        const currentStyle = data.style || { scale: 1, position: { x: 50, y: 50 } };
        
        const newMedia: Media = {
          id: Math.random().toString(36).substr(2, 9),
          url,
          type: file.type.startsWith('video/') ? 'video' : 'image',
        };

        updateElement(elementId, {
          content: {
            media: [...currentMedia, newMedia],
            currentIndex: currentMedia.length,
            style: currentStyle,
          },
        });
      }
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
    }
  };

  const handleDeleteMedia = (mediaId: string) => {
    if (elementId) {
      const newMedia = (data.media || []).filter(m => m.id !== mediaId);
      const newIndex = Math.min(currentIndex, newMedia.length - 1);
      updateElement(elementId, {
        content: {
          ...data,
          media: newMedia,
          currentIndex: newIndex >= 0 ? newIndex : 0,
        },
      });
    }
  };

  const handleMediaSelect = (index: number) => {
    if (elementId) {
      updateElement(elementId, {
        content: {
          ...data,
          currentIndex: index,
        },
      });
    }
  };

  const style = data.style || { scale: 1, position: { x: 50, y: 50 } };
  const hasMedia = Array.isArray(data.media) && data.media.length > 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected || !data.media?.length) return;

      const currentFocus = focusedIndex ?? data.currentIndex ?? 0;
      let newIndex = currentFocus;

      switch (e.key) {
        case 'ArrowLeft':
          newIndex = Math.max(0, currentFocus - 1);
          break;
        case 'ArrowRight':
          newIndex = Math.min(data.media.length - 1, currentFocus + 1);
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex !== null) {
            handleMediaSelect(focusedIndex);
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
  }, [isSelected, data.media, focusedIndex, data.currentIndex]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        bgcolor: hasMedia ? 'transparent' : 'action.hover',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transform: `scale(${style.scale}) translate(${style.position.x - 50}%, ${style.position.y - 50}%)`,
          transformOrigin: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {hasMedia ? (
          <>
            {/* Contenedor principal */}
            <Box
              sx={{
                width: '100%',
                flex: 1,
                position: 'relative',
                bgcolor: 'background.paper',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {currentMedia?.type === 'video' ? (
                <Box
                  component="video"
                  src={currentMedia.url}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  autoPlay
                  loop
                  playsInline
                  key={currentMedia.id}
                />
              ) : (
                <Box
                  component="img"
                  src={currentMedia?.url}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              )}
            </Box>

            {/* Grid de thumbnails */}
            <Box
              sx={{
                width: '100%',
                height: '20%',
                minHeight: 60,
              }}
            >
              <Grid container spacing={0.5} columns={3}>
                {data.media.map((media, index) => (
                  <Grid item xs={1} key={media.id}>
                    <Box
                      tabIndex={isSelected ? 0 : -1}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      sx={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '56.25%',
                        cursor: 'pointer',
                        border: index === currentIndex ? '2px solid' : 'none',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        overflow: 'hidden',
                        m: 0.25,
                        outline: focusedIndex === index ? '2px solid #fff' : 'none',
                        '&:focus': {
                          outline: '2px solid #fff',
                        },
                      }}
                      onClick={() => handleMediaSelect(index)}
                    >
                      {media.type === 'video' ? (
                        <Box
                          component="video"
                          src={media.url}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          muted
                          playsInline
                        />
                      ) : (
                        <Box
                          component="img"
                          src={media.url}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                      {media.type === 'video' && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            bgcolor: 'rgba(0,0,0,0.4)',
                            borderRadius: '50%',
                            p: 0.5,
                          }}
                        >
                          <PlayIcon sx={{ fontSize: 20 }} />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
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
            Haz clic para añadir imágenes o videos
          </Box>
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
            Gestionar galería de medios
          </Typography>

          <Stack spacing={2}>
            <Box sx={{ height: 200 }}>
              <FileUploader
                onFileAccepted={handleFileAccepted}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg'],
                  'video/*': ['.mp4', '.webm', '.ogg'],
                }}
                maxSize={52428800} // 50MB
                title="Arrastra imágenes o videos aquí, o haz clic para seleccionar"
                icon={<EditIcon />}
              />
            </Box>

            {hasMedia && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {data.media.map((media) => (
                  <Box
                    key={media.id}
                    sx={{
                      position: 'relative',
                      width: 120,
                      height: 67.5, // 16:9 aspect ratio
                    }}
                  >
                    {media.type === 'video' ? (
                      <Box
                        component="video"
                        src={media.url}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={media.url}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteMedia(media.id)}
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

export default GalleryElement; 