import React, { useState, useEffect } from 'react';
import { Box, IconButton, Dialog, TextField, Stack, Typography, Select, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import QRCode from 'qrcode';
import { useEditorStore } from '../../../../stores/editorStore';

interface QRElementProps {
  data: {
    url?: string;
    type?: 'web' | 'app' | 'market' | 'offer' | 'ar';
    arService?: 'google' | 'spark' | '8thwall';
  };
  isSelected: boolean;
  elementId?: string;
}

const QRElement: React.FC<QRElementProps> = ({ data, isSelected, elementId }) => {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const updateElement = useEditorStore((state) => state.updateElement);

  useEffect(() => {
    generateQR();
  }, [data?.url]);

  const generateQR = async () => {
    try {
      if (!data?.url) {
        setQrDataUrl('');
        return;
      }

      const url = await QRCode.toDataURL(data.url, {
        width: 1024,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Error generando QR:', err);
      setQrDataUrl('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!elementId) return;
    const newData = {
      ...data,
      url: e.target.value,
    };
    updateElement(elementId, { content: newData });
  };

  const handleTypeChange = (value: 'web' | 'app' | 'market' | 'offer' | 'ar') => {
    if (!elementId) return;
    const newData = {
      ...data,
      type: value,
      arService: value === 'ar' ? 'google' : undefined,
    };
    updateElement(elementId, { content: newData });
  };

  const handleArServiceChange = (value: 'google' | 'spark' | '8thwall') => {
    if (!elementId) return;
    const newData = {
      ...data,
      arService: value,
    };
    updateElement(elementId, { content: newData });
  };

  return (
    <Box
      tabIndex={isSelected ? 0 : -1}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        outline: 'none',
        '&:focus': {
          outline: isSelected ? '2px solid #fff' : 'none',
        },
      }}
    >
      {qrDataUrl ? (
        <Box
          component="img"
          src={qrDataUrl}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
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
          Configura el código QR
        </Box>
      )}

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
            Configurar código QR
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="URL"
              value={data?.url || ''}
              onChange={handleUrlChange}
              placeholder="https://ejemplo.com"
              variant="outlined"
              size="small"
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Tipo de enlace
              </Typography>
              <Select
                fullWidth
                size="small"
                value={data?.type || 'web'}
                onChange={(e) => handleTypeChange(e.target.value as any)}
              >
                <MenuItem value="web">Sitio Web</MenuItem>
                <MenuItem value="app">Aplicación (Deep Link)</MenuItem>
                <MenuItem value="market">Tienda de Apps</MenuItem>
                <MenuItem value="offer">Oferta Especial</MenuItem>
                <MenuItem value="ar">Realidad Aumentada</MenuItem>
              </Select>
            </Box>

            {data?.type === 'ar' && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Servicio AR
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={data?.arService || 'google'}
                  onChange={(e) => handleArServiceChange(e.target.value as any)}
                >
                  <MenuItem value="google">Google Model Viewer</MenuItem>
                  <MenuItem value="spark">SparkAR</MenuItem>
                  <MenuItem value="8thwall">8th Wall</MenuItem>
                </Select>
              </Box>
            )}
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default QRElement; 