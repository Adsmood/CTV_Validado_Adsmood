import type { Element } from '../stores/editorStore';

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  thumbnail: string;
  videoRefs?: { [key: string]: string };
  data: {
    elements: Element[];
    background: {
      url: string;
      type: 'image' | 'video';
      style: {
        scale: number;
        position: { x: number; y: number };
      };
    } | null;
    timeline: {
      currentTime: number;
      isPlaying: boolean;
      duration: number;
    };
  };
} 