import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'video' | 'button' | 'carousel' | 'gallery' | 'trivia' | 'qr' | 'choice';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

interface Background {
  url: string;
  type: 'image' | 'video';
  style: {
    scale: number;
    position: { x: number; y: number };
  };
}

export interface Element {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  content: any;
  zIndex: number;
  isVisible: boolean;
}

export interface EditorState {
  elements: Element[];
  selectedElement: string | null;
  background: Background | null;
  timeline: {
    currentTime: number;
    isPlaying: boolean;
    duration: number;
  };
  addElement: (type: ElementType, content: any) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  setSelectedElement: (id: string | null) => void;
  setBackground: (background: Background | null) => void;
  moveElement: (id: string, position: Position) => void;
  resizeElement: (id: string, size: Size) => void;
  setElementVisibility: (id: string, isVisible: boolean) => void;
  updateTimeline: (updates: Partial<EditorState['timeline']>) => void;
  setElements: (elements: Element[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  elements: [],
  selectedElement: null,
  background: null,
  timeline: {
    currentTime: 0,
    isPlaying: false,
    duration: 30,
  },

  addElement: (type, content) =>
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id: uuidv4(),
          type,
          position: { x: 0, y: 0 },
          size: { width: 200, height: 100 },
          content,
          zIndex: state.elements.length,
          isVisible: true,
        },
      ],
    })),

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElement: state.selectedElement === id ? null : state.selectedElement,
    })),

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })),

  setSelectedElement: (id) =>
    set({
      selectedElement: id,
    }),

  setBackground: (background) =>
    set({
      background,
    }),

  moveElement: (id, position) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, position } : el
      ),
    })),

  resizeElement: (id, size) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, size } : el
      ),
    })),

  setElementVisibility: (id, isVisible) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, isVisible } : el
      ),
    })),

  updateTimeline: (updates) =>
    set((state) => ({
      timeline: {
        ...state.timeline,
        ...updates,
      },
    })),

  setElements: (elements) => set({ elements }),
})); 