'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Slider } from '../../../components/ui/slider';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Download,
  Scissors,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Filter,
  Settings,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Crop,
  Plus
} from 'lucide-react';
import { useVideoEditorStore } from '../../../stores/video-editor-store';
import { formatTime } from '../../../utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';

const VideoEditorPage = () => {
  const {
    project,
    timeline,
    currentTime,
    isPlaying,
    selectedClip,
    zoomLevel,
    isLoading,
    
    loadProject,
    createProject,
    saveProject,
    
    importVideo,
    addClip,
    removeClip,
    splitClip,
    trimClip,
    
    play,
    pause,
    stop,
    seekTo,
    
    addEffect,
    removeEffect,
    addRedactionMask,
    removeRedactionMask,
    
    exportVideo,
  } = useVideoEditorStore();

  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [showRedactionTool, setShowRedactionTool] = useState(false);
  const [previewQuality, setPreviewQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [exportFormat, setExportFormat] = useState<'mp4' | 'avi' | 'mov' | 'webm'>('mp4');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize a default project
    if (!project) {
      createProject('Untitled Video Project');
    }
  }, [project, createProject]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        await importVideo(file);
      }
    }
    event.target.value = '';
  };

  const handleTimelineClick = (event: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || !project) return;

    const x = event.clientX - rect.left;
    const timelineWidth = rect.width;
    const newTime = (x / timelineWidth) * project.duration;
    
    seekTo(newTime);
  };

  const handleRedactionDraw = (event: React.MouseEvent) => {
    if (!showRedactionTool || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Add redaction mask (simplified for demo)
    if (selectedClip) {
      addRedactionMask(selectedClip.id, {
        id: `mask_${Date.now()}`,
        x,
        y,
        width: 10,
        height: 10,
        startFrame: Math.floor(currentTime * 30), // 30 FPS
        endFrame: Math.floor((currentTime + 1) * 30),
        type: 'blur',
      });
    }
  };

  const renderTimeline = () => {
    if (!timeline || timeline.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Import video files to start editing
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {timeline.map((track) => (
          <div
            key={track.id}
            className={`relative h-16 bg-gray-100 dark:bg-gray-800 rounded border-2 transition-colors ${
              selectedTrack === track.id ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => setSelectedTrack(track.id)}
          >
            <div className="flex items-center h-full px-3">
              <div className="flex items-center space-x-2 w-32">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {/* Toggle track visibility */}}
                >
                  {track.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {/* Toggle track mute */}}
                >
                  {track.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <span className="text-sm font-medium truncate">{track.name}</span>
              </div>
              
              <div className="flex-1 relative">
                {track.clips.map((clip) => {
                  const startPercent = (clip.startTime / (project?.duration || 1)) * 100;
                  const widthPercent = (clip.duration / (project?.duration || 1)) * 100;
                  
                  return (
                    <div
                      key={clip.id}
                      className={`absolute h-12 bg-blue-500 rounded cursor-pointer transition-colors ${
                        selectedClip?.id === clip.id ? 'ring-2 ring-blue-300' : ''
                      }`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Select clip logic would go here
                      }}
                    >
                      <div className="p-1 text-xs text-white truncate">
                        {clip.name}
                      </div>
                      {clip.redactionMasks.length > 0 && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Video Editor
          </h1>
          {project && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {project.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Undo */}}
            disabled={/* No undo history */false}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Redo */}}
            disabled={/* No redo history */false}
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveProject()}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportVideo('mp4', 'high')}>
                Export as MP4 (High Quality)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportVideo('mp4', 'medium')}>
                Export as MP4 (Medium Quality)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportVideo('webm', 'high')}>
                Export as WebM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportVideo('avi', 'high')}>
                Export as AVI
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Import Media</h3>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('video-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Video/Audio
              </Button>
              <input
                id="video-upload"
                type="file"
                multiple
                accept="video/*,audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Editing Tools</h3>
              <div className="space-y-2">
                <Button
                  variant={showRedactionTool ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowRedactionTool(!showRedactionTool)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Redaction Tool
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {/* Split clip */}}
                  disabled={!selectedClip}
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Split Clip
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {/* Copy clip */}}
                  disabled={!selectedClip}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Clip
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {/* Crop video */}}
                  disabled={!selectedClip}
                >
                  <Crop className="h-4 w-4 mr-2" />
                  Crop Video
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Effects</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {/* Add filter */}}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {/* Add transition */}}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Transitions
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Preview Quality</h3>
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={previewQuality}
                onChange={(e) => setPreviewQuality(e.target.value as any)}
              >
                <option value="low">Low (360p)</option>
                <option value="medium">Medium (720p)</option>
                <option value="high">High (1080p)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Preview */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <div className="relative">
              <video
                ref={videoRef}
                className="max-w-full max-h-full"
                controls={false}
                onTimeUpdate={(e) => {
                  const video = e.target as HTMLVideoElement;
                  // Update current time in store
                }}
              />
              
              {/* Redaction Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 ${showRedactionTool ? 'cursor-crosshair' : 'pointer-events-none'}`}
                onClick={handleRedactionDraw}
                style={{ 
                  width: '100%', 
                  height: '100%',
                  display: showRedactionTool ? 'block' : 'none'
                }}
              />
              
              {/* Preview Controls Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-white hover:bg-white hover:bg-opacity-20"
                    onClick={() => isPlaying ? pause() : play()}
                  >
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* No video message */}
            {!project?.hasMedia && (
              <div className="text-center text-gray-400">
                <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No video loaded</p>
                <p className="text-sm">Import video files to start editing</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => play()}
                disabled={!project?.hasMedia}
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pause()}
                disabled={!project?.hasMedia}
              >
                <Pause className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => stop()}
                disabled={!project?.hasMedia}
              >
                <Square className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => seekTo(Math.max(0, currentTime - 1))}
                disabled={!project?.hasMedia}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => seekTo(currentTime + 1)}
                disabled={!project?.hasMedia}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px]">
                  {formatTime(currentTime)}
                </span>
                <span className="text-gray-400">/</span>
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[60px]">
                  {formatTime(project?.duration || 0)}
                </span>
              </div>
              
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  max={project?.duration || 100}
                  step={0.1}
                  onValueChange={([value]) => seekTo(value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Zoom out */}}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[40px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Zoom in */}}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Timeline</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Add video track */}}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Video Track
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Add audio track */}}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Audio Track
                </Button>
              </div>
            </div>
            
            <div
              ref={timelineRef}
              className="relative cursor-pointer"
              onClick={handleTimelineClick}
            >
              {renderTimeline()}
              
              {/* Playhead */}
              {project && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
                  style={{
                    left: `${(currentTime / project.duration) * 100}%`,
                  }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Project Info</h3>
              {project && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatTime(project.duration)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {project.resolution || '1920x1080'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">FPS:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {project.fps || 30}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {selectedClip && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Clip Properties</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Volume
                    </label>
                    <Slider
                      value={[selectedClip.volume]}
                      max={200}
                      step={1}
                      onValueChange={([value]) => {
                        // Update clip volume
                      }}
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {selectedClip.volume}%
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Trim Start
                    </label>
                    <Input
                      type="number"
                      value={selectedClip.trimStart}
                      onChange={(e) => {
                        // Update trim start
                      }}
                      step={0.1}
                      min={0}
                      max={selectedClip.duration}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Trim End
                    </label>
                    <Input
                      type="number"
                      value={selectedClip.trimEnd}
                      onChange={(e) => {
                        // Update trim end
                      }}
                      step={0.1}
                      min={0}
                      max={selectedClip.duration}
                    />
                  </div>

                  {selectedClip.redactionMasks.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Redaction Masks
                      </label>
                      <div className="space-y-1">
                        {selectedClip.redactionMasks.map((mask) => (
                          <div
                            key={mask.id}
                            className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
                          >
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {mask.type} mask
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRedactionMask(selectedClip.id, mask.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Export Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Format
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                  >
                    <option value="mp4">MP4</option>
                    <option value="avi">AVI</option>
                    <option value="mov">MOV</option>
                    <option value="webm">WebM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-center text-gray-900 dark:text-white">Processing video...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoEditorPage;