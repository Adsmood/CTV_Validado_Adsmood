import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ListIcon from '@mui/icons-material/List';
import CollectionsIcon from '@mui/icons-material/Collections';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEditorStore } from '../../../stores/editorStore';
import type { ElementType } from '../../../stores/editorStore';
import ElementControls from './ElementControls';

const elementIcons: Record<ElementType, React.ComponentType> = {
  video: VideoCallIcon,
  button: SmartButtonIcon,
  carousel: ViewCarouselIcon,
  gallery: CollectionsIcon,
  trivia: QuestionAnswerIcon,
  qr: QrCodeIcon,
  choice: ListIcon,
};

const LayersPanel: React.FC = () => {
  const { elements, selectedElement, setSelectedElement, removeElement, setElementVisibility } =
    useEditorStore();

  const handleLayerClick = (id: string) => {
    setSelectedElement(id);
  };

  const handleDeleteElement = (id: string) => {
    removeElement(id);
  };

  const handleVisibilityToggle = (id: string, isVisible: boolean) => {
    setElementVisibility(id, !isVisible);
  };

  return (
    <Box className="layers-panel">
      <List>
        {[...elements]
          .sort((a, b) => b.zIndex - a.zIndex)
          .map((element) => {
            const Icon = elementIcons[element.type];
            return (
              <ListItem
                key={element.id}
                disablePadding
                secondaryAction={
                  <>
                    <IconButton
                      edge="end"
                      onClick={() => handleVisibilityToggle(element.id, element.isVisible)}
                      sx={{ mr: 1 }}
                    >
                      {element.isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteElement(element.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemButton
                  selected={selectedElement === element.id}
                  onClick={() => handleLayerClick(element.id)}
                >
                  <ListItemIcon>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${element.type.charAt(0).toUpperCase()}${element.type.slice(
                      1
                    )} ${element.id.slice(0, 4)}`}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>

      {selectedElement && (
        <>
          <Divider sx={{ my: 2 }} />
          <ElementControls />
        </>
      )}
    </Box>
  );
};

export default LayersPanel; 