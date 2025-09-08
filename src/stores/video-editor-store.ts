import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VideoProject, VideoClip, VideoEffect, RedactionMask, VideoTrack } from '@/types';
import { EncryptionService } from '@/services/encryption';
import { AuditService } from '@/services/audit';
import { v4 as uuidv4 } from 'uuid';

interface VideoEditorState {
  projects: VideoProject[];
  project: VideoProject | null;
  timeline: VideoTrack[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  selectedClip: VideoClip | null;
  selectedTrack: string | null;
  zoomLevel: number;
  isLoading: boolean;
  
  // Project management
  createProject: (name: string) => string;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  deleteProject: (projectId: string) => void;
  
  // Media management
  importVideo: (file: File) => Promise<string>;
  importAudio: (file: File) => Promise<string>;
  removeMedia: (mediaId: string) => void;
  
  // Timeline management
  addTrack: (type: 'video' | 'audio' | 'subtitle', name: string) => string;
  removeTrack: (trackId: string) => void;
  
  // Clip operations
  addClip: (trackId: string, clip: Partial<VideoClip>) => string;
  removeClip: (clipId: string) => void;
  splitClip: (clipId: string, time: number) => string[];
  trimClip: (clipId: string, startTime: number, endTime: number) => void;
  moveClip: (clipId: string, trackId: string, startTime: number) => void;
  selectClip: (clipId: string | null) => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setZoomLevel: (level: number) => void;
  
  // Effects and redaction
  addEffect: (clipId: string, effect: VideoEffect) => void;
  removeEffect: (clipId: string, effectId: string) => void;
  addRedactionMask: (clipId: string, mask: RedactionMask) => void;
  removeRedactionMask: (clipId: string, maskId: string) => void;
  
  // Export
  exportVideo: (format: string, quality: string) => Promise<Blob>;
}

export const useVideoEditorStore = create<VideoEditorState>()(
  persist(
    (set, get) => ({
      projects: [],
      project: null,
      timeline: [],
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      selectedClip: null,
      selectedTrack: null,
      zoomLevel: 1,
      isLoading: false,

      createProject: (name: string) => {
        const projectId = uuidv4();
        const project: VideoProject = {
          id: projectId,
          name,
          duration: 0,
          fps: 30,
          resolution: '1920x1080',
          hasMedia: false,
          tracks: [],
          media: [],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'current-user',
            lastModifiedBy: 'current-user',
            version: 1,
            size: 0,
            checksum: '',
            encrypted: true,
            tags: ['video-project'],
          },
          permissions: {
            owner: 'current-user',
            readers: [],
            editors: [],
            commenters: [],
            public: false,
          },
          exportSettings: {
            format: 'mp4',
            quality: 'high',
            resolution: '1920x1080',
            fps: 30,
            bitrate: 5000,
          }
        };

        // Create default video and audio tracks
        const videoTrack: VideoTrack = {
          id: uuidv4(),
          type: 'video',
          name: 'Video Track 1',
          clips: [],
          muted: false,
          locked: false,
          visible: true,
          height: 60,
        };

        const audioTrack: VideoTrack = {
          id: uuidv4(),
          type: 'audio',
          name: 'Audio Track 1',
          clips: [],
          muted: false,
          locked: false,
          visible: true,
          height: 40,
        };

        project.tracks = [videoTrack, audioTrack];

        set(state => ({
          projects: [...state.projects, project],
          project,
          timeline: project.tracks,
        }));

        AuditService.logEvent('video-project-created', 'video-editor', 'current-user',
          { project_id: projectId, name }, 'content-creation', 'low');

        return projectId;
      },

      loadProject: async (projectId: string) => {
        set({ isLoading: true });
        
        try {
          const state = get();
          const project = state.projects.find(p => p.id === projectId);
          
          if (!project) {
            set({ isLoading: false });
            return;
          }

          set({
            project,
            timeline: project.tracks,
            duration: project.duration,
            currentTime: 0,
            isPlaying: false,
            selectedClip: null,
            isLoading: false,
          });

          await AuditService.logEvent('video-project-loaded', 'video-editor', 'current-user',
            { project_id: projectId }, 'content-creation', 'low');
        } catch (error) {
          console.error('Failed to load project:', error);
          set({ isLoading: false });
        }
      },

      saveProject: async () => {
        const state = get();
        if (!state.project) return;

        set({ isLoading: true });

        try {
          const updatedProject = {
            ...state.project,
            tracks: state.timeline,
            metadata: {
              ...state.project.metadata,
              updatedAt: new Date(),
              lastModifiedBy: 'current-user',
            },
          };

          // Encrypt and save project data
          const projectData = JSON.stringify(updatedProject);
          const encrypted = EncryptionService.encrypt(projectData, 'project-key');
          
          // In a real app, this would save to secure storage
          localStorage.setItem(`video_project_${updatedProject.id}`, JSON.stringify(encrypted));

          set(state => ({
            projects: state.projects.map(p => p.id === updatedProject.id ? updatedProject : p),
            project: updatedProject,
            isLoading: false,
          }));

          await AuditService.logEvent('video-project-saved', 'video-editor', 'current-user',
            { project_id: updatedProject.id }, 'content-creation', 'low');
        } catch (error) {
          console.error('Failed to save project:', error);
          set({ isLoading: false });
        }
      },

      deleteProject: (projectId: string) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          project: state.project?.id === projectId ? null : state.project,
          timeline: state.project?.id === projectId ? [] : state.timeline,
        }));

