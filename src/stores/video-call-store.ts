import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VideoCall, CallParticipant, CallMessage, CallTranscription } from '@/types';
import { EncryptionService } from '@/services/encryption';
import { AuditService } from '@/services/audit';
import { v4 as uuidv4 } from 'uuid';

interface VideoCallState {
  calls: VideoCall[];
  currentCall: VideoCall | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isConnected: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  participants: CallParticipant[];
  chatMessages: CallMessage[];
  transcription: CallTranscription[];
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  isLoading: boolean;
  
  // Call management
  createCall: (title: string) => Promise<string>;
  joinCall: (callId: string) => Promise<void>;
  leaveCall: () => Promise<void>;
  endCall: () => Promise<void>;
  
  // Media controls
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  
  // Recording
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  
  // Participants
  inviteParticipant: (email: string) => Promise<void>;
  removeParticipant: (participantId: string) => Promise<void>;
  promoteToPresenter: (participantId: string) => Promise<void>;
  
  // Chat
  sendMessage: (message: string, isPrivate?: boolean, recipientId?: string) => Promise<void>;
  
  // Transcription
  enableTranscription: () => Promise<void>;
  disableTranscription: () => Promise<void>;
  enableTranslation: (targetLanguage: string) => Promise<void>;
  
  // Security
  enableWaitingRoom: (enabled: boolean) => Promise<void>;
  setCallPassword: (password: string) => Promise<void>;
  
  // Utilities
  checkAudioPermissions: () => Promise<boolean>;
  checkVideoPermissions: () => Promise<boolean>;
  testMediaDevices: () => Promise<{ audio: boolean; video: boolean }>;
  getNetworkQuality: () => Promise<string>;
  initializeLocalMedia: () => Promise<void>;
}

