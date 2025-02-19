import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface ResizableElementProps {
  children: React.ReactNode;
  width: number;
  height: number;
  x: number;
  y: number;
  onResize: (width: number, height: number) => void;
  onDrag: (x: number, y: number) => void;
  isSelected: boolean;
  aspectRatio?: number;
}

const ResizableElement: React.FC<ResizableElementProps> = ({
  children,
  width,
  height,
  x,
  y,
  onResize,
  onDrag,
  isSelected,
  aspectRatio,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x, y });

  useEffect(() => {
    currentPos.current = { x, y };
  }, [x, y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!elementRef.current) return;
    
    isDragging.current = true;
    startPos.current = {
      x: e.clientX - currentPos.current.x,
      y: e.clientY - currentPos.current.y,
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const newX = e.clientX - startPos.current.x;
      const newY = e.clientY - startPos.current.y;

      currentPos.current = { x: newX, y: newY };
      onDrag(newX, newY);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (corner.includes('e')) {
        newWidth = startWidth + deltaX;
      } else if (corner.includes('w')) {
        newWidth = startWidth - deltaX;
      }

      if (corner.includes('s')) {
        newHeight = startHeight + deltaY;
      } else if (corner.includes('n')) {
        newHeight = startHeight - deltaY;
      }

      if (aspectRatio) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }

      onResize(Math.max(50, newWidth), Math.max(50, newHeight));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Box
      ref={elementRef}
      onMouseDown={handleMouseDown}
      sx={{
        position: 'absolute',
        width,
        height,
        transform: `translate(${x}px, ${y}px)`,
        cursor: 'move',
        userSelect: 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {children}

        {isSelected && (
          <>
            {['nw', 'ne', 'sw', 'se'].map((corner) => (
              <Box
                key={corner}
                onMouseDown={(e) => handleResizeStart(e, corner)}
                sx={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  backgroundColor: 'primary.main',
                  borderRadius: '50%',
                  cursor: `${corner}-resize`,
                  ...(corner.includes('n') ? { top: -5 } : { bottom: -5 }),
                  ...(corner.includes('w') ? { left: -5 } : { right: -5 }),
                  zIndex: 1,
                }}
              />
            ))}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ResizableElement; 