        localStorage.removeItem(`video_project_${projectId}`);
        
        AuditService.logEvent('video-project-deleted', 'video-editor', 'current-user',
          { project_id: projectId }, 'content-creation', 'medium');
      },

      importVideo: async (file: File) => {
        set({ isLoading: true });
        
        try {
          const mediaId = uuidv4();
          
          // Create object URL for the video
          const url = URL.createObjectURL(file);
          
          // Get video metadata
          const video = document.createElement('video');
          video.src = url;
          
          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });

          const media = {
            id: mediaId,
            name: file.name,
            type: 'video' as const,
            url,
            duration: video.duration,
            size: file.size,
            format: file.type,
            resolution: `${video.videoWidth}x${video.videoHeight}`,
            fps: 30, // Would detect from video in real app
          };

          set(state => {
            if (!state.project) return state;
            
            const updatedProject = {
              ...state.project,
              media: [...state.project.media, media],
              hasMedia: true,
              duration: Math.max(state.project.duration, video.duration),
            };

            return {
              project: updatedProject,
              duration: updatedProject.duration,
              isLoading: false,
            };
          });

          await AuditService.logEvent('video-imported', 'video-editor', 'current-user',
            { media_id: mediaId, filename: file.name, size: file.size }, 'content-creation', 'low');

          return mediaId;
        } catch (error) {
          console.error('Failed to import video:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      importAudio: async (file: File) => {
        set({ isLoading: true });
        
        try {
          const mediaId = uuidv4();
          const url = URL.createObjectURL(file);
          
          // Get audio metadata
          const audio = document.createElement('audio');
          audio.src = url;
          
          await new Promise((resolve) => {
            audio.onloadedmetadata = resolve;
          });

          const media = {
            id: mediaId,
            name: file.name,
            type: 'audio' as const,
            url,
            duration: audio.duration,
            size: file.size,
            format: file.type,
          };

          set(state => {
            if (!state.project) return state;
            
            const updatedProject = {
              ...state.project,
              media: [...state.project.media, media],
              hasMedia: true,
              duration: Math.max(state.project.duration, audio.duration),
            };

            return {
              project: updatedProject,
              duration: updatedProject.duration,
              isLoading: false,
            };
          });

          await AuditService.logEvent('audio-imported', 'video-editor', 'current-user',
            { media_id: mediaId, filename: file.name, size: file.size }, 'content-creation', 'low');

          return mediaId;
        } catch (error) {
          console.error('Failed to import audio:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      removeMedia: (mediaId: string) => {
        set(state => {
          if (!state.project) return state;
          
          const media = state.project.media.find(m => m.id === mediaId);
          if (media) {
            URL.revokeObjectURL(media.url);
          }

          return {
            project: {
              ...state.project,
              media: state.project.media.filter(m => m.id !== mediaId),
            },
          };
        });

        AuditService.logEvent('media-removed', 'video-editor', 'current-user',
          { media_id: mediaId }, 'content-creation', 'low');
      },

      addTrack: (type: 'video' | 'audio' | 'subtitle', name: string) => {
        const trackId = uuidv4();
        const track: VideoTrack = {
          id: trackId,
          type,
          name,
          clips: [],
          muted: false,
          locked: false,
          visible: true,
          height: type === 'video' ? 60 : type === 'audio' ? 40 : 30,
        };

        set(state => ({
          timeline: [...state.timeline, track],
          project: state.project ? {
            ...state.project,
            tracks: [...state.project.tracks, track],
          } : state.project,
        }));

        AuditService.logEvent('track-added', 'video-editor', 'current-user',
          { track_id: trackId, type, name }, 'content-creation', 'low');

        return trackId;
      },

      removeTrack: (trackId: string) => {
        set(state => ({
          timeline: state.timeline.filter(t => t.id !== trackId),
          project: state.project ? {
            ...state.project,
            tracks: state.project.tracks.filter(t => t.id !== trackId),
          } : state.project,
          selectedTrack: state.selectedTrack === trackId ? null : state.selectedTrack,
        }));

        AuditService.logEvent('track-removed', 'video-editor', 'current-user',
          { track_id: trackId }, 'content-creation', 'low');
      },

      addClip: (trackId: string, clipData: Partial<VideoClip>) => {
        const clipId = uuidv4();
        const clip: VideoClip = {
          id: clipId,
          name: clipData.name || 'Untitled Clip',
          startTime: clipData.startTime || 0,
          endTime: clipData.endTime || 10,
          duration: clipData.duration || 10,
          trimStart: 0,
          trimEnd: clipData.duration || 10,
          volume: 100,
          effects: [],
          redactionMasks: [],
          mediaId: clipData.mediaId,
          ...clipData,
        };

        set(state => ({
          timeline: state.timeline.map(track => 
            track.id === trackId 
              ? { ...track, clips: [...track.clips, clip] }
              : track
          ),
          project: state.project ? {
            ...state.project,
            tracks: state.project.tracks.map(track => 
              track.id === trackId 
                ? { ...track, clips: [...track.clips, clip] }
                : track
            ),
          } : state.project,
        }));

        AuditService.logEvent('clip-added', 'video-editor', 'current-user',
          { clip_id: clipId, track_id: trackId }, 'content-creation', 'low');

        return clipId;
      },

      removeClip: (clipId: string) => {
        set(state => ({
          timeline: state.timeline.map(track => ({
            ...track,
            clips: track.clips.filter(c => c.id !== clipId),
          })),
          project: state.project ? {
            ...state.project,
            tracks: state.project.tracks.map(track => ({
              ...track,
              clips: track.clips.filter(c => c.id !== clipId),
            })),
          } : state.project,
          selectedClip: state.selectedClip?.id === clipId ? null : state.selectedClip,
        }));

        AuditService.logEvent('clip-removed', 'video-editor', 'current-user',
          { clip_id: clipId }, 'content-creation', 'low');
      },

      splitClip: (clipId: string, time: number) => {
        const state = get();
        let splitClips: string[] = [];

        set(prevState => {
          const updatedTimeline = prevState.timeline.map(track => {
            const clipIndex = track.clips.findIndex(c => c.id === clipId);
            if (clipIndex === -1) return track;

            const originalClip = track.clips[clipIndex];
            if (time <= originalClip.startTime || time >= originalClip.endTime) return track;

            const firstClipId = uuidv4();
            const secondClipId = uuidv4();
            splitClips = [firstClipId, secondClipId];

            const firstClip: VideoClip = {
              ...originalClip,
              id: firstClipId,
              endTime: time,
              duration: time - originalClip.startTime,
              trimEnd: originalClip.trimStart + (time - originalClip.startTime),
            };

            const secondClip: VideoClip = {
              ...originalClip,
              id: secondClipId,
              startTime: time,
              trimStart: originalClip.trimStart + (time - originalClip.startTime),
            };

            const newClips = [...track.clips];
            newClips.splice(clipIndex, 1, firstClip, secondClip);

            return { ...track, clips: newClips };
          });

          return {
            timeline: updatedTimeline,
            project: prevState.project ? {
              ...prevState.project,
              tracks: updatedTimeline,
            } : prevState.project,
          };
        });

        AuditService.logEvent('clip-split', 'video-editor', 'current-user',
          { original_clip_id: clipId, new_clips: splitClips }, 'content-creation', 'low');

        return splitClips;
      },

      trimClip: (clipId: string, startTime: number, endTime: number) => {
        set(state => ({
          timeline: state.timeline.map(track => ({
            ...track,
            clips: track.clips.map(clip => 
              clip.id === clipId 
                ? { 
                    ...clip, 
                    startTime, 
                    endTime,
                    duration: endTime - startTime,
                  }
                : clip
            ),
          })),
          project: state.project ? {
            ...state.project,
            tracks: state.project.tracks.map(track => ({
              ...track,
              clips: track.clips.map(clip => 
                clip.id === clipId 
                  ? { 
                      ...clip, 
                      startTime, 
                      endTime,
                      duration: endTime - startTime,
                    }
                  : clip
              ),
            })),
          } : state.project,
        }));

        AuditService.logEvent('clip-trimmed', 'video-editor', 'current-user',
          { clip_id: clipId, start_time: startTime, end_time: endTime }, 'content-creation', 'low');
      },

      moveClip: (clipId: string, trackId: string, startTime: number) => {
        set(state => {
          // Remove clip from current track
          const timelineWithoutClip = state.timeline.map(track => ({
            ...track,
            clips: track.clips.filter(c => c.id !== clipId),
          }));

          // Find the clip to move
          let clipToMove: VideoClip | null = null;
          for (const track of state.timeline) {
            clipToMove = track.clips.find(c => c.id === clipId) || null;
            if (clipToMove) break;
          }

          if (!clipToMove) return state;

          // Add clip to new track with new start time
          const updatedClip = {
            ...clipToMove,
            startTime,
            endTime: startTime + clipToMove.duration,
          };

          const updatedTimeline = timelineWithoutClip.map(track => 
            track.id === trackId 
              ? { ...track, clips: [...track.clips, updatedClip] }
              : track
          );

          return {
            timeline: updatedTimeline,
            project: state.project ? {
              ...state.project,
              tracks: updatedTimeline,
            } : state.project,
          };
        });

        AuditService.logEvent('clip-moved', 'video-editor', 'current-user',
          { clip_id: clipId, new_track_id: trackId, new_start_time: startTime }, 'content-creation', 'low');
      },

      selectClip: (clipId: string | null) => {
        if (!clipId) {
          set({ selectedClip: null });
          return;
        }

        const state = get();
        let selectedClip: VideoClip | null = null;

        for (const track of state.timeline) {
          selectedClip = track.clips.find(c => c.id === clipId) || null;
          if (selectedClip) break;
        }

        set({ selectedClip });
      },

      play: () => {
        set({ isPlaying: true });
        
        AuditService.logEvent('video-playback-started', 'video-editor', 'current-user',
          {}, 'content-creation', 'low');
      },

      pause: () => {
        set({ isPlaying: false });
        
        AuditService.logEvent('video-playback-paused', 'video-editor', 'current-user',
          {}, 'content-creation', 'low');
      },

      stop: () => {
        set({ isPlaying: false, currentTime: 0 });
        
        AuditService.logEvent('video-playback-stopped', 'video-editor', 'current-user',
          {}, 'content-creation', 'low');
      },

      seekTo: (time: number) => {
        const state = get();
        const clampedTime = Math.max(0, Math.min(time, state.duration));
        set({ currentTime: clampedTime });
      },

      setZoomLevel: (level: number) => {
        const clampedLevel = Math.max(0.1, Math.min(level, 5));
        set({ zoomLevel: clampedLevel });
      },

      addEffect: (clipId: string, effect: VideoEffect) => {
        set(state => ({
          timeline: state.timeline.map(track => ({
            ...track,
            clips: track.clips.map(clip => 
              clip.id === clipId 
                ? { ...clip, effects: [...clip.effects, effect] }
                : clip
            ),
          })),
          project: state.project ? {
            ...state.project,
            tracks: state.project.tracks.map(track => ({
              ...track,
              clips: track.clips.map(clip => 
                clip.id === clipId 
                  ? { ...clip, effects: [...clip.effects, effect] }
                  : clip
              ),
            })),
          } : state.project,
        }));

        AuditService.logEvent('effect-added', 'video-editor', 'current-user',
          { clip_id: clipId, effect_type: effect.type, effect_id: effect.id }, 'content-creation', 'low');
      },

      removeEffect: (clipId: string, effectId: string) => {
        set(state => ({
          timeline: state.timeline.map(track => ({
            ...track,
            clips: track.clips.map(clip => 
              clip.id === clipId 
                ? { ...clip, effects: clip.effects.filter(e => e.id !== effectId) }
                : clip
            ),
          })),
          project: state.project ? {
            ...state.project,
            tracks: state.project.tracks.map(track => ({
              ...track,
              clips: track.clips.map(clip => 
                clip.id === clipId 
                  ? { ...clip, effects: clip.effects.filter(e => e.id !== effectId) }
                  : clip
              ),
            })),
          } : state.project,
        }));

        AuditService.logEvent('effect-removed', 'video-editor', 'current-user',
          { clip_id: clipId, effect_id: effectId }, 'content-creation', 'low');
      },

      addRedactionMask: (clipId: string, mask: RedactionMask) => {
        set(state => ({
          timeline: state.timeline.map(track => ({
            ...track,
            clips: track.clips.map(clip => 
              clip.id === clipId 
                ? { ...clip, redactionMasks: [...clip.redactionMasks, mask] }
                : clip
            ),
          })),
          project: state.project ? {
            ...state.project,
            tracks: state.project.tracks.map(track => ({
              ...track,
              clips: track.clips.map(clip => 
                clip.id === clipId 
                  ? { ...clip, redactionMasks: [...clip.redactionMasks, mask] }
                  : clip
              ),
            })),
          } : state.project,
        }));

        AuditService.logEvent('redaction-mask-added', 'video-editor', 'current-user',
          { clip_id: clipId, mask_id: mask.id, mask_type: mask.type }, 'content-creation', 'medium');
      },

      removeRedactionMask: (clipId: string, maskId: string) => {
        set(state => ({
          timeline: state.timeline.map(track => ({
            ...track,
            clips: track.clips.map(clip => 
              clip.id === clipId 
                ? { ...clip, redactionMasks: clip.redactionMasks.filter(m => m.id !== maskId) }
                : clip
            ),
          })),
          project: state.project ? {
            ...state.project,
            tracks: state.project.tracks.map(track => ({
              ...track,
              clips: track.clips.map(clip => 
                clip.id === clipId 
                  ? { ...clip, redactionMasks: clip.redactionMasks.filter(m => m.id !== maskId) }
                  : clip
              ),
            })),
          } : state.project,
        }));

        AuditService.logEvent('redaction-mask-removed', 'video-editor', 'current-user',
          { clip_id: clipId, mask_id: maskId }, 'content-creation', 'medium');
      },

      exportVideo: async (format: string, quality: string) => {
        set({ isLoading: true });

        try {
          // Simulate video export process
          await new Promise(resolve => setTimeout(resolve, 3000));

          // In a real app, this would render the video with all effects and redactions
          const blob = new Blob([''], { type: `video/${format}` });

          await AuditService.logEvent('video-exported', 'video-editor', 'current-user',
            { format, quality, project_id: get().project?.id }, 'content-creation', 'low');

          set({ isLoading: false });
          return blob;
        } catch (error) {
          console.error('Failed to export video:', error);
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'sdc-video-editor-storage',
      partialize: (state) => ({ 
        projects: state.projects,
        zoomLevel: state.zoomLevel,
      }),
    }
  )
);