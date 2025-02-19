import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Project } from '../types/project';
import { useEditorStore } from './editorStore';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  saveProject: (name: string) => Promise<Project>;
  loadProject: (id: string) => Promise<void>;
  createThumbnail: () => Promise<string>;
  closeProject: () => void;
  initializeStore: () => void;
}

// Función para limpiar URLs de datos antes de guardar
const cleanDataUrls = (obj: any): any => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    // Solo limpiar blob URLs, mantener otras URLs
    if (obj.startsWith('blob:')) {
      return ''; 
    }
    // Mantener URLs de assets
    if (obj.startsWith('data:') || obj.startsWith('http') || obj.startsWith('/')) {
      return obj;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanDataUrls);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      cleaned[key] = cleanDataUrls(obj[key]);
    }
    return cleaned;
  }
  
  return obj;
};

const compressImage = async (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 200; // Reducido drásticamente
      const MAX_HEIGHT = 150; // Reducido drásticamente
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.3)); // Calidad reducida a 0.3
    };
    img.src = dataUrl;
  });
};

const processAssets = async (obj: any): Promise<any> => {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    if (obj.startsWith('blob:')) {
      try {
        const response = await fetch(obj);
        const blob = await response.blob();
        
        // Si es un video, mantener la URL original
        if (blob.type.startsWith('video/')) {
          return obj;
        }
        
        // Si es una imagen, comprimir
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            if (blob.type.startsWith('image/')) {
              const compressed = await compressImage(dataUrl);
              resolve(compressed);
            } else {
              resolve(dataUrl);
            }
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error procesando blob URL:', error);
        return obj; // Retornar la URL original en caso de error
      }
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(processAssets));
  }
  
  if (typeof obj === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      processed[key] = await processAssets(value);
    }
    return processed;
  }
  
  return obj;
};

