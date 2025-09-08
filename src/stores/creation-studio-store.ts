import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Presentation, Slide, Course, CourseModule, Lesson, Assessment } from '../types';
import { EncryptionService } from '../services/encryption';
import { AuditService } from '../services/audit';
import { v4 as uuidv4 } from 'uuid';

interface CreationStudioState {
  presentations: Presentation[];
  courses: Course[];
  currentPresentation: Presentation | null;
  currentCourse: Course | null;
  selectedSlide: Slide | null;
  selectedElement: string | null;
  isLoading: boolean;
  
  // Presentation management
  createPresentation: (name: string) => string;
  loadPresentation: (presentationId: string) => Promise<void>;
  savePresentation: () => Promise<void>;
  deletePresentation: (presentationId: string) => void;
  
  // Slide management
  addSlide: (index?: number) => string;
  deleteSlide: (slideId: string) => void;
  duplicateSlide: (slideId: string) => string;
  moveSlide: (slideId: string, newIndex: number) => void;
  selectSlide: (slideId: string) => void;
  
  // Element management
  addElement: (slideId: string, elementType: string) => string;
  updateElement: (slideId: string, elementId: string, data: any) => void;
  deleteElement: (slideId: string, elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  
  // Animation and transition
  addAnimation: (slideId: string, elementId: string, animation: any) => void;
  setTransition: (slideId: string, transition: any) => void;
  
  // Course management
  createCourse: (name: string, description: string) => string;
  loadCourse: (courseId: string) => Promise<void>;
  saveCourse: () => Promise<void>;
  deleteCourse: (courseId: string) => void;
  
  // Module management
  addModule: (title: string) => string;
  updateModule: (moduleId: string, data: Partial<CourseModule>) => void;
  deleteModule: (moduleId: string) => void;
  
  // Lesson management
  addLesson: (moduleId: string, lesson: Partial<Lesson>) => string;
  updateLesson: (moduleId: string, lessonId: string, data: Partial<Lesson>) => void;
  deleteLesson: (moduleId: string, lessonId: string) => void;
  
  // Assessment management
  addAssessment: (moduleId: string, assessment: Partial<Assessment>) => string;
  updateAssessment: (moduleId: string, assessmentId: string, data: Partial<Assessment>) => void;
  deleteAssessment: (moduleId: string, assessmentId: string) => void;
  
  // Export
  exportPresentation: (format: 'pdf' | 'html' | 'pptx') => Promise<Blob>;
  exportCourse: (format: 'scorm' | 'html' | 'zip') => Promise<Blob>;
}

export const useCreationStudioStore = create<CreationStudioState>()(
  persist(
    (set, get) => ({
      presentations: [],
      courses: [],
      currentPresentation: null,
      currentCourse: null,
      selectedSlide: null,
      selectedElement: null,
      isLoading: false,

      createPresentation: (name: string) => {
        const presentationId = uuidv4();
        const defaultSlide: Slide = {
          id: uuidv4(),
          title: 'Title Slide',
          content: [],
          background: {
            type: 'color',
            value: '#ffffff',
          },
          transitions: [],
          animations: [],
          notes: '',
        };

        const presentation: Presentation = {
          id: presentationId,
          name,
          slides: [defaultSlide],
          theme: {
            id: 'default',
            name: 'Default Theme',
            fonts: {
              heading: 'Inter',
              body: 'Inter',
            },
            colors: {
              primary: '#3b82f6',
              secondary: '#6b7280',
              accent: '#10b981',
              background: '#ffffff',
              text: '#111827',
            },
            spacing: {
              small: 8,
              medium: 16,
              large: 32,
            },
          },
          settings: {
            autoAdvance: false,
            autoAdvanceDelay: 5000,
            showControls: true,
            allowDownload: true,
            enableComments: false,
            enableAnalytics: false,
          },
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'current-user',
            lastModifiedBy: 'current-user',
            version: 1,
            size: 0,
            checksum: '',
            encrypted: true,
            tags: ['presentation'],
          },
          permissions: {
            owner: 'current-user',
            readers: [],
            editors: [],
            commenters: [],
            public: false,
          },
        };

        set(state => ({
          presentations: [...state.presentations, presentation],
          currentPresentation: presentation,
          selectedSlide: defaultSlide,
        }));

        AuditService.logEvent('presentation-created', 'creation-studio', 'current-user',
          { presentation_id: presentationId, name }, 'content-creation', 'low');

        return presentationId;
      },

      loadPresentation: async (presentationId: string) => {
        set({ isLoading: true });
        
        try {
          const state = get();
          const presentation = state.presentations.find(p => p.id === presentationId);
          
          if (!presentation) {
            set({ isLoading: false });
            return;
          }

          set({
            currentPresentation: presentation,
            selectedSlide: presentation.slides[0] || null,
            selectedElement: null,
            isLoading: false,
          });

          await AuditService.logEvent('presentation-loaded', 'creation-studio', 'current-user',
            { presentation_id: presentationId }, 'content-creation', 'low');
        } catch (error) {
          console.error('Failed to load presentation:', error);
          set({ isLoading: false });
        }
      },

      savePresentation: async () => {
        const state = get();
        if (!state.currentPresentation) return;

        set({ isLoading: true });

        try {
          const updatedPresentation = {
            ...state.currentPresentation,
            metadata: {
              ...state.currentPresentation.metadata,
              updatedAt: new Date(),
              lastModifiedBy: 'current-user',
            },
          };

          // Encrypt and save presentation data
          const presentationData = JSON.stringify(updatedPresentation);
          const encrypted = EncryptionService.encrypt(presentationData, 'presentation-key');
          
          localStorage.setItem(`presentation_${updatedPresentation.id}`, JSON.stringify(encrypted));

          set(state => ({
            presentations: state.presentations.map(p => p.id === updatedPresentation.id ? updatedPresentation : p),
            currentPresentation: updatedPresentation,
            isLoading: false,
          }));

          await AuditService.logEvent('presentation-saved', 'creation-studio', 'current-user',
            { presentation_id: updatedPresentation.id }, 'content-creation', 'low');
        } catch (error) {
          console.error('Failed to save presentation:', error);
          set({ isLoading: false });
        }
      },

      deletePresentation: (presentationId: string) => {
        set(state => ({
          presentations: state.presentations.filter(p => p.id !== presentationId),
          currentPresentation: state.currentPresentation?.id === presentationId ? null : state.currentPresentation,
          selectedSlide: state.currentPresentation?.id === presentationId ? null : state.selectedSlide,
        }));

        localStorage.removeItem(`presentation_${presentationId}`);
        
        AuditService.logEvent('presentation-deleted', 'creation-studio', 'current-user',
          { presentation_id: presentationId }, 'content-creation', 'medium');
      },

      addSlide: (index?: number) => {
        const slideId = uuidv4();
        const newSlide: Slide = {
          id: slideId,
          title: 'New Slide',
          content: [],
          background: {
            type: 'color',
            value: '#ffffff',
          },
          transitions: [],
          animations: [],
          notes: '',
        };

        set(state => {
          if (!state.currentPresentation) return state;

          const slides = [...state.currentPresentation.slides];
          const insertIndex = index !== undefined ? index : slides.length;
          slides.splice(insertIndex, 0, newSlide);

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
            selectedSlide: newSlide,
          };
        });

        AuditService.logEvent('slide-added', 'creation-studio', 'current-user',
          { slide_id: slideId, index }, 'content-creation', 'low');

        return slideId;
      },

      deleteSlide: (slideId: string) => {
        set(state => {
          if (!state.currentPresentation) return state;

          const slides = state.currentPresentation.slides.filter(s => s.id !== slideId);
          const wasSelected = state.selectedSlide?.id === slideId;

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
            selectedSlide: wasSelected ? (slides[0] || null) : state.selectedSlide,
            selectedElement: wasSelected ? null : state.selectedElement,
          };
        });

        AuditService.logEvent('slide-deleted', 'creation-studio', 'current-user',
          { slide_id: slideId }, 'content-creation', 'low');
      },

      duplicateSlide: (slideId: string) => {
        const newSlideId = uuidv4();

        set(state => {
          if (!state.currentPresentation) return state;

          const slideIndex = state.currentPresentation.slides.findIndex(s => s.id === slideId);
          if (slideIndex === -1) return state;

          const originalSlide = state.currentPresentation.slides[slideIndex];
          const duplicatedSlide: Slide = {
            ...originalSlide,
            id: newSlideId,
            title: `${originalSlide.title} (Copy)`,
            content: originalSlide.content.map(content => ({
              ...content,
              id: uuidv4(),
            })),
          };

          const slides = [...state.currentPresentation.slides];
          slides.splice(slideIndex + 1, 0, duplicatedSlide);

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
            selectedSlide: duplicatedSlide,
          };
        });

        AuditService.logEvent('slide-duplicated', 'creation-studio', 'current-user',
          { original_slide_id: slideId, new_slide_id: newSlideId }, 'content-creation', 'low');

        return newSlideId;
      },

