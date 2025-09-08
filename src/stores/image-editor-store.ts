import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ImageProject, ImageLayer, ImageHistoryStep, ImageFilter } from '@/types';
import { AuditService } from '@/services/audit';
import { v4 as uuidv4 } from 'uuid';

interface ImageEditorState {
  currentProject: ImageProject | null;
  projects: ImageProject[];
  isLoading: boolean;
  canUndo: boolean;
  canRedo: boolean;
  
  // Project management
  createProject: (name: string, width: number, height: number) => void;
  loadProject: (projectId: string) => void;
  saveProject: () => Promise<void>;
  deleteProject: (projectId: string) => void;
  
  // Image operations
  loadImage: (file: File) => Promise<void>;
  exportImage: (format: 'png' | 'jpg' | 'webp', quality?: number) => Promise<Blob>;
  
  // Layer management
  addLayer: (layer: Omit<ImageLayer, 'id'>) => void;
  updateLayer: (layerId: string, updates: Partial<ImageLayer>) => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  mergeLayer: (layerId: string, targetLayerId: string) => void;
  
  // History management
  undo: () => void;
  redo: () => void;
  addHistoryStep: (action: string) => void;
  
  // Filters and effects
  applyFilter: (layerId: string, filter: ImageFilter) => void;
  removeFilter: (layerId: string, filterId: string) => void;
  
  // Transform operations
  resize: (width: number, height: number) => void;
  rotate: (angle: number) => void;
  flip: (direction: 'horizontal' | 'vertical') => void;
  crop: (x: number, y: number, width: number, height: number) => void;
  
  // AI operations
  removeBackground: (layerId: string) => Promise<void>;
  enhanceImage: (layerId: string) => Promise<void>;
  detectObjects: (layerId: string) => Promise<any[]>;
  
  // Redaction
  redactArea: (x: number, y: number, width: number, height: number) => void;
  redactObject: (layerId: string, objectId: string) => void;
}

