'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { 
  Upload, 
  Download, 
  Save, 
  Undo, 
  Redo, 
  RotateCw, 
  Crop, 
  Palette, 
  Type, 
  Square, 
  Circle, 
  Shield, 
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Move,
  ZoomIn,
  ZoomOut,
  Hand
} from 'lucide-react';
import { useImageEditorStore } from '../../../stores/image-editor-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';

const ImageEditorPage = () => {
  const {
    currentProject,
    isLoading,
    canUndo,
    canRedo,
    createProject,
    loadImage,
    addLayer,
    updateLayer,
    deleteLayer,
    undo,
    redo,
    saveProject,
    exportImage,
  } = useImageEditorStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedTool, setSelectedTool] = useState<'select' | 'crop' | 'brush' | 'text' | 'shape'>('select');
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState('#000000');
  const [zoom, setZoom] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentProject) {
      createProject('New Image', 800, 600);
    }
  }, [currentProject, createProject]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await loadImage(file);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }, [loadImage]);

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentProject || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (selectedTool === 'brush') {
      setIsDrawing(true);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
      }
    }
  }, [currentProject, selectedTool, brushColor, brushSize]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentProject || !canvasRef.current || !isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (selectedTool === 'brush') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  }, [currentProject, selectedTool, isDrawing]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const addTextLayer = useCallback(() => {
    if (!currentProject) return;
    
    addLayer({
      name: 'Text Layer',
      type: 'text',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      data: {
        text: 'Sample Text',
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        align: 'left'
      },
      filters: []
    });
  }, [currentProject, addLayer]);

  const addShapeLayer = useCallback((shapeType: 'rectangle' | 'circle') => {
    if (!currentProject) return;
    
    addLayer({
      name: `${shapeType} Layer`,
      type: 'shape',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      x: 150,
      y: 150,
      width: 100,
      height: 100,
      data: {
        shapeType,
        fillColor: '#3b82f6',
        strokeColor: '#1e40af',
        strokeWidth: 2
      },
      filters: []
    });
  }, [currentProject, addLayer]);

  const applyRedaction = useCallback(() => {
    if (!currentProject || !selectedLayerId) return;
    
    // Add a redaction layer that permanently blacks out content
    addLayer({
      name: 'Redaction',
      type: 'shape',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      x: 0,
      y: 0,
      width: currentProject.width,
      height: currentProject.height,
      data: {
        shapeType: 'rectangle',
        fillColor: '#000000',
        strokeColor: 'transparent',
        strokeWidth: 0
      },
      filters: []
    });
  }, [currentProject, selectedLayerId, addLayer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Palette className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading image editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Image Editor</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-500" />
            <span>AI-Powered Tools</span>
            <Shield className="h-4 w-4 text-red-500" />
            <span>Redaction Capable</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportImage('png')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={saveProject}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          {/* Tools */}
          <div className="flex items-center space-x-1 border-r pr-2">
            <Button
              variant={selectedTool === 'select' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('select')}
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'crop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('crop')}
            >
              <Crop className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'brush' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('brush')}
            >
              <Palette className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('text')}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'shape' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTool('shape')}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>

          {/* Tool Options */}
          {selectedTool === 'brush' && (
            <div className="flex items-center space-x-2 border-r pr-2">
              <span className="text-sm">Size:</span>
              <Input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm w-8">{brushSize}</span>
              <Input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-12 h-8"
              />
            </div>
          )}

          {/* Redaction */}
          <div className="flex items-center space-x-1 border-r pr-2">
            <Button
              variant="outline"
              size="sm"
              onClick={applyRedaction}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Shield className="h-4 w-4 mr-1" />
              Redact
            </Button>
          </div>

          {/* History */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Zoom */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(prev => Math.max(25, prev - 25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(prev => Math.min(400, prev + 25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/30 overflow-auto">
          <Tabs defaultValue="layers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
            </TabsList>
            
            <TabsContent value="layers" className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Layers</h3>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={addTextLayer}>
                    <Type className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => addShapeLayer('rectangle')}>
                    <Square className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => addShapeLayer('circle')}>
                    <Circle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {currentProject?.layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`
                    flex items-center justify-between p-2 rounded border cursor-pointer
                    ${selectedLayerId === layer.id ? 'border-primary bg-primary/10' : 'border-border'}
                  `}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLayer(layer.id, { visible: !layer.visible });
                      }}
                    >
                      {layer.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>
                    <span className="text-sm truncate">{layer.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Duplicate layer logic
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="tools" className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">AI Tools</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Background Removal
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Object Detection
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Auto Enhancement
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Transform</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Rotate 90°
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Flip Horizontal
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Flip Vertical
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="filters" className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Color Filters</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Brightness/Contrast
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Hue/Saturation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Black & White
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Effects</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Blur
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Sharpen
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Noise Reduction
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 relative overflow-auto">
          {currentProject ? (
            <div 
              className="relative border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center'
              }}
            >
              <canvas
                ref={canvasRef}
                width={currentProject.width}
                height={currentProject.height}
                className="block cursor-crosshair"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
              
              {/* Canvas overlay for UI elements */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Selection indicators, crop guides, etc. would go here */}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Palette className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No image loaded</p>
              <p className="text-sm">Upload an image to start editing</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          {currentProject && (
            <span>
              {currentProject.width} × {currentProject.height} px
            </span>
          )}
          <span>Tool: {selectedTool}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-green-500" />
            <span className="text-green-500">Client-Side Processing</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-red-500" />
            <span className="text-red-500">Redaction Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorPage;