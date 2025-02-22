import React from 'react';
import { Box, Stack, Slider, Typography } from '@mui/material';
import { ZoomIn, CropFree } from '@mui/icons-material';
import { useEditorStore } from '../../../stores/editorStore';

const ElementControls: React.FC = () => {
  const { elements, selectedElement, updateElement } = useEditorStore();
  
  const selectedData = elements.find(el => el.id === selectedElement);
  
  if (!selectedData) return null;

  const content = selectedData.content || {};
  const hasPositionStyle = !['qr', 'trivia', 'choice'].includes(selectedData.type);
  const style = content.style || {};

  // Establecer valores por defecto según el tipo de elemento
  if (hasPositionStyle && !style.position) {
    style.position = { x: 50, y: 50 };
    style.scale = style.scale || 1;
  } else if (selectedData.type === 'qr') {
    style.size = style.size || 0.8;
  } else if (['trivia', 'choice'].includes(selectedData.type)) {
    style.scale = style.scale || 1;
    style.backgroundColor = style.backgroundColor || '#2196f3';
    style.selectedColor = style.selectedColor || '#64b5f6';
    if (selectedData.type === 'trivia') {
      style.correctColor = style.correctColor || '#4caf50';
      style.incorrectColor = style.incorrectColor || '#f44336';
    }
  }

  const handleStyleChange = (key: string, value: any) => {
    if (!selectedData) return;

    let newStyle;
    if (hasPositionStyle) {
      newStyle = {
        ...style,
        [key]: key === 'position' ? { ...style.position, ...value } : value,
      };
    } else {
      newStyle = {
        ...style,
        [key]: value,
      };
    }
    
    const newContent = {
      ...content,
      style: newStyle,
    };

    updateElement(selectedData.id, {
      content: newContent,
    });
  };

  if (selectedData.type === 'qr') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Ajustes del QR
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ZoomIn sx={{ mr: 1 }} />
              <Typography variant="body2">Tamaño</Typography>
            </Box>
            <Slider
              size="small"
              value={style.size}
              min={0.5}
              max={1}
              step={0.1}
              onChange={(_: Event, value: number | number[]) => 
                handleStyleChange('size', Array.isArray(value) ? value[0] : value)
              }
            />
          </Box>
        </Stack>
      </Box>
    );
  }

  if (selectedData.type === 'trivia') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Ajustes de la Trivia
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" gutterBottom>
              Colores
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption">Color de fondo</Typography>
                <input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  style={{ width: '100%', height: 32 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Color de selección</Typography>
                <input
                  type="color"
                  value={style.selectedColor}
                  onChange={(e) => handleStyleChange('selectedColor', e.target.value)}
                  style={{ width: '100%', height: 32 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Color de respuesta correcta</Typography>
                <input
                  type="color"
                  value={style.correctColor}
                  onChange={(e) => handleStyleChange('correctColor', e.target.value)}
                  style={{ width: '100%', height: 32 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Color de respuesta incorrecta</Typography>
                <input
                  type="color"
                  value={style.incorrectColor}
                  onChange={(e) => handleStyleChange('incorrectColor', e.target.value)}
                  style={{ width: '100%', height: 32 }}
                />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  }

  if (selectedData.type === 'choice') {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Ajustes del Choice
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" gutterBottom>
              Colores
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption">Color de fondo</Typography>
                <input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  style={{ width: '100%', height: 32 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Color de selección</Typography>
                <input
                  type="color"
                  value={style.selectedColor}
                  onChange={(e) => handleStyleChange('selectedColor', e.target.value)}
                  style={{ width: '100%', height: 32 }}
                />
              </Box>
              <Box>
                <Typography variant="caption">Color de opciones</Typography>
                <input
                  type="color"
                  value={style.optionColor}
                  onChange={(e) => handleStyleChange('optionColor', e.target.value)}
                  style={{ width: '100%', height: 32 }}
                />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Ajustes del elemento
      </Typography>
      
      <Stack spacing={2}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ZoomIn sx={{ mr: 1 }} />
            <Typography variant="body2">Escala</Typography>
          </Box>
          <Slider
            size="small"
            value={style.scale}
            min={0.1}
            max={2}
            step={0.1}
            onChange={(_: Event, value: number | number[]) => 
              handleStyleChange('scale', Array.isArray(value) ? value[0] : value)
            }
          />
        </Box>

        {hasPositionStyle && (
          <>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CropFree sx={{ mr: 1 }} />
                <Typography variant="body2">Posición X</Typography>
              </Box>
              <Slider
                size="small"
                value={style.position?.x || 50}
                min={0}
                max={100}
                onChange={(_: Event, value: number | number[]) =>
                  handleStyleChange('position', { x: Array.isArray(value) ? value[0] : value })
                }
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CropFree sx={{ mr: 1 }} />
                <Typography variant="body2">Posición Y</Typography>
              </Box>
              <Slider
                size="small"
                value={style.position?.y || 50}
                min={0}
                max={100}
                onChange={(_: Event, value: number | number[]) =>
                  handleStyleChange('position', { y: Array.isArray(value) ? value[0] : value })
                }
              />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default ElementControls; 