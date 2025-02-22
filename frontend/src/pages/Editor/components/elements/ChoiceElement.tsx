import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Dialog,
  Stack,
  Typography,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '../../../../stores/editorStore';
import FileUploader from '../../../../components/common/FileUploader';

interface ChoiceOption {
  id: string;
  imageUrl: string;
  videoUrl?: string;
  redirectUrl?: string;
}

interface ChoiceElementProps {
  data: {
    options: ChoiceOption[];
    selectedOption?: string | null;
  };
  isSelected: boolean;
  elementId?: string;
}

const ChoiceElement: React.FC<ChoiceElementProps> = ({ data, isSelected, elementId }) => {
  const [open, setOpen] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number>(-1);
  const updateElement = useEditorStore((state) => state.updateElement);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected || !data.options.length) return;

      switch (e.key) {
        case 'ArrowLeft':
          handleOptionSelect(data.options[0].id);
          e.preventDefault();
          break;
        case 'ArrowRight':
          handleOptionSelect(data.options[1]?.id);
          e.preventDefault();
          break;
        case 'Enter':
          if (data.selectedOption) {
            const selectedOption = data.options.find(opt => opt.id === data.selectedOption);
            if (selectedOption?.redirectUrl) {
              window.open(selectedOption.redirectUrl, '_blank');
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, data.options, data.selectedOption]);

  const handleOptionImageUpload = async (file: File) => {
    try {
      const imageUrl = URL.createObjectURL(file);
      const newOption: ChoiceOption = {
        id: Math.random().toString(36).substr(2, 9),
        imageUrl,
        videoUrl: '',
      };

      if (elementId) {
        updateElement(elementId, {
          content: {
            ...data,
            options: [...(data.options || []), newOption],
          },
        });
      }
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
    }
  };

  const handleOptionVideoUpload = async (file: File, optionId: string) => {
    try {
      const videoUrl = URL.createObjectURL(file);
      if (elementId) {
        updateElement(elementId, {
          content: {
            ...data,
            options: data.options.map(opt => 
              opt.id === optionId 
                ? { ...opt, videoUrl }
                : opt
            ),
          },
        });
      }
    } catch (error) {
      console.error('Error al procesar el video:', error);
    }
  };

  const handleDeleteOption = (optionId: string) => {
    if (!elementId) return;
    updateElement(elementId, {
      content: {
        ...data,
        options: data.options.filter(opt => opt.id !== optionId),
        selectedOption: data.selectedOption === optionId ? null : data.selectedOption,
      },
    });
  };

  const handleOptionSelect = (optionId: string) => {
    if (!elementId) return;
    const option = data.options.find(opt => opt.id === optionId);
    
    if (option?.redirectUrl) {
      window.open(option.redirectUrl, '_blank');
      return;
    }
    
    if (option?.videoUrl) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html style="margin:0;padding:0;height:100%;overflow:hidden">
            <head>
              <title>Video</title>
              <style>
                body { 
                  margin:0;
                  padding:0;
                  height:100vh;
                  width:100vw;
                  background:#000;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  overflow:hidden;
                }
                .video-container {
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  position: relative;
                }
                video { 
                  width: 1920px;
                  height: 1080px;
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                  background: #000;
                }
                .loading {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  color: white;
                  font-family: Arial, sans-serif;
                }
                .unmute-message {
                  position: fixed;
                  bottom: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                  color: white;
                  font-family: Arial, sans-serif;
                  background: rgba(0,0,0,0.7);
                  padding: 10px 20px;
                  border-radius: 20px;
                  cursor: pointer;
                  z-index: 1000;
                }
              </style>
            </head>
            <body>
              <div class="video-container">
                <div class="loading">Iniciando video...</div>
                <video 
                  src="${option.videoUrl}" 
                  autoplay 
                  playsinline
                  muted
                  preload="auto"
                  onended="window.close()"
                ></video>
                <div class="unmute-message">Click para activar el sonido</div>
              </div>
              <script>
                (async () => {
                  const video = document.querySelector('video');
                  const loading = document.querySelector('.loading');
                  const unmuteMessage = document.querySelector('.unmute-message');

                  async function enterFullscreen() {
                    try {
                      if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                      } else if (document.documentElement.webkitRequestFullscreen) {
                        await document.documentElement.webkitRequestFullscreen();
                      } else if (document.documentElement.msRequestFullscreen) {
                        await document.documentElement.msRequestFullscreen();
                      }
                    } catch (e) {
                      console.log('Error al entrar en fullscreen:', e);
                    }
                  }

                  async function playVideo() {
                    try {
                      await video.play();
                      loading.style.display = 'none';
                      await enterFullscreen();
                    } catch (error) {
                      console.log('Error en reproducción:', error);
                      loading.textContent = 'Error al reproducir el video';
                    }
                  }

                  video.addEventListener('loadedmetadata', () => {
                    loading.textContent = 'Video listo - Iniciando...';
                    playVideo();
                  });

                  video.addEventListener('playing', () => {
                    loading.style.display = 'none';
                  });

                  unmuteMessage.addEventListener('click', () => {
                    video.muted = false;
                    unmuteMessage.style.display = 'none';
                  });

                  if (video.readyState >= 3) {
                    playVideo();
                  }
                })();
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <Box
      tabIndex={isSelected ? 0 : -1}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'transparent',
        borderRadius: 2,
        p: 2,
      }}
    >
      {data.selectedOption ? (
        <Box
          component="video"
          src={data.options.find(opt => opt.id === data.selectedOption)?.videoUrl}
          autoPlay
          playsInline
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
          onEnded={() => {
            if (elementId) {
              updateElement(elementId, {
                content: {
                  ...data,
                  selectedOption: null,
                },
              });
            }
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
          }}
        >
          <AnimatePresence>
            {data.options.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  onClick={() => handleOptionSelect(option.id)}
                  onFocus={() => setFocusedOptionIndex(index)}
                  onBlur={() => setFocusedOptionIndex(-1)}
                  tabIndex={isSelected ? 0 : -1}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    bgcolor: 'transparent',
                    '&:hover': {
                      transform: isSelected ? 'scale(1.02)' : 'none',
                      bgcolor: 'transparent',
                    },
                    outline: focusedOptionIndex === index ? '2px solid #fff' : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {option.imageUrl ? (
                    <Box
                      component="img"
                      src={option.imageUrl}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">
                      Opción {index + 1}
                    </Typography>
                  )}
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}

      {isSelected && (
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            bgcolor: 'transparent',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
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
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Configurar Choice
          </Typography>

          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Imágenes de opciones ({data.options.length}/2)
              </Typography>
              {data.options.length < 2 && (
                <Box sx={{ height: 200 }}>
                  <FileUploader
                    onFileAccepted={handleOptionImageUpload}
                    accept={{
                      'image/*': ['.png', '.jpg', '.jpeg'],
                    }}
                    maxSize={10485760} // 10MB
                    title="Arrastra una imagen aquí"
                    icon={<EditIcon />}
                  />
                </Box>
              )}

              <Stack spacing={1} sx={{ mt: 2 }}>
                {data.options.map((option) => (
                  <Box
                    key={option.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      p: 1,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        component="img"
                        src={option.imageUrl}
                        sx={{
                          width: 120,
                          height: 120,
                          objectFit: 'contain',
                          borderRadius: 1,
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteOption(option.id)}
                        sx={{ ml: 'auto' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    <Stack spacing={1}>
                      <Box sx={{ height: 100 }}>
                        <FileUploader
                          onFileAccepted={(file) => handleOptionVideoUpload(file, option.id)}
                          accept={{
                            'video/*': ['.mp4', '.webm', '.ogg'],
                          }}
                          maxSize={52428800} // 50MB
                          title={option.videoUrl ? "Video cargado - Click para cambiar" : "Arrastra el video para esta opción"}
                          icon={<EditIcon />}
                        />
                      </Box>

                      <TextField
                        fullWidth
                        size="small"
                        label="URL de redirección"
                        placeholder="https://ejemplo.com"
                        value={option.redirectUrl || ''}
                        onChange={(e) => {
                          if (elementId) {
                            updateElement(elementId, {
                              content: {
                                ...data,
                                options: data.options.map(opt => 
                                  opt.id === option.id 
                                    ? { ...opt, redirectUrl: e.target.value }
                                    : opt
                                ),
                              },
                            });
                          }
                        }}
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ChoiceElement; 