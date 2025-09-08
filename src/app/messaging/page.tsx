'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Video, 
  Search, 
  Plus, 
  Shield, 
  Lock, 
  Phone,
  MoreVertical,
  Archive,
  Trash2,
  Volume2,
  VolumeX,
  Star,
  Flag
} from 'lucide-react';
import { useMessagingStore } from '../../../stores/messaging-store';
import { formatDate, getInitials, stringToColor } from '../../../utils/format';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';

const MessagingPage = () => {
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    loadConversations,
    selectConversation,
    sendMessage,
    createConversation,
    searchMessages,
    markAsRead,
    deleteConversation,
    archiveConversation,
    muteConversation,
  } = useMessagingStore();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !currentConversation) return;

    try {
      await sendMessage(currentConversation.id, {
        content: messageText,
        type: 'text',
        timestamp: new Date(),
        senderId: 'current-user', // This should be the actual current user ID
        encrypted: true,
        delivered: false,
        read: false,
        attachments: []
      });
      
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [messageText, currentConversation, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentConversation) return;

    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const attachment = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: e.target?.result as string,
          encrypted: true,
          checksum: 'calculated-checksum' // This would be calculated properly
        };

        await sendMessage(currentConversation.id, {
          content: `Shared ${file.name}`,
          type: 'file',
          timestamp: new Date(),
          senderId: 'current-user',
          encrypted: true,
          delivered: false,
          read: false,
          attachments: [attachment]
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  }, [currentConversation, sendMessage]);

  const handleVoiceRecord = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording and send voice message
    } else {
      setIsRecording(true);
      // Start recording
    }
  }, [isRecording]);

  const startVideoCall = useCallback(() => {
    if (currentConversation) {
      // This would initiate a video call
      console.log('Starting video call...');
    }
  }, [currentConversation]);

  const startPhoneCall = useCallback(() => {
    if (currentConversation) {
      // This would initiate a phone call
      console.log('Starting phone call...');
    }
  }, [currentConversation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <Button size="sm" onClick={() => createConversation('New Chat', [], 'direct')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-500" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-auto">
          {conversations
            .filter(conv => 
              !searchQuery || 
              conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((conversation) => (
            <div
              key={conversation.id}
              className={`
                p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors
                ${currentConversation?.id === conversation.id ? 'bg-primary/10 border-primary/20' : ''}
              `}
              onClick={() => selectConversation(conversation.id)}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{ backgroundColor: stringToColor(conversation.name || 'Unknown') }}
                >
                  {conversation.type === 'group' ? (
                    <span className="text-xs">{conversation.participants.length}</span>
                  ) : (
                    getInitials(conversation.name || 'Unknown')
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name and Time */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">
                      {conversation.name || 'Unknown'}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conversation.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>

                  {/* Last Message */}
                  {conversation.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessage.type === 'file' ? (
                        <span className="flex items-center">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {conversation.lastMessage.content}
                        </span>
                      ) : (
                        conversation.lastMessage.content
                      )}
                    </p>
                  )}

                  {/* Status Indicators */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1">
                      {conversation.encrypted && (
                        <Lock className="h-3 w-3 text-green-500" />
                      )}
                      {conversation.muted && (
                        <VolumeX className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    
                    {conversation.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: stringToColor(currentConversation.name || 'Unknown') }}
                  >
                    {currentConversation.type === 'group' ? (
                      <span className="text-xs">{currentConversation.participants.length}</span>
                    ) : (
                      getInitials(currentConversation.name || 'Unknown')
                    )}
                  </div>
                  
                  <div>
                    <h2 className="font-semibold">
                      {currentConversation.name || 'Unknown'}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {currentConversation.encrypted && (
                        <>
                          <Lock className="h-3 w-3 text-green-500" />
                          <span>Encrypted</span>
                        </>
                      )}
                      {currentConversation.type === 'group' && (
                        <span>{currentConversation.participants.length} members</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={startPhoneCall}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={startVideoCall}>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => muteConversation(currentConversation.id, !currentConversation.muted)}
                      >
                        {currentConversation.muted ? (
                          <>
                            <Volume2 className="h-4 w-4 mr-2" />
                            Unmute
                          </>
                        ) : (
                          <>
                            <VolumeX className="h-4 w-4 mr-2" />
                            Mute
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => archiveConversation(currentConversation.id)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteConversation(currentConversation.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.senderId === 'current-user';
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`
                          rounded-lg p-3 break-words
                          ${isOwn 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                          }
                        `}
                      >
                        {message.type === 'text' && (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        
                        {message.type === 'file' && message.attachments[0] && (
                          <div className="space-y-2">
                            <p>{message.content}</p>
                            <div className="flex items-center space-x-2 p-2 bg-background/10 rounded">
                              <Paperclip className="h-4 w-4" />
                              <span className="text-sm">{message.attachments[0].name}</span>
                              <span className="text-xs opacity-70">
                                {Math.round(message.attachments[0].size / 1024)}KB
                              </span>
                            </div>
                          </div>
                        )}

                        {message.type === 'voice' && (
                          <div className="flex items-center space-x-2">
                            <Mic className="h-4 w-4" />
                            <div className="flex-1 h-1 bg-background/20 rounded">
                              <div className="h-full bg-background/40 rounded w-1/3"></div>
                            </div>
                            <span className="text-xs">0:15</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex items-center mt-1 text-xs text-muted-foreground ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span>{formatDate(message.timestamp)}</span>
                        {message.encrypted && (
                          <Lock className="h-3 w-3 ml-1 text-green-500" />
                        )}
                        {isOwn && (
                          <span className="ml-2">
                            {message.read ? '✓✓' : message.delivered ? '✓' : '○'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="resize-none"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceRecord}
                  className={isRecording ? 'text-red-500' : ''}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 mr-1 text-green-500" />
                <span>Messages are end-to-end encrypted</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Secure Messaging</h2>
              <p className="text-sm mb-4">Select a conversation to start messaging</p>
              <div className="flex items-center justify-center space-x-2 text-xs">
                <Lock className="h-3 w-3 text-green-500" />
                <span>End-to-end encrypted</span>
                <span>•</span>
                <span>AI personas available</span>
                <span>•</span>
                <span>Secure file transfer</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;