      moveSlide: (slideId: string, newIndex: number) => {
        set(state => {
          if (!state.currentPresentation) return state;

          const slides = [...state.currentPresentation.slides];
          const slideIndex = slides.findIndex(s => s.id === slideId);
          
          if (slideIndex === -1) return state;

          const [slide] = slides.splice(slideIndex, 1);
          slides.splice(newIndex, 0, slide);

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
          };
        });

        AuditService.logEvent('slide-moved', 'creation-studio', 'current-user',
          { slide_id: slideId, new_index: newIndex }, 'content-creation', 'low');
      },

      selectSlide: (slideId: string) => {
        const state = get();
        if (!state.currentPresentation) return;

        const slide = state.currentPresentation.slides.find(s => s.id === slideId);
        if (!slide) return;

        set({ selectedSlide: slide, selectedElement: null });
      },

      addElement: (slideId: string, elementType: string) => {
        const elementId = uuidv4();
        const defaultData = {
          text: { content: 'New Text', fontSize: 16, color: '#000000' },
          image: { src: '', alt: '', objectFit: 'cover' },
          video: { src: '', controls: true, autoplay: false },
          chart: { type: 'bar', data: [], labels: [] },
          button: { text: 'Click me', action: 'next-slide' },
        };

        const newElement = {
          id: elementId,
          type: elementType as any,
          x: 100,
          y: 100,
          width: 200,
          height: elementType === 'text' ? 50 : 150,
          rotation: 0,
          opacity: 1,
          data: defaultData[elementType as keyof typeof defaultData] || {},
          animations: [],
        };

        set(state => {
          if (!state.currentPresentation) return state;

          const slides = state.currentPresentation.slides.map(slide =>
            slide.id === slideId
              ? { ...slide, content: [...slide.content, newElement] }
              : slide
          );

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
            selectedElement: elementId,
          };
        });

        AuditService.logEvent('element-added', 'creation-studio', 'current-user',
          { slide_id: slideId, element_id: elementId, element_type: elementType }, 'content-creation', 'low');

        return elementId;
      },

      updateElement: (slideId: string, elementId: string, data: any) => {
        set(state => {
          if (!state.currentPresentation) return state;

          const slides = state.currentPresentation.slides.map(slide =>
            slide.id === slideId
              ? {
                  ...slide,
                  content: slide.content.map(element =>
                    element.id === elementId ? { ...element, ...data } : element
                  ),
                }
              : slide
          );

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
          };
        });

        AuditService.logEvent('element-updated', 'creation-studio', 'current-user',
          { slide_id: slideId, element_id: elementId }, 'content-creation', 'low');
      },

      deleteElement: (slideId: string, elementId: string) => {
        set(state => {
          if (!state.currentPresentation) return state;

          const slides = state.currentPresentation.slides.map(slide =>
            slide.id === slideId
              ? {
                  ...slide,
                  content: slide.content.filter(element => element.id !== elementId),
                }
              : slide
          );

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
            selectedElement: state.selectedElement === elementId ? null : state.selectedElement,
          };
        });

        AuditService.logEvent('element-deleted', 'creation-studio', 'current-user',
          { slide_id: slideId, element_id: elementId }, 'content-creation', 'low');
      },

      selectElement: (elementId: string | null) => {
        set({ selectedElement: elementId });
      },

      addAnimation: (slideId: string, elementId: string, animation: any) => {
        set(state => {
          if (!state.currentPresentation) return state;

          const slides = state.currentPresentation.slides.map(slide =>
            slide.id === slideId
              ? {
                  ...slide,
                  content: slide.content.map(element =>
                    element.id === elementId
                      ? { ...element, animations: [...element.animations, animation] }
                      : element
                  ),
                }
              : slide
          );

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
          };
        });

        AuditService.logEvent('animation-added', 'creation-studio', 'current-user',
          { slide_id: slideId, element_id: elementId, animation_type: animation.effect }, 'content-creation', 'low');
      },

      setTransition: (slideId: string, transition: any) => {
        set(state => {
          if (!state.currentPresentation) return state;

          const slides = state.currentPresentation.slides.map(slide =>
            slide.id === slideId
              ? { ...slide, transitions: [transition] }
              : slide
          );

          return {
            currentPresentation: {
              ...state.currentPresentation,
              slides,
            },
          };
        });

        AuditService.logEvent('transition-set', 'creation-studio', 'current-user',
          { slide_id: slideId, transition_type: transition.type }, 'content-creation', 'low');
      },

      createCourse: (name: string, description: string) => {
        const courseId = uuidv4();
        const course: Course = {
          id: courseId,
          name,
          description,
          modules: [],
          settings: {
            isPublic: false,
            enrollmentRequired: true,
            certificate: false,
            trackProgress: true,
            allowDiscussions: true,
          },
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'current-user',
            lastModifiedBy: 'current-user',
            version: 1,
            size: 0,
            checksum: '',
            encrypted: true,
            tags: ['course'],
          },
          permissions: {
            owner: 'current-user',
            readers: [],
            editors: [],
            commenters: [],
            public: false,
          },
        };

        set(state => ({
          courses: [...state.courses, course],
          currentCourse: course,
        }));

        AuditService.logEvent('course-created', 'creation-studio', 'current-user',
          { course_id: courseId, name }, 'content-creation', 'low');

        return courseId;
      },

      loadCourse: async (courseId: string) => {
        set({ isLoading: true });
        
        try {
          const state = get();
          const course = state.courses.find(c => c.id === courseId);
          
          if (!course) {
            set({ isLoading: false });
            return;
          }

          set({
            currentCourse: course,
            isLoading: false,
          });

          await AuditService.logEvent('course-loaded', 'creation-studio', 'current-user',
            { course_id: courseId }, 'content-creation', 'low');
        } catch (error) {
          console.error('Failed to load course:', error);
          set({ isLoading: false });
        }
      },

      saveCourse: async () => {
        const state = get();
        if (!state.currentCourse) return;

        set({ isLoading: true });

        try {
          const updatedCourse = {
            ...state.currentCourse,
            metadata: {
              ...state.currentCourse.metadata,
              updatedAt: new Date(),
              lastModifiedBy: 'current-user',
            },
          };

          // Encrypt and save course data
          const courseData = JSON.stringify(updatedCourse);
          const encrypted = EncryptionService.encrypt(courseData, 'course-key');
          
          localStorage.setItem(`course_${updatedCourse.id}`, JSON.stringify(encrypted));

          set(state => ({
            courses: state.courses.map(c => c.id === updatedCourse.id ? updatedCourse : c),
            currentCourse: updatedCourse,
            isLoading: false,
          }));

          await AuditService.logEvent('course-saved', 'creation-studio', 'current-user',
            { course_id: updatedCourse.id }, 'content-creation', 'low');
        } catch (error) {
          console.error('Failed to save course:', error);
          set({ isLoading: false });
        }
      },

      deleteCourse: (courseId: string) => {
        set(state => ({
          courses: state.courses.filter(c => c.id !== courseId),
          currentCourse: state.currentCourse?.id === courseId ? null : state.currentCourse,
        }));

        localStorage.removeItem(`course_${courseId}`);
        
        AuditService.logEvent('course-deleted', 'creation-studio', 'current-user',
          { course_id: courseId }, 'content-creation', 'medium');
      },

      addModule: (title: string) => {
        const moduleId = uuidv4();
        const module: CourseModule = {
          id: moduleId,
          title,
          description: '',
          lessons: [],
          assessments: [],
          order: 0,
        };

        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: [...state.currentCourse.modules, module],
            },
          };
        });

        AuditService.logEvent('module-added', 'creation-studio', 'current-user',
          { module_id: moduleId, title }, 'content-creation', 'low');

        return moduleId;
      },

      updateModule: (moduleId: string, data: Partial<CourseModule>) => {
        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: state.currentCourse.modules.map(module =>
                module.id === moduleId ? { ...module, ...data } : module
              ),
            },
          };
        });

        AuditService.logEvent('module-updated', 'creation-studio', 'current-user',
          { module_id: moduleId }, 'content-creation', 'low');
      },

      deleteModule: (moduleId: string) => {
        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: state.currentCourse.modules.filter(module => module.id !== moduleId),
            },
          };
        });

        AuditService.logEvent('module-deleted', 'creation-studio', 'current-user',
          { module_id: moduleId }, 'content-creation', 'low');
      },

      addLesson: (moduleId: string, lessonData: Partial<Lesson>) => {
        const lessonId = uuidv4();
        const lesson: Lesson = {
          id: lessonId,
          title: lessonData.title || 'New Lesson',
          type: lessonData.type || 'text',
          content: lessonData.content || '',
          duration: lessonData.duration || 0,
          order: lessonData.order || 0,
          resources: [],
          ...lessonData,
        };

        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: state.currentCourse.modules.map(module =>
                module.id === moduleId
                  ? { ...module, lessons: [...module.lessons, lesson] }
                  : module
              ),
            },
          };
        });

        AuditService.logEvent('lesson-added', 'creation-studio', 'current-user',
          { module_id: moduleId, lesson_id: lessonId, title: lesson.title }, 'content-creation', 'low');

        return lessonId;
      },

      updateLesson: (moduleId: string, lessonId: string, data: Partial<Lesson>) => {
        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: state.currentCourse.modules.map(module =>
                module.id === moduleId
                  ? {
                      ...module,
                      lessons: module.lessons.map(lesson =>
                        lesson.id === lessonId ? { ...lesson, ...data } : lesson
                      ),
                    }
                  : module
              ),
            },
          };
        });

        AuditService.logEvent('lesson-updated', 'creation-studio', 'current-user',
          { module_id: moduleId, lesson_id: lessonId }, 'content-creation', 'low');
      },

      deleteLesson: (moduleId: string, lessonId: string) => {
        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: state.currentCourse.modules.map(module =>
                module.id === moduleId
                  ? {
                      ...module,
                      lessons: module.lessons.filter(lesson => lesson.id !== lessonId),
                    }
                  : module
              ),
            },
          };
        });

        AuditService.logEvent('lesson-deleted', 'creation-studio', 'current-user',
          { module_id: moduleId, lesson_id: lessonId }, 'content-creation', 'low');
      },

      addAssessment: (moduleId: string, assessmentData: Partial<Assessment>) => {
        const assessmentId = uuidv4();
        const assessment: Assessment = {
          id: assessmentId,
          title: assessmentData.title || 'New Assessment',
          type: assessmentData.type || 'quiz',
          questions: [],
          timeLimit: assessmentData.timeLimit,
          attempts: assessmentData.attempts || 1,
          passingScore: assessmentData.passingScore || 70,
          randomize: assessmentData.randomize || false,
          ...assessmentData,
        };

        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: state.currentCourse.modules.map(module =>
                module.id === moduleId
                  ? { ...module, assessments: [...module.assessments, assessment] }
                  : module
              ),
            },
          };
        });

        AuditService.logEvent('assessment-added', 'creation-studio', 'current-user',
          { module_id: moduleId, assessment_id: assessmentId, title: assessment.title }, 'content-creation', 'low');

        return assessmentId;
      },

      updateAssessment: (moduleId: string, assessmentId: string, data: Partial<Assessment>) => {
        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: state.currentCourse.modules.map(module =>
                module.id === moduleId
                  ? {
                      ...module,
                      assessments: module.assessments.map(assessment =>
                        assessment.id === assessmentId ? { ...assessment, ...data } : assessment
                      ),
                    }
                  : module
              ),
            },
          };
        });

        AuditService.logEvent('assessment-updated', 'creation-studio', 'current-user',
          { module_id: moduleId, assessment_id: assessmentId }, 'content-creation', 'low');
      },

      deleteAssessment: (moduleId: string, assessmentId: string) => {
        set(state => {
          if (!state.currentCourse) return state;

          return {
            currentCourse: {
              ...state.currentCourse,
              modules: state.currentCourse.modules.map(module =>
                module.id === moduleId
                  ? {
                      ...module,
                      assessments: module.assessments.filter(assessment => assessment.id !== assessmentId),
                    }
                  : module
              ),
            },
          };
        });

        AuditService.logEvent('assessment-deleted', 'creation-studio', 'current-user',
          { module_id: moduleId, assessment_id: assessmentId }, 'content-creation', 'low');
      },

      exportPresentation: async (format: 'pdf' | 'html' | 'pptx') => {
        set({ isLoading: true });

        try {
          // Simulate export process
          await new Promise(resolve => setTimeout(resolve, 2000));

          // In a real app, this would generate the actual export
          const blob = new Blob([''], { type: getExportMimeType(format) });

          await AuditService.logEvent('presentation-exported', 'creation-studio', 'current-user',
            { format, presentation_id: get().currentPresentation?.id }, 'content-creation', 'low');

          set({ isLoading: false });
          return blob;
        } catch (error) {
          console.error('Failed to export presentation:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      exportCourse: async (format: 'scorm' | 'html' | 'zip') => {
        set({ isLoading: true });

        try {
          // Simulate export process
          await new Promise(resolve => setTimeout(resolve, 3000));

          // In a real app, this would generate the actual export
          const blob = new Blob([''], { type: getExportMimeType(format) });

          await AuditService.logEvent('course-exported', 'creation-studio', 'current-user',
            { format, course_id: get().currentCourse?.id }, 'content-creation', 'low');

          set({ isLoading: false });
          return blob;
        } catch (error) {
          console.error('Failed to export course:', error);
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'sdc-creation-studio-storage',
      partialize: (state) => ({ 
        presentations: state.presentations,
        courses: state.courses,
      }),
    }
  )
);

function getExportMimeType(format: string): string {
  const mimeTypes = {
    pdf: 'application/pdf',
    html: 'text/html',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    scorm: 'application/zip',
    zip: 'application/zip',
  };
  return mimeTypes[format as keyof typeof mimeTypes] || 'application/octet-stream';
}