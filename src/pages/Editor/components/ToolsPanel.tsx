import React from 'react';
import { Stack, IconButton, Tooltip, Divider } from '@mui/material';
import {
  SmartButton as ButtonIcon,
  ViewCarousel as CarouselIcon,
  QuestionAnswer as TriviaIcon,
  QrCode as QrIcon,
  List as ChoiceIcon,
  Collections as GalleryIcon,
  Download as ExportIcon,
} from '@mui/icons-material';
import { useEditorStore } from '../../../stores/editorStore';
import type { ElementType } from '../../../stores/editorStore';
import VideoUploader from '../../../components/common/VideoUploader';
import { generateVastXml } from '../../../services/vastExporter';

const tools: { type: Exclude<ElementType, 'video'>; icon: React.ComponentType; tooltip: string }[] = [
  { type: 'button', icon: ButtonIcon, tooltip: 'Añadir Botón' },
  { type: 'carousel', icon: CarouselIcon, tooltip: 'Añadir Carousel' },
  { type: 'gallery', icon: GalleryIcon, tooltip: 'Añadir Galería' },
  { type: 'trivia', icon: TriviaIcon, tooltip: 'Añadir Trivia' },
  { type: 'qr', icon: QrIcon, tooltip: 'Añadir Código QR' },
  { type: 'choice', icon: ChoiceIcon, tooltip: 'Añadir Choice' },
];

const defaultContent = {
  button: {
    image: '',
    url: '',
    style: {
      scale: 1,
      position: { x: 50, y: 50 },
    },
  },
  carousel: {
    images: [],
    style: {
      scale: 1,
      position: { x: 50, y: 50 },
    },
  },
  gallery: {
    media: [],
    currentIndex: 0,
    style: {
      scale: 1,
      position: { x: 50, y: 50 },
    },
  },
  trivia: {
    questionImage: '',
    options: [],
    layout: 'horizontal',
    feedbackImages: {
      correct: '',
      incorrect: '',
    },
    style: {
      scale: 1,
      backgroundColor: '#2196f3',
      selectedColor: '#64b5f6',
      correctColor: '#4caf50',
      incorrectColor: '#f44336',
    },
    selectedOption: null,
    showResult: false,
  },
  qr: {
    url: '',
    type: 'web'
  },
  choice: {
    options: [],
    redirectUrl: '',
    selectedOption: null,
  },
} as const;

const ToolsPanel: React.FC = () => {
  const addElement = useEditorStore((state) => state.addElement);
  const editorState = useEditorStore((state) => ({
    elements: state.elements,
    background: state.background,
    timeline: state.timeline
  }));

  const handleAddElement = (type: Exclude<ElementType, 'video'>) => {
    addElement(type, defaultContent[type]);
  };

  const handleExportVast = async () => {
    try {
      // Obtener el archivo de video del background
      const backgroundUrl = editorState.background?.url;
      if (!backgroundUrl) {
        console.error('No hay video de fondo');
        return;
      }

      console.log('URL del video:', backgroundUrl);

      // Convertir la URL blob a File
      const response = await fetch(backgroundUrl);
      const blob = await response.blob();
      
      // Validar el tamaño del blob
      if (blob.size < 1000000) { // Menos de 1MB
        console.error('El archivo es demasiado pequeño:', {
          size: blob.size,
          type: blob.type
        });
        throw new Error('El archivo de video es demasiado pequeño. Debe ser al menos 1MB.');
      }

      console.log('Blob obtenido:', {
        size: blob.size,
        type: blob.type,
        lastModified: new Date().getTime()
      });
      
      // Asegurar que el tipo MIME sea video/mp4 y preservar el blob original
      const file = new File([blob], 'background-video.mp4', { 
        type: 'video/mp4',
        lastModified: new Date().getTime()
      });
      
      console.log('Archivo creado:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });

      // Validar el tamaño del archivo
      if (file.size !== blob.size) {
        console.error('El tamaño del archivo no coincide con el blob:', {
          blobSize: blob.size,
          fileSize: file.size
        });
        throw new Error('Error al procesar el archivo de video.');
      }

      // Subir el archivo a B2 con FormData
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('FormData creado, iniciando subida a B2...');
      try {
        const response2 = await fetch('https://assets-service-hm83.onrender.com/api/assets/upload', {
          method: 'POST',
          body: formData,
        });
        
        console.log('Respuesta del servidor:', {
          status: response2.status,
          statusText: response2.statusText,
          headers: Object.fromEntries(response2.headers.entries())
        });

        const responseText = await response2.text();
        console.log('Respuesta completa:', responseText);

        if (!response2.ok) {
          let errorMessage = 'Error al subir el archivo a B2';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('Error al parsear la respuesta:', e);
          }
          throw new Error(errorMessage);
        }

        const data = JSON.parse(responseText);
        const b2Url = data.url;
        console.log('Video subido a B2:', b2Url);

        if (!b2Url) {
          throw new Error('No se recibió la URL del video subido');
        }

        // Verificar que la URL sea accesible
        const videoCheck = await fetch(b2Url, { method: 'HEAD' });
        if (!videoCheck.ok) {
          throw new Error('El video subido no es accesible');
        }

        console.log('Video verificado:', {
          url: b2Url,
          status: videoCheck.status,
          contentType: videoCheck.headers.get('content-type'),
          contentLength: videoCheck.headers.get('content-length')
        });

        // Crear una copia del estado del editor con las URLs de B2
        const editorStateWithB2 = {
          ...editorState,
          background: editorState.background ? {
            ...editorState.background,
            url: b2Url,
            type: 'video' as const  // Aseguramos que el tipo sea literal 'video'
          } : null,
          elements: editorState.elements.map(el => ({
            ...el,
            content: el.type === 'video' ? {
              ...el.content,
              src: b2Url
            } : el.content
          }))
        };

        const options = {
          baseUrl: window.location.origin,
          impressionUrl: `${window.location.origin}/track/impression`,
          clickTrackingUrl: `${window.location.origin}/track/click`,
          startTrackingUrl: `${window.location.origin}/track/start`,
          completeTrackingUrl: `${window.location.origin}/track/complete`,
          skipTrackingUrl: `${window.location.origin}/track/skip`,
          interactionTrackingUrl: `${window.location.origin}/track/interaction`,
          viewableImpressionUrl: `${window.location.origin}/track/viewable`,
          quartileTrackingUrls: {
            firstQuartile: `${window.location.origin}/track/firstQuartile`,
            midpoint: `${window.location.origin}/track/midpoint`,
            thirdQuartile: `${window.location.origin}/track/thirdQuartile`,
          },
          videoFormats: [
            {
              url: b2Url,
              codec: 'H.264' as const,
              bitrate: 2000,
              width: 1920,
              height: 1080,
              delivery: 'progressive' as const
            }
          ],
          fallbackVideoUrl: b2Url,
          platform: 'roku' as const,
          isB2Url: true
        };

        const vastXml = generateVastXml(editorStateWithB2, options);
        const xmlBlob = new Blob([vastXml], { type: 'application/xml' });
        const url = URL.createObjectURL(xmlBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adsmood-vast-${Date.now()}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al exportar VAST:', error);
        alert('Error al exportar el VAST. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error al exportar VAST:', error);
      alert('Error al exportar el VAST. Por favor, intenta de nuevo.');
    }
  };

  return (
    <Stack spacing={1}>
      <VideoUploader />
      {tools.map(({ type, icon: Icon, tooltip }) => (
        <Tooltip key={type} title={tooltip} placement="right">
          <IconButton
            onClick={() => handleAddElement(type)}
            sx={{
              width: '44px',
              height: '44px',
            }}
          >
            <Icon />
          </IconButton>
        </Tooltip>
      ))}
      <Divider sx={{ my: 1 }} />
      <Tooltip title="Exportar VAST" placement="right">
        <IconButton
          onClick={handleExportVast}
          sx={{
            width: '44px',
            height: '44px',
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <ExportIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default ToolsPanel; 