const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        projects: [],
        currentProject: null,
        addProject: (project) => {
          try {
            set((state) => ({
              projects: [...state.projects, project],
            }));
            // Forzar guardado inmediato
            localStorage.setItem('project-storage', JSON.stringify({
              state: { ...get(), projects: [...get().projects] },
              version: 1
            }));
          } catch (error) {
            console.error('Error adding project:', error);
          }
        },
        updateProject: (id, project) => {
          try {
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === id ? { ...p, ...project } : p
              ),
              currentProject: state.currentProject?.id === id 
                ? { ...state.currentProject, ...project }
                : state.currentProject
            }));
            // Forzar guardado inmediato
            localStorage.setItem('project-storage', JSON.stringify({
              state: { ...get(), projects: [...get().projects] },
              version: 1
            }));
          } catch (error) {
            console.error('Error updating project:', error);
          }
        },
        deleteProject: (id) => {
          try {
            set((state) => ({
              projects: state.projects.filter((p) => p.id !== id),
              currentProject: state.currentProject?.id === id ? null : state.currentProject
            }));
            // Forzar guardado inmediato
            localStorage.setItem('project-storage', JSON.stringify({
              state: { ...get(), projects: [...get().projects] },
              version: 1
            }));
          } catch (error) {
            console.error('Error deleting project:', error);
          }
        },
        setCurrentProject: (project) => {
          try {
            set({ currentProject: project });
            // Forzar guardado inmediato
            localStorage.setItem('project-storage', JSON.stringify({
              state: { ...get(), currentProject: project },
              version: 1
            }));
          } catch (error) {
            console.error('Error setting current project:', error);
          }
        },
        saveProject: async (name) => {
          try {
            console.log('Iniciando saveProject con nombre:', name);
            const editorState = useEditorStore.getState();
            
            if (!editorState.elements.length && !editorState.background) {
              console.error('No hay elementos ni fondo para guardar');
              throw new Error('No hay elementos ni fondo para guardar');
            }

            console.log('Creando thumbnail...');
            const thumbnail = await get().createThumbnail();
            console.log('Thumbnail creado');
            
            console.log('Procesando elementos y fondo...');
            const processedElements = await processAssets(editorState.elements);
            const processedBackground = await processAssets(editorState.background);
            console.log('Elementos y fondo procesados');
            
            // Crear referencias a los videos
            const videoRefs: { [key: string]: string } = {};
            
            // Función para extraer y guardar referencias de videos
            const extractVideoRefs = (obj: any) => {
              if (!obj) return;
              
              if (typeof obj === 'string' && obj.startsWith('blob:')) {
                videoRefs[obj] = obj;
              } else if (Array.isArray(obj)) {
                obj.forEach(extractVideoRefs);
              } else if (typeof obj === 'object') {
                Object.values(obj).forEach(extractVideoRefs);
              }
            };
            
            // Extraer referencias de videos
            extractVideoRefs(processedElements);
            extractVideoRefs(processedBackground);
            
            const project = {
              id: get().currentProject?.id || `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name,
              lastModified: Date.now(),
              thumbnail,
              data: {
                elements: processedElements,
                background: processedBackground,
                timeline: editorState.timeline,
              },
              videoRefs,
            };

            // Intentar guardar manteniendo los últimos proyectos
            try {
              // Obtener los proyectos existentes
              const currentProjects = get().projects;
              
              // Si el proyecto ya existe, actualizarlo
              const existingProjectIndex = currentProjects.findIndex(p => p.id === project.id);
              let updatedProjects;
              
              if (existingProjectIndex !== -1) {
                // Actualizar proyecto existente
                updatedProjects = [
                  ...currentProjects.slice(0, existingProjectIndex),
                  project,
                  ...currentProjects.slice(existingProjectIndex + 1)
                ];
              } else {
                // Añadir nuevo proyecto, manteniendo solo los últimos 5
                updatedProjects = [...currentProjects, project].slice(-5);
              }

              // Intentar guardar
              try {
                const storageData = {
                  state: { 
                    projects: updatedProjects,
                    currentProject: project
                  },
                  version: 1
                };

                localStorage.setItem('project-storage', JSON.stringify(storageData));
                set({ projects: updatedProjects, currentProject: project });
                console.log('Proyecto guardado exitosamente');
                return project;
              } catch (storageError) {
                // Si falla por espacio, intentar con menos proyectos
                console.warn('Error al guardar todos los proyectos, intentando con menos');
                
                // Intentar guardar solo los últimos 3 proyectos
                const reducedProjects = updatedProjects.slice(-3);
                const reducedStorageData = {
                  state: { 
                    projects: reducedProjects,
                    currentProject: project
                  },
                  version: 1
                };

                try {
                  localStorage.setItem('project-storage', JSON.stringify(reducedStorageData));
                  set({ projects: reducedProjects, currentProject: project });
                  console.log('Proyecto guardado exitosamente (con proyectos reducidos)');
                  return project;
                } catch (finalError) {
                  // Si aún falla, guardar solo el proyecto actual
                  const finalStorageData = {
                    state: { 
                      projects: [project],
                      currentProject: project
                    },
                    version: 1
                  };
                  
                  localStorage.setItem('project-storage', JSON.stringify(finalStorageData));
                  set({ projects: [project], currentProject: project });
                  console.log('Proyecto guardado exitosamente (solo proyecto actual)');
                  return project;
                }
              }
            } catch (error) {
              console.error('Error al guardar en storage:', error);
              throw new Error('No hay suficiente espacio para guardar el proyecto. Intenta eliminar algunos elementos o reducir el tamaño de las imágenes.');
            }
          } catch (error) {
            console.error('Error detallado al guardar el proyecto:', error);
            throw error;
          }
        },
        loadProject: async (id) => {
          try {
            const project = get().projects.find(p => p.id === id);
            if (!project) throw new Error('Proyecto no encontrado');

            const editorStore = useEditorStore.getState();
            
            // Aseguramos que los elementos y el fondo sean objetos válidos
            const elements = Array.isArray(project.data.elements) ? project.data.elements : [];
            const background = project.data.background || null;
            const timeline = project.data.timeline || {
              currentTime: 0,
              isPlaying: false,
              duration: 30,
            };

            // Restaurar las referencias a los videos
            if (project.videoRefs) {
              Object.entries(project.videoRefs).forEach(([key, value]) => {
                // Si la URL del video aún existe, usarla
                try {
                  fetch(value as string).catch(err => 
                    console.warn(`Video reference ${key} no longer available:`, err)
                  );
                } catch (error) {
                  console.warn(`Video reference ${key} no longer available`);
                }
              });
            }

            editorStore.setElements(elements);
            editorStore.setBackground(background);
            editorStore.updateTimeline(timeline);
            
            set({ currentProject: project });
          } catch (error) {
            console.error('Error al cargar el proyecto:', error);
            throw error;
          }
        },
        createThumbnail: async () => {
          try {
            const html2canvas = (await import('html2canvas')).default;
            
            // Esperar a que el DOM se actualice
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const canvas = document.querySelector('#canvas-container');
            if (!canvas) {
              console.warn('Canvas container no encontrado, intentando de nuevo...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              const retryCanvas = document.querySelector('#canvas-container');
              if (!retryCanvas) {
                console.error('Canvas container no encontrado después del reintento');
                // Retornar una miniatura en blanco en lugar de cadena vacía
                const blankCanvas = document.createElement('canvas');
                blankCanvas.width = 200;
                blankCanvas.height = 150;
                const ctx = blankCanvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#000000';
                  ctx.fillRect(0, 0, 200, 150);
                }
                return blankCanvas.toDataURL('image/jpeg', 0.3);
              }
              
              const thumbnail = await html2canvas(retryCanvas as HTMLElement, {
                width: 200,
                height: 150,
                background: '#000000',
                logging: false,
                useCORS: true,
                allowTaint: true,
                // @ts-ignore
                onclone: (doc: Document) => {
                  const controls = doc.querySelector('.controls-overlay');
                  if (controls) controls.remove();
                }
              });
              
              return thumbnail.toDataURL('image/jpeg', 0.3);
            }

            const thumbnail = await html2canvas(canvas as HTMLElement, {
              width: 200,
              height: 150,
              background: '#000000',
              logging: false,
              useCORS: true,
              allowTaint: true,
              // @ts-ignore
              onclone: (doc: Document) => {
                const controls = doc.querySelector('.controls-overlay');
                if (controls) controls.remove();
              }
            });
            
            return thumbnail.toDataURL('image/jpeg', 0.3);
          } catch (error) {
            console.error('Error al crear thumbnail:', error);
            // Retornar una miniatura en blanco en caso de error
            const blankCanvas = document.createElement('canvas');
            blankCanvas.width = 200;
            blankCanvas.height = 150;
            const ctx = blankCanvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, 200, 150);
            }
            return blankCanvas.toDataURL('image/jpeg', 0.3);
          }
        },
        closeProject: () => {
          const editorStore = useEditorStore.getState();
          
          editorStore.setElements([]);
          editorStore.setBackground(null);
          editorStore.updateTimeline({
            currentTime: 0,
            isPlaying: false,
            duration: 30,
          });
          editorStore.setSelectedElement(null);
          
          set({ currentProject: null });
        },
        initializeStore: () => {
          try {
            const savedData = localStorage.getItem('project-storage');
            if (savedData) {
              const { state } = JSON.parse(savedData);
              if (state?.projects?.length > 0) {
                // Limpiar los datos al cargar
                const cleanedProjects = state.projects.map((project: Project) => ({
                  ...project,
                  data: {
                    ...project.data,
                    elements: cleanDataUrls(project.data.elements),
                    background: cleanDataUrls(project.data.background),
                  }
                }));
                set({ 
                  projects: cleanedProjects,
                  currentProject: state.currentProject ? {
                    ...state.currentProject,
                    data: {
                      ...state.currentProject.data,
                      elements: cleanDataUrls(state.currentProject.data.elements),
                      background: cleanDataUrls(state.currentProject.data.background),
                    }
                  } : null
                });
                console.log('Estado cargado:', cleanedProjects.length, 'proyectos');
              }
            }
          } catch (error) {
            console.error('Error initializing store:', error);
            // En caso de error, limpiar el estado
            set({ projects: [], currentProject: null });
          }
        }
      }),
      {
        name: 'project-storage',
        version: 1,
        onRehydrateStorage: () => (state) => {
          if (state) {
            console.log('Estado hidratado:', state.projects.length, 'proyectos');
          }
        },
      }
    )
  )
);

export default useProjectStore;

// Inicializar el store cuando el módulo se carga
if (typeof window !== 'undefined') {
  useProjectStore.getState().initializeStore();
} 