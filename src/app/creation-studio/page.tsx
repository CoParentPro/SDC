'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Plus,
  Play,
  Pause,
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit3,
  Settings,
  Eye,
  Type,
  Image,
  Video,
  BarChart3,
  Square,
  Circle,
  Triangle,
  MousePointer,
  Palette,
  Layers,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Book,
  GraduationCap,
  FileText,
  PlayCircle,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { useCreationStudioStore } from '../../../stores/creation-studio-store';
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

const CreationStudioPage = () => {
  const {
    presentations,
    courses,
    currentPresentation,
    currentCourse,
    selectedSlide,
    selectedElement,
    isLoading,
    
    createPresentation,
    loadPresentation,
    savePresentation,
    deletePresentation,
    
    addSlide,
    deleteSlide,
    duplicateSlide,
    selectSlide,
    
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    
    createCourse,
    loadCourse,
    saveCourse,
    deleteCourse,
    
    addModule,
    updateModule,
    deleteModule,
    
    addLesson,
    updateLesson,
    deleteLesson,
    
    exportPresentation,
    exportCourse,
  } = useCreationStudioStore();

  const [activeTab, setActiveTab] = useState<'presentations' | 'courses'>('presentations');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'image' | 'shape'>('select');

  const canvasRef = useRef<HTMLDivElement>(null);
  const slidePreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentPresentation && currentPresentation.slides.length > 0) {
      selectSlide(currentPresentation.slides[0].id);
      setCurrentSlideIndex(0);
    }
  }, [currentPresentation, selectSlide]);

  const handleCreatePresentation = () => {
    const name = prompt('Enter presentation name:');
    if (name) {
      createPresentation(name.trim());
    }
  };

  const handleCreateCourse = () => {
    const name = prompt('Enter course name:');
    if (name) {
      const description = prompt('Enter course description:') || '';
      createCourse(name.trim(), description.trim());
    }
  };

  const handleAddElement = (type: string) => {
    if (!selectedSlide) return;
    const elementId = addElement(selectedSlide.id, type);
    selectElement(elementId);
  };

  const handleElementUpdate = (updates: any) => {
    if (!selectedSlide || !selectedElement) return;
    updateElement(selectedSlide.id, selectedElement, updates);
  };

  const handleSlideNavigation = (direction: 'prev' | 'next') => {
    if (!currentPresentation) return;
    
    const currentIndex = currentPresentation.slides.findIndex(s => s.id === selectedSlide?.id);
    let newIndex = currentIndex;
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < currentPresentation.slides.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      selectSlide(currentPresentation.slides[newIndex].id);
      setCurrentSlideIndex(newIndex);
    }
  };

  const handleExport = async (format: string) => {
    try {
      if (activeTab === 'presentations' && currentPresentation) {
        const blob = await exportPresentation(format as any);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentPresentation.name}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (activeTab === 'courses' && currentCourse) {
        const blob = await exportCourse(format as any);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentCourse.name}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderSlideCanvas = () => {
    if (!selectedSlide) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No slide selected</p>
            <p className="text-sm">Select a slide or create a new one to start editing</p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={canvasRef}
        className={`relative w-full h-full bg-white rounded-lg shadow-lg overflow-hidden ${
          showGrid ? 'bg-grid-pattern' : ''
        }`}
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          backgroundImage: selectedSlide.background.type === 'image' 
            ? `url(${selectedSlide.background.value})` 
            : undefined,
          backgroundColor: selectedSlide.background.type === 'color' 
            ? selectedSlide.background.value 
            : '#ffffff',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            selectElement(null);
          }
        }}
      >
        {selectedSlide.content.map((element) => (
          <div
            key={element.id}
            className={`absolute cursor-pointer border-2 transition-all ${
              selectedElement === element.id 
                ? 'border-blue-500 bg-blue-50 bg-opacity-20' 
                : 'border-transparent hover:border-gray-300'
            }`}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              transform: `rotate(${element.rotation}deg)`,
              opacity: element.opacity,
            }}
            onClick={(e) => {
              e.stopPropagation();
              selectElement(element.id);
            }}
          >
            {/* Render element based on type */}
            {element.type === 'text' && (
              <div
                className="w-full h-full flex items-center justify-center p-2"
                style={{
                  fontSize: element.data.fontSize || 16,
                  color: element.data.color || '#000000',
                  fontWeight: element.data.bold ? 'bold' : 'normal',
                  fontStyle: element.data.italic ? 'italic' : 'normal',
                  textDecoration: element.data.underline ? 'underline' : 'none',
                  textAlign: element.data.align || 'center',
                }}
              >
                {element.data.content || 'Text'}
              </div>
            )}
            
            {element.type === 'image' && (
              <img
                src={element.data.src || '/placeholder-image.jpg'}
                alt={element.data.alt || 'Image'}
                className="w-full h-full object-cover rounded"
                style={{ objectFit: element.data.objectFit || 'cover' }}
              />
            )}
            
            {element.type === 'video' && (
              <video
                src={element.data.src}
                controls={element.data.controls}
                autoPlay={element.data.autoplay}
                className="w-full h-full rounded"
              />
            )}
            
            {element.type === 'chart' && (
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">Chart</span>
              </div>
            )}
            
            {element.type === 'button' && (
              <button
                className="w-full h-full bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                {element.data.text || 'Button'}
              </button>
            )}

            {/* Selection handles */}
            {selectedElement === element.id && (
              <>
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"></div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPresentationView = () => (
    <div className="flex flex-col h-full">
      {/* Presentation Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentPresentation ? currentPresentation.name : 'Presentations'}
          </h2>
          {currentPresentation && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSlideNavigation('prev')}
                disabled={currentSlideIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {currentSlideIndex + 1} / {currentPresentation.slides.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSlideNavigation('next')}
                disabled={currentSlideIndex === currentPresentation.slides.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {currentPresentation && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => savePresentation()}
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
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pptx')}>
                    Export as PowerPoint
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('html')}>
                    Export as HTML
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button onClick={handleCreatePresentation}>
            <Plus className="h-4 w-4 mr-1" />
            New Presentation
          </Button>
        </div>
      </div>

      {!currentPresentation ? (
        // Presentation Gallery
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentations.map((presentation) => (
              <div
                key={presentation.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => loadPresentation(presentation.id)}
              >
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded mb-3 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  {presentation.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {presentation.slides.length} slides
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {presentation.metadata.updatedAt.toLocaleDateString()}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => loadPresentation(presentation.id)}>
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deletePresentation(presentation.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Presentation Editor
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Slides */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Slides</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSlide()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {currentPresentation.slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedSlide?.id === slide.id
                      ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => {
                    selectSlide(slide.id);
                    setCurrentSlideIndex(index);
                  }}
                >
                  <div className="aspect-video bg-white dark:bg-gray-600 rounded mb-2 flex items-center justify-center text-xs">
                    Slide {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {slide.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {slide.content.length} elements
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => duplicateSlide(slide.id)}>
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteSlide(slide.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Button
                  variant={selectedTool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTool('select')}
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedTool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedTool('text');
                    handleAddElement('text');
                  }}
                >
                  <Type className="h-4 w-4" />
                </Button>
                <Button
                  variant={selectedTool === 'image' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedTool('image');
                    handleAddElement('image');
                  }}
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddElement('video')}
                >
                  <Video className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddElement('chart')}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddElement('button')}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[50px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-900 overflow-auto">
              <div className="mx-auto" style={{ width: '800px', height: '600px' }}>
                {renderSlideCanvas()}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            {selectedElement ? (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Element Properties</h3>
                
                {/* Element-specific properties would go here */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      X Position
                    </label>
                    <Input type="number" defaultValue={0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Y Position
                    </label>
                    <Input type="number" defaultValue={0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Width
                    </label>
                    <Input type="number" defaultValue={200} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Height
                    </label>
                    <Input type="number" defaultValue={100} />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => selectedSlide && deleteElement(selectedSlide.id, selectedElement)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Element
                </Button>
              </div>
            ) : selectedSlide ? (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-white">Slide Properties</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <Input
                    value={selectedSlide.title}
                    onChange={(e) => {
                      // Update slide title
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Background
                  </label>
                  <div className="space-y-2">
                    <input
                      type="color"
                      value={selectedSlide.background.value}
                      onChange={(e) => {
                        // Update background color
                      }}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                    <Button variant="outline" size="sm" className="w-full">
                      <Image className="h-4 w-4 mr-1" />
                      Upload Image
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Speaker Notes
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    value={selectedSlide.notes}
                    onChange={(e) => {
                      // Update slide notes
                    }}
                    placeholder="Add speaker notes..."
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select an element or slide to edit properties</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderCourseView = () => (
    <div className="flex flex-col h-full">
      {/* Course Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentCourse ? currentCourse.name : 'Courses'}
        </h2>
        
        <div className="flex items-center space-x-2">
          {currentCourse && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveCourse()}
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
                  <DropdownMenuItem onClick={() => handleExport('scorm')}>
                    Export as SCORM
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('html')}>
                    Export as HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('zip')}>
                    Export as ZIP
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button onClick={handleCreateCourse}>
            <Plus className="h-4 w-4 mr-1" />
            New Course
          </Button>
        </div>
      </div>

      {!currentCourse ? (
        // Course Gallery
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => loadCourse(course.id)}
              >
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 rounded mb-3 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  {course.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {course.modules.length} modules
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => loadCourse(course.id)}>
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deleteCourse(course.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Course Editor
        <div className="flex flex-1 overflow-hidden">
          {/* Course Structure */}
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Course Structure</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const title = prompt('Module title:');
                  if (title) addModule(title);
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {currentCourse.modules.map((module, moduleIndex) => (
                <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {module.title}
                    </h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => {
                          const title = prompt('Lesson title:');
                          if (title) addLesson(module.id, { title, type: 'text', content: '', duration: 0, order: module.lessons.length });
                        }}>
                          Add Lesson
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const title = prompt('Assessment title:');
                          if (title) addAssessment(module.id, { title, type: 'quiz' });
                        }}>
                          Add Assessment
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteModule(module.id)}
                        >
                          Delete Module
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-1 ml-4">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <PlayCircle className="h-3 w-3" />
                        <span>{lesson.title}</span>
                        <span className="text-xs text-gray-400">({lesson.duration}m)</span>
                      </div>
                    ))}
                    {module.assessments.map((assessment) => (
                      <div key={assessment.id} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Award className="h-3 w-3" />
                        <span>{assessment.title}</span>
                        <span className="text-xs text-gray-400">({assessment.questions.length} questions)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Course Content Editor */}
          <div className="flex-1 p-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Course Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course Name
                  </label>
                  <Input
                    value={currentCourse.name}
                    onChange={(e) => {
                      // Update course name
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                    value={currentCourse.description}
                    onChange={(e) => {
                      // Update course description
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentCourse.settings.isPublic}
                        onChange={(e) => {
                          // Update public setting
                        }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Public Course</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentCourse.settings.certificate}
                        onChange={(e) => {
                          // Update certificate setting
                        }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Award Certificate</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentCourse.settings.trackProgress}
                        onChange={(e) => {
                          // Update progress tracking
                        }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Track Progress</span>
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={currentCourse.settings.allowDiscussions}
                        onChange={(e) => {
                          // Update discussions setting
                        }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Allow Discussions</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Creation Studio
        </h1>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="presentations" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Presentations</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Courses</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-73px)]">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="presentations" className="h-full m-0">
            {renderPresentationView()}
          </TabsContent>
          <TabsContent value="courses" className="h-full m-0">
            {renderCourseView()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-center text-gray-900 dark:text-white">
              {activeTab === 'presentations' ? 'Processing presentation...' : 'Processing course...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreationStudioPage;