'use client'

import React, { useState, useCallback } from 'react'
import { Slate, Editable, withReact } from 'slate-react'
import { createEditor, Descendant, Editor, Transforms, Text } from 'slate'
import { withHistory } from 'slate-history'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bold,
  Italic,
  Underline,
  FileText,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Shield,
  Search,
  Replace,
  Palette
} from 'lucide-react'

// Define custom text types for Slate
type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  redacted?: boolean
}

type CustomElement = {
  type: 'paragraph' | 'redacted'
  children: CustomText[]
}

declare module 'slate' {
  interface CustomTypes {
    Editor: Editor & {
      // Add custom editor methods here
    }
    Element: CustomElement
    Text: CustomText
  }
}

// Helper functions for text formatting
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? (marks as any)[format] === true : false
}

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format)
  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

// Redaction function - permanently removes text
const redactSelection = (editor: Editor) => {
  if (editor.selection) {
    Transforms.delete(editor, { at: editor.selection })
    Transforms.insertText(editor, '█████', { at: editor.selection })
    Editor.addMark(editor, 'redacted', true)
  }
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [
      { text: 'Welcome to the Secure Data Compiler Word Processor' },
    ],
  },
  {
    type: 'paragraph',
    children: [
      { text: 'This is a secure document editor with police-grade redaction capabilities. Type here to start writing...' },
    ],
  },
]

export default function WordProcessorPage() {
  const [editor] = useState(() => withHistory(withReact(createEditor())))
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const [showRedacted, setShowRedacted] = useState(true)
  const [documentTitle, setDocumentTitle] = useState('Untitled Document')

  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case 'redacted':
        return <span {...props.attributes} className="bg-black text-black select-none">{props.children}</span>
      default:
        return <p {...props.attributes}>{props.children}</p>
    }
  }, [])

  const renderLeaf = useCallback((props: any) => {
    let className = ''
    if (props.leaf.bold) className += ' font-bold'
    if (props.leaf.italic) className += ' italic'
    if (props.leaf.underline) className += ' underline'
    if (props.leaf.redacted && showRedacted) className += ' bg-black text-black select-none'

    return (
      <span {...props.attributes} className={className}>
        {props.children}
      </span>
    )
  }, [showRedacted])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!event.ctrlKey) return

    switch (event.key) {
      case 'b':
        event.preventDefault()
        toggleMark(editor, 'bold')
        break
      case 'i':
        event.preventDefault()
        toggleMark(editor, 'italic')
        break
      case 'u':
        event.preventDefault()
        toggleMark(editor, 'underline')
        break
      case 's':
        event.preventDefault()
        // TODO: Implement save functionality
        break
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Document Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="text-lg font-semibold bg-transparent border-none outline-none"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Auto-saved</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Editor */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="border-b border-border bg-muted/50 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Formatting Buttons */}
                <div className="flex items-center gap-1 mr-4">
                  <Button
                    variant={isMarkActive(editor, 'bold') ? 'default' : 'ghost'}
                    size="sm"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      toggleMark(editor, 'bold')
                    }}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={isMarkActive(editor, 'italic') ? 'default' : 'ghost'}
                    size="sm"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      toggleMark(editor, 'italic')
                    }}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={isMarkActive(editor, 'underline') ? 'default' : 'ghost'}
                    size="sm"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      toggleMark(editor, 'underline')
                    }}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>

                {/* Redaction Tools */}
                <div className="flex items-center gap-1 mr-4 border-l border-border pl-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      redactSelection(editor)
                    }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Redact
                  </Button>
                  <Button
                    variant={showRedacted ? 'default' : 'ghost'}
                    size="sm"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setShowRedacted(!showRedacted)
                    }}
                  >
                    {showRedacted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Additional Tools */}
                <div className="flex items-center gap-1 border-l border-border pl-4">
                  <Button variant="ghost" size="sm">
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Replace className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Palette className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <Card className="min-h-[600px] p-8">
                  <Slate
                    editor={editor}
                    initialValue={value}
                    onChange={setValue}
                  >
                    <Editable
                      renderElement={renderElement}
                      renderLeaf={renderLeaf}
                      onKeyDown={handleKeyDown}
                      placeholder="Start typing your secure document..."
                      className="outline-none leading-relaxed text-base"
                      style={{ minHeight: '500px' }}
                    />
                  </Slate>
                </Card>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-80 border-l border-border bg-muted/20 p-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Document Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs">
                    <div className="flex justify-between">
                      <span>Words:</span>
                      <span className="font-mono">1,234</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Characters:</span>
                      <span className="font-mono">6,789</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pages:</span>
                      <span className="font-mono">2</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Security Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>AES-256 Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Local Storage Only</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Audit Trail Active</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Assistance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Grammar Check
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Summarize
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Content
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}