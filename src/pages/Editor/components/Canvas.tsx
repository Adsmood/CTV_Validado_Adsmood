import React from 'react';
import { Box } from '@mui/material';
import { useEditorStore } from '../../../stores/editorStore';
import VideoElement from './elements/VideoElement';
import ButtonElement from './elements/ButtonElement';
import CarouselElement from './elements/CarouselElement';
import GalleryElement from './elements/GalleryElement';
import TriviaElement from './elements/TriviaElement';
import QRElement from './elements/QRElement';
import ChoiceElement from './elements/ChoiceElement';
import BackgroundUploader from '../../../components/common/BackgroundUploader';
import ResizableElement from '../../../components/common/ResizableElement';

const elementComponents = {
  video: VideoElement,
  button: ButtonElement,
  carousel: CarouselElement,
  gallery: GalleryElement,
  trivia: TriviaElement,
  qr: QRElement,
  choice: ChoiceElement,
} as const;

const Canvas: React.FC = () => {
  const { elements, background, selectedElement, updateElement } = useEditorStore();

  const handleResize = (id: string) => (width: number, height: number) => {
    updateElement(id, {
      size: { width, height },
    });
  };

  const handleDrag = (id: string) => (x: number, y: number) => {
    updateElement(id, {
      position: { x, y },
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {background && (
        <Box
          component={background.type === 'video' ? 'video' : 'img'}
          src={background.url}
          autoPlay={background.type === 'video'}
          loop={background.type === 'video'}
          muted={background.type === 'video'}
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${background.style.scale}) translate(${background.style.position.x - 50}%, ${background.style.position.y - 50}%)`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-out',
          }}
        />
      )}
      <BackgroundUploader />
      
      {elements
        .filter((element) => element.isVisible)
        .map((element) => {
          const Component = elementComponents[element.type as keyof typeof elementComponents];
          if (!Component) return null;

          return (
            <ResizableElement
              key={element.id}
              width={element.size.width}
              height={element.size.height}
              x={element.position.x}
              y={element.position.y}
              onResize={handleResize(element.id)}
              onDrag={handleDrag(element.id)}
              isSelected={selectedElement === element.id}
              aspectRatio={element.type === 'video' ? 16/9 : undefined}
            >
              <Component
                data={element.content}
                isSelected={selectedElement === element.id}
                elementId={element.id}
              />
            </ResizableElement>
          );
        })}
    </Box>
  );
};

export default Canvas; 