export const useVideoCallStore = create<VideoCallState>()(
  persist(
    (set, get) => ({
      calls: [],
      currentCall: null,
      localStream: null,
      remoteStreams: new Map(),
      isConnected: false,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
      isRecording: false,
      participants: [],
      chatMessages: [],
      transcription: [],
      connectionQuality: 'disconnected',
      isLoading: false,

      createCall: async (title: string) => {
        set({ isLoading: true });
        
        try {
          const callId = uuidv4();
          const call: VideoCall = {
            id: callId,
            title,
            participants: [{
              userId: 'current-user',
              name: 'Current User',
              email: 'user@example.com',
              role: 'host',
              isConnected: true,
              joinedAt: new Date(),
              isMuted: false,
              isVideoEnabled: true,
              isScreenSharing: false,
            }],
            startTime: new Date(),
            status: 'active',
            isRecording: false,
            settings: {
              allowChat: true,
              allowScreenShare: true,
              allowRecording: true,
              requirePermissionToJoin: false,
              enableTranscription: false,
              enableTranslation: false,
            },
            chatMessages: [],
          };

          // Initialize WebRTC connection
          await get().initializeLocalMedia();

          set(state => ({
            calls: [...state.calls, call],
            currentCall: call,
            participants: call.participants,
            isConnected: true,
            isLoading: false,
          }));

          await AuditService.logEvent('video-call-created', 'video-chat', 'current-user',
            { call_id: callId, title }, 'communication', 'low');

          return callId;
        } catch (error) {
          console.error('Failed to create call:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      joinCall: async (callId: string) => {
        set({ isLoading: true });
        
        try {
          // Initialize local media
          await get().initializeLocalMedia();

          // In a real app, this would establish WebRTC connection
          const participant: CallParticipant = {
            userId: 'current-user',
            name: 'Current User',
            email: 'user@example.com',
            role: 'participant',
            isConnected: true,
            joinedAt: new Date(),
            isMuted: false,
            isVideoEnabled: true,
            isScreenSharing: false,
          };

          set(state => {
            const call = state.calls.find(c => c.id === callId);
            if (!call) return state;

            const updatedCall = {
              ...call,
              participants: [...call.participants, participant],
            };

            return {
              calls: state.calls.map(c => c.id === callId ? updatedCall : c),
              currentCall: updatedCall,
              participants: updatedCall.participants,
              isConnected: true,
              isLoading: false,
            };
          });

          await AuditService.logEvent('video-call-joined', 'video-chat', 'current-user',
            { call_id: callId }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to join call:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      leaveCall: async () => {
        const state = get();
        if (!state.currentCall) return;

        try {
          // Stop local media
          if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
          }

          // Stop screen sharing if active
          if (state.isScreenSharing) {
            await get().stopScreenShare();
          }

          // Stop recording if active
          if (state.isRecording) {
            await get().stopRecording();
          }

          await AuditService.logEvent('video-call-left', 'video-chat', 'current-user',
            { call_id: state.currentCall.id }, 'communication', 'low');

          set({
            currentCall: null,
            localStream: null,
            remoteStreams: new Map(),
            isConnected: false,
            isScreenSharing: false,
            isRecording: false,
            participants: [],
            chatMessages: [],
            transcription: [],
            connectionQuality: 'disconnected',
          });
        } catch (error) {
          console.error('Failed to leave call:', error);
        }
      },

      endCall: async () => {
        const state = get();
        if (!state.currentCall || state.currentCall.participants[0].role !== 'host') return;

        try {
          const updatedCall = {
            ...state.currentCall,
            status: 'ended' as const,
            endTime: new Date(),
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
          }));

          await get().leaveCall();

          await AuditService.logEvent('video-call-ended', 'video-chat', 'current-user',
            { call_id: updatedCall.id, duration: updatedCall.endTime.getTime() - updatedCall.startTime.getTime() }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to end call:', error);
        }
      },

      toggleAudio: async () => {
        const state = get();
        if (!state.localStream) return;

        try {
          const audioTrack = state.localStream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = !state.isAudioEnabled;
            set({ isAudioEnabled: !state.isAudioEnabled });

            await AuditService.logEvent('audio-toggled', 'video-chat', 'current-user',
              { enabled: !state.isAudioEnabled, call_id: state.currentCall?.id }, 'communication', 'low');
          }
        } catch (error) {
          console.error('Failed to toggle audio:', error);
        }
      },

      toggleVideo: async () => {
        const state = get();
        if (!state.localStream) return;

        try {
          const videoTrack = state.localStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.enabled = !state.isVideoEnabled;
            set({ isVideoEnabled: !state.isVideoEnabled });

            await AuditService.logEvent('video-toggled', 'video-chat', 'current-user',
              { enabled: !state.isVideoEnabled, call_id: state.currentCall?.id }, 'communication', 'low');
          }
        } catch (error) {
          console.error('Failed to toggle video:', error);
        }
      },

      startScreenShare: async () => {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });

          // In a real app, this would replace the video track in the WebRTC connection
          set({ isScreenSharing: true });

          screenStream.getVideoTracks()[0].onended = () => {
            get().stopScreenShare();
          };

          await AuditService.logEvent('screen-share-started', 'video-chat', 'current-user',
            { call_id: get().currentCall?.id }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to start screen share:', error);
          throw error;
        }
      },

      stopScreenShare: async () => {
        try {
          // In a real app, this would switch back to camera feed
          set({ isScreenSharing: false });

          await AuditService.logEvent('screen-share-stopped', 'video-chat', 'current-user',
            { call_id: get().currentCall?.id }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to stop screen share:', error);
        }
      },

      startRecording: async () => {
        const state = get();
        if (!state.currentCall) return;

        try {
          // In a real app, this would start MediaRecorder
          const updatedCall = {
            ...state.currentCall,
            isRecording: true,
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
            isRecording: true,
          }));

          await AuditService.logEvent('recording-started', 'video-chat', 'current-user',
            { call_id: updatedCall.id }, 'communication', 'medium');
        } catch (error) {
          console.error('Failed to start recording:', error);
        }
      },

      stopRecording: async () => {
        const state = get();
        if (!state.currentCall) return;

        try {
          const updatedCall = {
            ...state.currentCall,
            isRecording: false,
            recordingUrl: `recording_${state.currentCall.id}.webm`, // Simulated
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
            isRecording: false,
          }));

          await AuditService.logEvent('recording-stopped', 'video-chat', 'current-user',
            { call_id: updatedCall.id, recording_url: updatedCall.recordingUrl }, 'communication', 'medium');
        } catch (error) {
          console.error('Failed to stop recording:', error);
        }
      },

      inviteParticipant: async (email: string) => {
        const state = get();
        if (!state.currentCall) return;

        try {
          // In a real app, this would send an invitation
          await AuditService.logEvent('participant-invited', 'video-chat', 'current-user',
            { call_id: state.currentCall.id, invited_email: email }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to invite participant:', error);
        }
      },

      removeParticipant: async (participantId: string) => {
        const state = get();
        if (!state.currentCall) return;

        try {
          const updatedCall = {
            ...state.currentCall,
            participants: state.currentCall.participants.filter(p => p.userId !== participantId),
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
            participants: updatedCall.participants,
          }));

          await AuditService.logEvent('participant-removed', 'video-chat', 'current-user',
            { call_id: updatedCall.id, removed_participant_id: participantId }, 'communication', 'medium');
        } catch (error) {
          console.error('Failed to remove participant:', error);
        }
      },

      promoteToPresenter: async (participantId: string) => {
        const state = get();
        if (!state.currentCall) return;

        try {
          const updatedCall = {
            ...state.currentCall,
            participants: state.currentCall.participants.map(p =>
              p.userId === participantId ? { ...p, role: 'presenter' as const } : p
            ),
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
            participants: updatedCall.participants,
          }));

          await AuditService.logEvent('participant-promoted', 'video-chat', 'current-user',
            { call_id: updatedCall.id, promoted_participant_id: participantId }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to promote participant:', error);
        }
      },

      sendMessage: async (message: string, isPrivate = false, recipientId?: string) => {
        const state = get();
        if (!state.currentCall) return;

        try {
          const chatMessage: CallMessage = {
            id: uuidv4(),
            senderId: 'current-user',
            senderName: 'Current User',
            message: message,
            timestamp: new Date(),
            isPrivate,
            recipientId,
          };

          // Encrypt message
          const encryptedMessage = EncryptionService.encrypt(message, 'chat-key');

          const updatedCall = {
            ...state.currentCall,
            chatMessages: [...state.currentCall.chatMessages, chatMessage],
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
            chatMessages: updatedCall.chatMessages,
          }));

          await AuditService.logEvent('chat-message-sent', 'video-chat', 'current-user',
            { 
              call_id: updatedCall.id, 
              message_id: chatMessage.id, 
              is_private: isPrivate,
              recipient_id: recipientId 
            }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to send message:', error);
        }
      },

      enableTranscription: async () => {
        const state = get();
        if (!state.currentCall) return;

        try {
          const updatedCall = {
            ...state.currentCall,
            settings: {
              ...state.currentCall.settings,
              enableTranscription: true,
            },
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
          }));

          // In a real app, this would start speech recognition
          await AuditService.logEvent('transcription-enabled', 'video-chat', 'current-user',
            { call_id: updatedCall.id }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to enable transcription:', error);
        }
      },

      disableTranscription: async () => {
        const state = get();
        if (!state.currentCall) return;

        try {
          const updatedCall = {
            ...state.currentCall,
            settings: {
              ...state.currentCall.settings,
              enableTranscription: false,
            },
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
            transcription: [],
          }));

          await AuditService.logEvent('transcription-disabled', 'video-chat', 'current-user',
            { call_id: updatedCall.id }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to disable transcription:', error);
        }
      },

      enableTranslation: async (targetLanguage: string) => {
        const state = get();
        if (!state.currentCall) return;

        try {
          const updatedCall = {
            ...state.currentCall,
            settings: {
              ...state.currentCall.settings,
              enableTranslation: true,
              targetLanguage,
            },
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
          }));

          await AuditService.logEvent('translation-enabled', 'video-chat', 'current-user',
            { call_id: updatedCall.id, target_language: targetLanguage }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to enable translation:', error);
        }
      },

      enableWaitingRoom: async (enabled: boolean) => {
        const state = get();
        if (!state.currentCall) return;

        try {
          const updatedCall = {
            ...state.currentCall,
            settings: {
              ...state.currentCall.settings,
              requirePermissionToJoin: enabled,
            },
          };

          set(state => ({
            calls: state.calls.map(c => c.id === updatedCall.id ? updatedCall : c),
            currentCall: updatedCall,
          }));

          await AuditService.logEvent('waiting-room-toggled', 'video-chat', 'current-user',
            { call_id: updatedCall.id, enabled }, 'communication', 'low');
        } catch (error) {
          console.error('Failed to toggle waiting room:', error);
        }
      },

      setCallPassword: async (password: string) => {
        const state = get();
        if (!state.currentCall) return;

        try {
          // Hash the password for security
          const hashedPassword = EncryptionService.hashPassword(password);

          // In a real app, this would update call settings
          await AuditService.logEvent('call-password-set', 'video-chat', 'current-user',
            { call_id: state.currentCall.id }, 'communication', 'medium');
        } catch (error) {
          console.error('Failed to set call password:', error);
        }
      },

      checkAudioPermissions: async () => {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          return result.state === 'granted';
        } catch (error) {
          console.error('Failed to check audio permissions:', error);
          return false;
        }
      },

      checkVideoPermissions: async () => {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          return result.state === 'granted';
        } catch (error) {
          console.error('Failed to check video permissions:', error);
          return false;
        }
      },

      testMediaDevices: async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasAudio = devices.some(device => device.kind === 'audioinput');
          const hasVideo = devices.some(device => device.kind === 'videoinput');
          
          return { audio: hasAudio, video: hasVideo };
        } catch (error) {
          console.error('Failed to test media devices:', error);
          return { audio: false, video: false };
        }
      },

      getNetworkQuality: async () => {
        try {
          // In a real app, this would measure network latency and bandwidth
          const quality = ['excellent', 'good', 'poor'][Math.floor(Math.random() * 3)];
          set({ connectionQuality: quality as any });
          return quality;
        } catch (error) {
          console.error('Failed to get network quality:', error);
          return 'poor';
        }
      },

      // Private helper methods
      initializeLocalMedia: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          set({ localStream: stream });
        } catch (error) {
          console.error('Failed to initialize local media:', error);
          throw error;
        }
      },
    }),
    {
      name: 'sdc-video-call-storage',
      partialize: (state) => ({ 
        calls: state.calls,
      }),
    }
  )
);