export const useImageEditorStore = create<ImageEditorState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],
      isLoading: false,
      canUndo: false,
      canRedo: false,

      createProject: (name: string, width: number, height: number) => {
        const project: ImageProject = {
          id: uuidv4(),
          name,
          width,
          height,
          layers: [
            {
              id: uuidv4(),
              name: 'Background',
              type: 'image',
              visible: true,
              opacity: 1,
              blendMode: 'normal',
              x: 0,
              y: 0,
              width,
              height,
              data: {
                backgroundColor: '#ffffff'
              },
              filters: []
            }
          ],
          history: [],
          currentHistoryIndex: -1,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'current-user',
            lastModifiedBy: 'current-user',
            version: 1,
            size: 0,
            checksum: '',
            encrypted: false,
            tags: []
          }
        };

        set(state => ({
          currentProject: project,
          projects: [...state.projects, project],
          canUndo: false,
          canRedo: false
        }));

        AuditService.logEvent(
          'image-project-created',
          'image-editor',
          project.id,
          { name, width, height },
          'data-modification',
          'low'
        );
      },

      loadProject: (projectId: string) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        
        if (project) {
          set({
            currentProject: project,
            canUndo: project.currentHistoryIndex >= 0,
            canRedo: project.currentHistoryIndex < project.history.length - 1
          });

          AuditService.logEvent(
            'image-project-loaded',
            'image-editor',
            projectId,
            { name: project.name },
            'data-access',
            'low'
          );
        }
      },

      saveProject: async () => {
        const state = get();
        if (!state.currentProject) return;

        try {
          // Update the project in the projects array
          const updatedProject = {
            ...state.currentProject,
            metadata: {
              ...state.currentProject.metadata,
              updatedAt: new Date(),
              version: state.currentProject.metadata.version + 1
            }
          };

          set(currentState => ({
            currentProject: updatedProject,
            projects: currentState.projects.map(p => 
              p.id === updatedProject.id ? updatedProject : p
            )
          }));

          await AuditService.logEvent(
            'image-project-saved',
            'image-editor',
            updatedProject.id,
            { version: updatedProject.metadata.version },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to save project:', error);
        }
      },

      deleteProject: (projectId: string) => {
        set(state => {
          const updatedProjects = state.projects.filter(p => p.id !== projectId);
          return {
            projects: updatedProjects,
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject
          };
        });

        AuditService.logEvent(
          'image-project-deleted',
          'image-editor',
          projectId,
          {},
          'data-modification',
          'medium'
        );
      },

      loadImage: async (file: File) => {
        set({ isLoading: true });
        
        try {
          return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
              const img = new Image();
              
              img.onload = () => {
                // Create a new project with the image
                const project: ImageProject = {
                  id: uuidv4(),
                  name: file.name,
                  width: img.width,
                  height: img.height,
                  layers: [
                    {
                      id: uuidv4(),
                      name: 'Image Layer',
                      type: 'image',
                      visible: true,
                      opacity: 1,
                      blendMode: 'normal',
                      x: 0,
                      y: 0,
                      width: img.width,
                      height: img.height,
                      data: {
                        imageData: e.target?.result as string,
                        originalName: file.name
                      },
                      filters: []
                    }
                  ],
                  history: [],
                  currentHistoryIndex: -1,
                  metadata: {
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: 'current-user',
                    lastModifiedBy: 'current-user',
                    version: 1,
                    size: file.size,
                    checksum: '',
                    encrypted: false,
                    tags: []
                  }
                };

                set(state => ({
                  currentProject: project,
                  projects: [...state.projects, project],
                  isLoading: false,
                  canUndo: false,
                  canRedo: false
                }));

                AuditService.logEvent(
                  'image-loaded',
                  'image-editor',
                  project.id,
                  { 
                    filename: file.name,
                    size: file.size,
                    width: img.width,
                    height: img.height 
                  },
                  'data-modification',
                  'low'
                );

                resolve();
              };
              
              img.onerror = () => {
                set({ isLoading: false });
                reject(new Error('Failed to load image'));
              };
              
              img.src = e.target?.result as string;
            };
            
            reader.onerror = () => {
              set({ isLoading: false });
              reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      exportImage: async (format: 'png' | 'jpg' | 'webp', quality: number = 0.9) => {
        const state = get();
        if (!state.currentProject) {
          throw new Error('No project to export');
        }

        try {
          // Create a canvas to render the final image
          const canvas = document.createElement('canvas');
          canvas.width = state.currentProject.width;
          canvas.height = state.currentProject.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Render all visible layers
          for (const layer of state.currentProject.layers) {
            if (!layer.visible) continue;
            
            // This is a simplified implementation
            // In a real editor, you'd render each layer type appropriately
            if (layer.type === 'image' && layer.data.imageData) {
              const img = new Image();
              img.src = layer.data.imageData;
              
              ctx.globalAlpha = layer.opacity;
              ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
            }
          }

          // Convert to blob
          return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  AuditService.logEvent(
                    'image-exported',
                    'image-editor',
                    state.currentProject!.id,
                    { format, quality },
                    'data-access',
                    'low'
                  );
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create blob'));
                }
              },
              `image/${format}`,
              quality
            );
          });
        } catch (error) {
          console.error('Export failed:', error);
          throw error;
        }
      },

      addLayer: (layer: Omit<ImageLayer, 'id'>) => {
        const state = get();
        if (!state.currentProject) return;

        const newLayer: ImageLayer = {
          id: uuidv4(),
          ...layer
        };

        const updatedProject = {
          ...state.currentProject,
          layers: [...state.currentProject.layers, newLayer]
        };

        set({ currentProject: updatedProject });
        get().addHistoryStep(`Add ${layer.type} layer`);

        AuditService.logEvent(
          'layer-added',
          'image-editor',
          state.currentProject.id,
          { layerType: layer.type, layerName: layer.name },
          'data-modification',
          'low'
        );
      },

      updateLayer: (layerId: string, updates: Partial<ImageLayer>) => {
        const state = get();
        if (!state.currentProject) return;

        const updatedProject = {
          ...state.currentProject,
          layers: state.currentProject.layers.map(layer =>
            layer.id === layerId ? { ...layer, ...updates } : layer
          )
        };

        set({ currentProject: updatedProject });
        get().addHistoryStep(`Update layer`);
      },

      deleteLayer: (layerId: string) => {
        const state = get();
        if (!state.currentProject) return;

        const layer = state.currentProject.layers.find(l => l.id === layerId);
        
        const updatedProject = {
          ...state.currentProject,
          layers: state.currentProject.layers.filter(layer => layer.id !== layerId)
        };

        set({ currentProject: updatedProject });
        get().addHistoryStep(`Delete layer`);

        AuditService.logEvent(
          'layer-deleted',
          'image-editor',
          state.currentProject.id,
          { layerName: layer?.name || 'unknown' },
          'data-modification',
          'low'
        );
      },

      duplicateLayer: (layerId: string) => {
        const state = get();
        if (!state.currentProject) return;

        const layer = state.currentProject.layers.find(l => l.id === layerId);
        if (!layer) return;

        const duplicatedLayer: ImageLayer = {
          ...layer,
          id: uuidv4(),
          name: `${layer.name} Copy`,
          x: layer.x + 10,
          y: layer.y + 10
        };

        const updatedProject = {
          ...state.currentProject,
          layers: [...state.currentProject.layers, duplicatedLayer]
        };

        set({ currentProject: updatedProject });
        get().addHistoryStep(`Duplicate layer`);
      },

      moveLayer: (layerId: string, direction: 'up' | 'down') => {
        const state = get();
        if (!state.currentProject) return;

        const layers = [...state.currentProject.layers];
        const currentIndex = layers.findIndex(l => l.id === layerId);
        
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
        
        if (newIndex < 0 || newIndex >= layers.length) return;

        // Swap layers
        [layers[currentIndex], layers[newIndex]] = [layers[newIndex], layers[currentIndex]];

        const updatedProject = {
          ...state.currentProject,
          layers
        };

        set({ currentProject: updatedProject });
        get().addHistoryStep(`Move layer ${direction}`);
      },

      mergeLayer: (layerId: string, targetLayerId: string) => {
        const state = get();
        if (!state.currentProject) return;

        // This would implement layer merging logic
        // For now, just remove the source layer
        get().deleteLayer(layerId);
        get().addHistoryStep(`Merge layers`);
      },

      addHistoryStep: (action: string) => {
        const state = get();
        if (!state.currentProject) return;

        const historyStep: ImageHistoryStep = {
          id: uuidv4(),
          action,
          timestamp: new Date(),
          layersSnapshot: JSON.stringify(state.currentProject.layers)
        };

        const updatedProject = {
          ...state.currentProject,
          history: [
            ...state.currentProject.history.slice(0, state.currentProject.currentHistoryIndex + 1),
            historyStep
          ],
          currentHistoryIndex: state.currentProject.currentHistoryIndex + 1
        };

        set({
          currentProject: updatedProject,
          canUndo: true,
          canRedo: false
        });
      },

      undo: () => {
        const state = get();
        if (!state.currentProject || state.currentProject.currentHistoryIndex < 0) return;

        const newIndex = state.currentProject.currentHistoryIndex - 1;
        
        let layers = state.currentProject.layers;
        if (newIndex >= 0) {
          const historyStep = state.currentProject.history[newIndex];
          layers = JSON.parse(historyStep.layersSnapshot);
        }

        const updatedProject = {
          ...state.currentProject,
          layers,
          currentHistoryIndex: newIndex
        };

        set({
          currentProject: updatedProject,
          canUndo: newIndex >= 0,
          canRedo: true
        });

        AuditService.logEvent(
          'undo-action',
          'image-editor',
          state.currentProject.id,
          {},
          'data-modification',
          'low'
        );
      },

      redo: () => {
        const state = get();
        if (!state.currentProject || 
            state.currentProject.currentHistoryIndex >= state.currentProject.history.length - 1) return;

        const newIndex = state.currentProject.currentHistoryIndex + 1;
        const historyStep = state.currentProject.history[newIndex];
        const layers = JSON.parse(historyStep.layersSnapshot);

        const updatedProject = {
          ...state.currentProject,
          layers,
          currentHistoryIndex: newIndex
        };

        set({
          currentProject: updatedProject,
          canUndo: true,
          canRedo: newIndex < state.currentProject.history.length - 1
        });

        AuditService.logEvent(
          'redo-action',
          'image-editor',
          state.currentProject.id,
          {},
          'data-modification',
          'low'
        );
      },

      applyFilter: (layerId: string, filter: ImageFilter) => {
        const state = get();
        if (!state.currentProject) return;

        const updatedProject = {
          ...state.currentProject,
          layers: state.currentProject.layers.map(layer =>
            layer.id === layerId
              ? { ...layer, filters: [...layer.filters, { ...filter, id: uuidv4() }] }
              : layer
          )
        };

        set({ currentProject: updatedProject });
        get().addHistoryStep(`Apply ${filter.type} filter`);

        AuditService.logEvent(
          'filter-applied',
          'image-editor',
          state.currentProject.id,
          { layerId, filterType: filter.type },
          'data-modification',
          'low'
        );
      },

      removeFilter: (layerId: string, filterId: string) => {
        const state = get();
        if (!state.currentProject) return;

        const updatedProject = {
          ...state.currentProject,
          layers: state.currentProject.layers.map(layer =>
            layer.id === layerId
              ? { ...layer, filters: layer.filters.filter(f => f.id !== filterId) }
              : layer
          )
        };

        set({ currentProject: updatedProject });
        get().addHistoryStep(`Remove filter`);
      },

      resize: (width: number, height: number) => {
        const state = get();
        if (!state.currentProject) return;

        const updatedProject = {
          ...state.currentProject,
          width,
          height
        };

        set({ currentProject: updatedProject });
        get().addHistoryStep(`Resize canvas`);
      },

      rotate: (angle: number) => {
        // Implement rotation logic
        get().addHistoryStep(`Rotate ${angle}°`);
      },

      flip: (direction: 'horizontal' | 'vertical') => {
        // Implement flip logic
        get().addHistoryStep(`Flip ${direction}`);
      },

      crop: (x: number, y: number, width: number, height: number) => {
        // Implement crop logic
        get().addHistoryStep(`Crop image`);
      },

      removeBackground: async (layerId: string) => {
        try {
          // This would implement AI background removal
          // For now, just add a history step
          get().addHistoryStep(`Remove background`);

          const state = get();
          if (state.currentProject) {
            await AuditService.logEvent(
              'ai-background-removal',
              'image-editor',
              state.currentProject.id,
              { layerId },
              'data-modification',
              'medium'
            );
          }
        } catch (error) {
          console.error('Background removal failed:', error);
        }
      },

      enhanceImage: async (layerId: string) => {
        try {
          // This would implement AI image enhancement
          get().addHistoryStep(`AI enhance`);

          const state = get();
          if (state.currentProject) {
            await AuditService.logEvent(
              'ai-image-enhancement',
              'image-editor',
              state.currentProject.id,
              { layerId },
              'data-modification',
              'medium'
            );
          }
        } catch (error) {
          console.error('Image enhancement failed:', error);
        }
      },

      detectObjects: async (layerId: string) => {
        try {
          // This would implement AI object detection
          const state = get();
          if (state.currentProject) {
            await AuditService.logEvent(
              'ai-object-detection',
              'image-editor',
              state.currentProject.id,
              { layerId },
              'data-access',
              'low'
            );
          }

          // Return mock objects for now
          return [
            { id: '1', type: 'person', confidence: 0.95, bbox: [100, 100, 200, 300] },
            { id: '2', type: 'car', confidence: 0.87, bbox: [300, 200, 150, 100] }
          ];
        } catch (error) {
          console.error('Object detection failed:', error);
          return [];
        }
      },

      redactArea: (x: number, y: number, width: number, height: number) => {
        const state = get();
        if (!state.currentProject) return;

        // Add a permanent black redaction layer
        const redactionLayer: ImageLayer = {
          id: uuidv4(),
          name: 'Redaction',
          type: 'shape',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          x,
          y,
          width,
          height,
          data: {
            shapeType: 'rectangle',
            fillColor: '#000000',
            permanent: true // Mark as permanent redaction
          },
          filters: []
        };

        get().addLayer(redactionLayer);
        
        AuditService.logEvent(
          'area-redacted',
          'image-editor',
          state.currentProject.id,
          { x, y, width, height },
          'security-event',
          'high'
        );
      },

      redactObject: (layerId: string, objectId: string) => {
        const state = get();
        if (!state.currentProject) return;

        // This would redact a detected object
        get().addHistoryStep(`Redact object`);

        AuditService.logEvent(
          'object-redacted',
          'image-editor',
          state.currentProject.id,
          { layerId, objectId },
          'security-event',
          'high'
        );
      },
    }),
    {
      name: 'sdc-image-editor-storage',
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
      }),
    }
  )
);