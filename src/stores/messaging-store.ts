import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, Conversation, MessageAttachment } from '../types';
import { EncryptionService } from '../services/encryption';
import { AuditService } from '../services/audit';
import { v4 as uuidv4 } from 'uuid';

interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  
  // Conversation management
  loadConversations: () => Promise<void>;
  createConversation: (name: string, participants: string[], type: 'direct' | 'group') => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  muteConversation: (conversationId: string, muted: boolean) => Promise<void>;
  
  // Message management
  sendMessage: (conversationId: string, message: Omit<Message, 'id' | 'conversationId'>) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  markAsDelivered: (messageId: string) => Promise<void>;
  
  // Search and filtering
  searchMessages: (query: string) => Promise<Message[]>;
  searchConversations: (query: string) => Conversation[];
  
  // File handling
  uploadAttachment: (file: File) => Promise<MessageAttachment>;
  downloadAttachment: (attachmentId: string) => Promise<void>;
  
  // AI Personas
  sendToPersona: (personaType: string, message: string) => Promise<void>;
  getPersonaResponse: (personaType: string, context: string) => Promise<string>;
  
  // Voice messages
  recordVoiceMessage: () => Promise<Blob>;
  sendVoiceMessage: (conversationId: string, audioBlob: Blob) => Promise<void>;
  
  // Group management
  addParticipant: (conversationId: string, userId: string) => Promise<void>;
  removeParticipant: (conversationId: string, userId: string) => Promise<void>;
  updateGroupName: (conversationId: string, name: string) => Promise<void>;
  updateGroupAdmins: (conversationId: string, adminIds: string[]) => Promise<void>;
}

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,

      loadConversations: async () => {
        set({ isLoading: true });
        
        try {
          // For demo purposes, create some sample conversations if none exist
          const state = get();
          if (state.conversations.length === 0) {
            const sampleConversations: Conversation[] = [
              {
                id: uuidv4(),
                type: 'direct',
                name: 'Alice Johnson',
                participants: ['current-user', 'alice'],
                admins: [],
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                lastMessage: {
                  id: uuidv4(),
                  conversationId: '',
                  senderId: 'alice',
                  content: 'Hey! How are you doing?',
                  type: 'text',
                  timestamp: new Date(Date.now() - 30 * 60 * 1000),
                  encrypted: true,
                  delivered: true,
                  read: false,
                  attachments: []
                },
                unreadCount: 2,
                archived: false,
                muted: false,
                encrypted: true
              },
              {
                id: uuidv4(),
                type: 'group',
                name: 'Project Team',
                participants: ['current-user', 'alice', 'bob', 'carol'],
                admins: ['current-user'],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                lastMessage: {
                  id: uuidv4(),
                  conversationId: '',
                  senderId: 'bob',
                  content: 'Meeting at 3 PM today',
                  type: 'text',
                  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                  encrypted: true,
                  delivered: true,
                  read: true,
                  attachments: []
                },
                unreadCount: 0,
                archived: false,
                muted: false,
                encrypted: true
              }
            ];
            
            set({ conversations: sampleConversations });
          }
          
          set({ isLoading: false });

          await AuditService.logEvent(
            'conversations-loaded',
            'messaging',
            'load',
            { count: state.conversations.length },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to load conversations:', error);
          set({ isLoading: false });
        }
      },

      createConversation: async (name: string, participants: string[], type: 'direct' | 'group') => {
        try {
          const newConversation: Conversation = {
            id: uuidv4(),
            type,
            name,
            participants: ['current-user', ...participants],
            admins: type === 'group' ? ['current-user'] : [],
            createdAt: new Date(),
            unreadCount: 0,
            archived: false,
            muted: false,
            encrypted: true
          };

          set(state => ({
            conversations: [newConversation, ...state.conversations],
            currentConversation: newConversation
          }));

          await AuditService.logEvent(
            'conversation-created',
            'messaging',
            newConversation.id,
            { name, type, participantCount: participants.length },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to create conversation:', error);
          throw error;
        }
      },

      selectConversation: async (conversationId: string) => {
        try {
          const state = get();
          const conversation = state.conversations.find(c => c.id === conversationId);
          
          if (!conversation) return;

          // Generate sample messages for demo
          const sampleMessages: Message[] = [
            {
              id: uuidv4(),
              conversationId,
              senderId: conversation.participants[1] || 'alice',
              content: 'Hey! How are you doing?',
              type: 'text',
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
              encrypted: true,
              delivered: true,
              read: true,
              attachments: []
            },
            {
              id: uuidv4(),
              conversationId,
              senderId: 'current-user',
              content: 'I\'m doing great! Just working on the new project.',
              type: 'text',
              timestamp: new Date(Date.now() - 25 * 60 * 1000),
              encrypted: true,
              delivered: true,
              read: true,
              attachments: []
            },
            {
              id: uuidv4(),
              conversationId,
              senderId: conversation.participants[1] || 'alice',
              content: 'That sounds exciting! Can you share more details?',
              type: 'text',
              timestamp: new Date(Date.now() - 20 * 60 * 1000),
              encrypted: true,
              delivered: true,
              read: false,
              attachments: []
            }
          ];

          set({
            currentConversation: conversation,
            messages: sampleMessages
          });

          // Mark as read
          await get().markAsRead(conversationId);

          await AuditService.logEvent(
            'conversation-selected',
            'messaging',
            conversationId,
            { name: conversation.name },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to select conversation:', error);
        }
      },

      deleteConversation: async (conversationId: string) => {
        try {
          const state = get();
          const conversation = state.conversations.find(c => c.id === conversationId);
          
          set(currentState => ({
            conversations: currentState.conversations.filter(c => c.id !== conversationId),
            currentConversation: currentState.currentConversation?.id === conversationId 
              ? null 
              : currentState.currentConversation,
            messages: currentState.currentConversation?.id === conversationId 
              ? [] 
              : currentState.messages
          }));

          await AuditService.logEvent(
            'conversation-deleted',
            'messaging',
            conversationId,
            { name: conversation?.name || 'unknown' },
            'communication',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete conversation:', error);
          throw error;
        }
      },

      archiveConversation: async (conversationId: string) => {
        try {
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId ? { ...c, archived: true } : c
            ),
            currentConversation: state.currentConversation?.id === conversationId
              ? null
              : state.currentConversation
          }));

          await AuditService.logEvent(
            'conversation-archived',
            'messaging',
            conversationId,
            {},
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to archive conversation:', error);
          throw error;
        }
      },

      muteConversation: async (conversationId: string, muted: boolean) => {
        try {
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId ? { ...c, muted } : c
            )
          }));

          await AuditService.logEvent(
            muted ? 'conversation-muted' : 'conversation-unmuted',
            'messaging',
            conversationId,
            {},
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to mute/unmute conversation:', error);
          throw error;
        }
      },

      sendMessage: async (conversationId: string, messageData: Omit<Message, 'id' | 'conversationId'>) => {
        try {
          const newMessage: Message = {
            id: uuidv4(),
            conversationId,
            ...messageData
          };

          // Encrypt message content if needed
          if (messageData.encrypted && messageData.content) {
            // In a real implementation, this would use proper key management
            const encryptedContent = EncryptionService.encrypt(
              messageData.content, 
              'conversation-key-' + conversationId
            );
            newMessage.content = JSON.stringify(encryptedContent);
          }

          // Add to messages
          set(state => ({
            messages: [...state.messages, newMessage]
          }));

          // Update conversation's last message
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId 
                ? { ...c, lastMessage: newMessage }
                : c
            )
          }));

          await AuditService.logEvent(
            'message-sent',
            'messaging',
            conversationId,
            { 
              messageType: messageData.type,
              hasAttachments: messageData.attachments.length > 0 
            },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to send message:', error);
          throw error;
        }
      },

      editMessage: async (messageId: string, newContent: string) => {
        try {
          set(state => ({
            messages: state.messages.map(m =>
              m.id === messageId 
                ? { ...m, content: newContent, edited: true, editedAt: new Date() }
                : m
            )
          }));

          await AuditService.logEvent(
            'message-edited',
            'messaging',
            messageId,
            {},
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to edit message:', error);
          throw error;
        }
      },

      deleteMessage: async (messageId: string) => {
        try {
          set(state => ({
            messages: state.messages.filter(m => m.id !== messageId)
          }));

          await AuditService.logEvent(
            'message-deleted',
            'messaging',
            messageId,
            {},
            'communication',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete message:', error);
          throw error;
        }
      },

      markAsRead: async (conversationId: string) => {
        try {
          // Mark all messages as read
          set(state => ({
            messages: state.messages.map(m =>
              m.conversationId === conversationId ? { ...m, read: true } : m
            ),
            conversations: state.conversations.map(c =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c
            )
          }));
        } catch (error) {
          console.error('Failed to mark as read:', error);
        }
      },

      markAsDelivered: async (messageId: string) => {
        try {
          set(state => ({
            messages: state.messages.map(m =>
              m.id === messageId ? { ...m, delivered: true } : m
            )
          }));
        } catch (error) {
          console.error('Failed to mark as delivered:', error);
        }
      },

      searchMessages: async (query: string) => {
        try {
          const state = get();
          const results = state.messages.filter(message =>
            message.content.toLowerCase().includes(query.toLowerCase())
          );

          await AuditService.logEvent(
            'messages-searched',
            'messaging',
            'search',
            { query, resultCount: results.length },
            'communication',
            'low'
          );

          return results;
        } catch (error) {
          console.error('Message search failed:', error);
          return [];
        }
      },

      searchConversations: (query: string) => {
        const state = get();
        return state.conversations.filter(conversation =>
          conversation.name?.toLowerCase().includes(query.toLowerCase()) ||
          conversation.lastMessage?.content.toLowerCase().includes(query.toLowerCase())
        );
      },

      uploadAttachment: async (file: File) => {
        try {
          // Convert file to base64 for storage
          return new Promise<MessageAttachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const attachment: MessageAttachment = {
                id: uuidv4(),
                name: file.name,
                type: file.type,
                size: file.size,
                url: e.target?.result as string,
                encrypted: true,
                checksum: EncryptionService.calculateChecksum(e.target?.result as string)
              };
              resolve(attachment);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
        } catch (error) {
          console.error('Failed to upload attachment:', error);
          throw error;
        }
      },

      downloadAttachment: async (attachmentId: string) => {
        try {
          // Find the attachment and trigger download
          const state = get();
          const message = state.messages.find(m => 
            m.attachments.some(a => a.id === attachmentId)
          );
          
          if (!message) return;
          
          const attachment = message.attachments.find(a => a.id === attachmentId);
          if (!attachment || !attachment.url) return;

          // Create download link
          const a = document.createElement('a');
          a.href = attachment.url;
          a.download = attachment.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          await AuditService.logEvent(
            'attachment-downloaded',
            'messaging',
            attachmentId,
            { filename: attachment.name, size: attachment.size },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to download attachment:', error);
          throw error;
        }
      },

      sendToPersona: async (personaType: string, message: string) => {
        try {
          // This would integrate with AI persona system
          const response = await get().getPersonaResponse(personaType, message);
          
          // Send the AI response as a message
          const currentConv = get().currentConversation;
          if (currentConv) {
            await get().sendMessage(currentConv.id, {
              content: response,
              type: 'text',
              senderId: `ai-${personaType}`,
              timestamp: new Date(),
              encrypted: true,
              delivered: true,
              read: false,
              attachments: []
            });
          }

          await AuditService.logEvent(
            'ai-persona-interaction',
            'messaging',
            personaType,
            { messageLength: message.length },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to send to persona:', error);
          throw error;
        }
      },

      getPersonaResponse: async (personaType: string, context: string) => {
        try {
          // Mock AI responses for different persona types
          const responses = {
            assistant: 'I\'m here to help! How can I assist you today?',
            translator: 'I can help translate that for you. What language would you like?',
            writer: 'That\'s an interesting topic. Let me help you develop that idea further.',
            researcher: 'I can help you find information about that topic. Let me search for relevant sources.',
            coach: 'That sounds like a great goal! Let\'s break it down into actionable steps.'
          };

          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          return responses[personaType as keyof typeof responses] || 'I\'m not sure how to help with that.';
        } catch (error) {
          console.error('Failed to get persona response:', error);
          return 'Sorry, I\'m having trouble processing that right now.';
        }
      },

      recordVoiceMessage: async () => {
        try {
          // This would implement voice recording
          // For now, return a mock blob
          return new Blob(['mock audio data'], { type: 'audio/wav' });
        } catch (error) {
          console.error('Failed to record voice message:', error);
          throw error;
        }
      },

      sendVoiceMessage: async (conversationId: string, audioBlob: Blob) => {
        try {
          // Convert audio blob to base64
          return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const attachment: MessageAttachment = {
                id: uuidv4(),
                name: 'voice-message.wav',
                type: 'audio/wav',
                size: audioBlob.size,
                url: e.target?.result as string,
                encrypted: true,
                checksum: EncryptionService.calculateChecksum(e.target?.result as string)
              };

              await get().sendMessage(conversationId, {
                content: 'Voice message',
                type: 'voice',
                senderId: 'current-user',
                timestamp: new Date(),
                encrypted: true,
                delivered: false,
                read: false,
                attachments: [attachment]
              });

              resolve();
            };
            reader.onerror = () => reject(new Error('Failed to process audio'));
            reader.readAsDataURL(audioBlob);
          });
        } catch (error) {
          console.error('Failed to send voice message:', error);
          throw error;
        }
      },

      addParticipant: async (conversationId: string, userId: string) => {
        try {
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId && !c.participants.includes(userId)
                ? { ...c, participants: [...c.participants, userId] }
                : c
            )
          }));

          await AuditService.logEvent(
            'participant-added',
            'messaging',
            conversationId,
            { userId },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to add participant:', error);
          throw error;
        }
      },

      removeParticipant: async (conversationId: string, userId: string) => {
        try {
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId
                ? { 
                    ...c, 
                    participants: c.participants.filter(p => p !== userId),
                    admins: c.admins.filter(a => a !== userId)
                  }
                : c
            )
          }));

          await AuditService.logEvent(
            'participant-removed',
            'messaging',
            conversationId,
            { userId },
            'communication',
            'medium'
          );
        } catch (error) {
          console.error('Failed to remove participant:', error);
          throw error;
        }
      },

      updateGroupName: async (conversationId: string, name: string) => {
        try {
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId ? { ...c, name } : c
            )
          }));

          await AuditService.logEvent(
            'group-name-updated',
            'messaging',
            conversationId,
            { newName: name },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to update group name:', error);
          throw error;
        }
      },

      updateGroupAdmins: async (conversationId: string, adminIds: string[]) => {
        try {
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId ? { ...c, admins: adminIds } : c
            )
          }));

          await AuditService.logEvent(
            'group-admins-updated',
            'messaging',
            conversationId,
            { adminCount: adminIds.length },
            'communication',
            'medium'
          );
        } catch (error) {
          console.error('Failed to update group admins:', error);
          throw error;
        }
      },
    }),
    {
      name: 'sdc-messaging-storage',
      partialize: (state) => ({
        conversations: state.conversations,
      }),
    }
  )
);