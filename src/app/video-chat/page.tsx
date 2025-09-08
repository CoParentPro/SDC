'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Settings,
  Users,
  MessageSquare,
  Share,
  Monitor,
  MonitorOff,
  Camera,
  Volume2,
  VolumeX,
  Phone,
  UserPlus,
  Copy,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  Circle,
  Square,
  Download,
  Languages,
  Subtitles,
  MoreHorizontal,
  Send,
  Smile,
  Eye,
  EyeOff,
  Crown,
  UserX
} from 'lucide-react';
import { useVideoCallStore } from '@/stores/video-call-store';
import { formatTime } from '@/utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const VideoCallPage = () => {
  const {
    calls,
    currentCall,
    localStream,
    remoteStreams,
    isConnected,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isRecording,
    participants,
    chatMessages,
    transcription,
    connectionQuality,
    isLoading,
    
    createCall,
    joinCall,
    leaveCall,
    endCall,
    
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    
    startRecording,
    stopRecording,
    
    inviteParticipant,
    removeParticipant,
    promoteToPresenter,
    
    sendMessage,
    
    enableTranscription,
    disableTranscription,
    enableTranslation,
    
    enableWaitingRoom,
    setCallPassword,
    
    testMediaDevices,
    getNetworkQuality,
  } = useVideoCallStore();

  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [callTitle, setCallTitle] = useState('');
  const [joinCallId, setJoinCallId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentCall && currentCall.status === 'active') {
      interval = setInterval(() => {
        setCallDuration(Date.now() - currentCall.startTime.getTime());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentCall]);

  useEffect(() => {
    // Periodic network quality check
    const qualityCheck = setInterval(() => {
      if (isConnected) {
        getNetworkQuality();
      }
    }, 10000);

    return () => clearInterval(qualityCheck);
  }, [isConnected, getNetworkQuality]);

  const handleCreateCall = async () => {
    if (!callTitle.trim()) return;
    
    try {
      await createCall(callTitle.trim());
      setCallTitle('');
    } catch (error) {
      console.error('Failed to create call:', error);
      alert('Failed to create call. Please check camera/microphone permissions.');
    }
  };

  const handleJoinCall = async () => {
    if (!joinCallId.trim()) return;
    
    try {
      await joinCall(joinCallId.trim());
      setJoinCallId('');
    } catch (error) {
      console.error('Failed to join call:', error);
      alert('Failed to join call. Please check the call ID and try again.');
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !currentCall) return;
    
    sendMessage(chatMessage.trim());
    setChatMessage('');
  };

  const handleInviteParticipant = () => {
    if (!inviteEmail.trim() || !currentCall) return;
    
    inviteParticipant(inviteEmail.trim());
    setInviteEmail('');
  };

  const copyCallId = () => {
    if (currentCall) {
      navigator.clipboard.writeText(currentCall.id);
      // Show toast notification in real app
    }
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'good':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <Wifi className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderVideoGrid = () => {
    if (!currentCall) return null;

    const activeParticipants = participants.filter(p => p.isConnected);
    const gridCols = Math.ceil(Math.sqrt(activeParticipants.length + 1)); // +1 for local video

    return (
      <div className={`grid gap-2 h-full p-4 grid-cols-${Math.min(gridCols, 4)}`}>
        {/* Local Video */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {isScreenSharing && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
              Sharing Screen
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
            You {isAudioEnabled ? '' : '(Muted)'}
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Remote Videos */}
        {activeParticipants.filter(p => p.userId !== 'current-user').map((participant) => (
          <div key={participant.userId} className="relative bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={(el) => {
                if (el) {
                  remoteVideoRefs.current.set(participant.userId, el);
                  const remoteStream = remoteStreams.get(participant.userId);
                  if (remoteStream) {
                    el.srcObject = remoteStream;
                  }
                }
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm flex items-center space-x-1">
              {participant.role === 'host' && <Crown className="h-3 w-3 text-yellow-400" />}
              <span>{participant.name} {participant.isMuted ? '(Muted)' : ''}</span>
            </div>
            {!participant.isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <VideoOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">{participant.name}</p>
                </div>
              </div>
            )}
            {participant.isScreenSharing && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                Screen Sharing
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCallLobby = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Video className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Secure Video Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            End-to-end encrypted video calls with privacy controls
          </p>
        </div>

        <div className="space-y-6">
          {/* Create Call */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Start New Call
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Call title (optional)"
                value={callTitle}
                onChange={(e) => setCallTitle(e.target.value)}
              />
              <Button
                onClick={handleCreateCall}
                className="w-full"
                disabled={isLoading}
              >
                <Video className="h-4 w-4 mr-2" />
                {isLoading ? 'Starting...' : 'Start Call'}
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {/* Join Call */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Join Existing Call
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Enter call ID"
                value={joinCallId}
                onChange={(e) => setJoinCallId(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleJoinCall}
                className="w-full"
                disabled={isLoading}
              >
                <Phone className="h-4 w-4 mr-2" />
                {isLoading ? 'Joining...' : 'Join Call'}
              </Button>
            </div>
          </div>

          {/* Recent Calls */}
          {calls.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Recent Calls
              </h3>
              <div className="space-y-2">
                {calls.slice(-3).map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {call.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {call.startTime.toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => joinCall(call.id)}
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!currentCall) {
    return renderCallLobby();
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-white">
            {currentCall.title}
          </h1>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            {getConnectionIcon()}
            <span className="capitalize">{connectionQuality}</span>
            <Clock className="h-4 w-4 ml-4" />
            <span>{formatTime(callDuration / 1000)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isRecording && (
            <div className="flex items-center space-x-1 text-red-400">
              <Circle className="h-4 w-4" />
              <span className="text-sm">Recording</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
            className="text-white hover:bg-gray-700"
          >
            <Users className="h-4 w-4" />
            <span className="ml-1">{participants.length}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="text-white hover:bg-gray-700"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-white hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {renderVideoGrid()}

          {/* Transcription Overlay */}
          {currentCall.settings.enableTranscription && transcription.length > 0 && (
            <div className="absolute bottom-20 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {transcription.slice(-3).map((trans) => (
                  <div key={trans.id} className="text-sm">
                    <span className="font-medium">{trans.speakerName}:</span> {trans.text}
                    {trans.translation && (
                      <div className="text-xs text-gray-300 mt-1">
                        🌐 {trans.translation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Participants ({participants.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3 mb-6">
              {participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      {participant.role === 'host' && (
                        <Crown className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{participant.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span className="capitalize">{participant.role}</span>
                        {participant.isMuted && <MicOff className="h-3 w-3" />}
                        {!participant.isVideoEnabled && <VideoOff className="h-3 w-3" />}
                        {participant.isScreenSharing && <Monitor className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>

                  {participant.userId !== 'current-user' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => promoteToPresenter(participant.userId)}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Promote to Presenter
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => removeParticipant(participant.userId)}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Remove Participant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>

            {/* Invite Participants */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Invite Others</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={handleInviteParticipant}
                  className="w-full"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>

              <div className="pt-3 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Call ID:</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-700 px-2 py-1 rounded text-xs text-white font-mono flex-1">
                    {currentCall.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCallId}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`${
                    message.senderId === 'current-user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-xs p-3 rounded-lg ${
                      message.senderId === 'current-user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    {message.senderId !== 'current-user' && (
                      <p className="text-xs text-gray-300 mb-1">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="flex items-center justify-center p-6 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Audio Control */}
          <Button
            variant={isAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          {/* Video Control */}
          <Button
            variant={isVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="lg"
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className="rounded-full w-12 h-12"
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          {/* Recording */}
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            className="rounded-full w-12 h-12"
          >
            {isRecording ? <Square className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={leaveCall}
            className="rounded-full w-12 h-12"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" className="rounded-full w-12 h-12">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => enableTranscription()}
                disabled={currentCall.settings.enableTranscription}
              >
                <Subtitles className="h-4 w-4 mr-2" />
                Enable Transcription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => enableTranslation('es')}>
                <Languages className="h-4 w-4 mr-2" />
                Enable Translation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => enableWaitingRoom(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Enable Waiting Room
              </DropdownMenuItem>
              {currentCall.recordingUrl && (
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download Recording
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Call Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Audio & Video</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={currentCall.settings.allowChat} />
                  <span>Allow chat messages</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={currentCall.settings.allowScreenShare} />
                  <span>Allow screen sharing</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={currentCall.settings.allowRecording} />
                  <span>Allow recording</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Security</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={currentCall.settings.requirePermissionToJoin}
                    onChange={(e) => enableWaitingRoom(e.target.checked)}
                  />
                  <span>Waiting room</span>
                </label>
                <div>
                  <label className="block text-sm mb-1">Call Password</label>
                  <Input
                    type="password"
                    placeholder="Set password"
                    className="bg-gray-700 border-gray-600"
                    onChange={(e) => setCallPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-center">Connecting to call...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallPage;