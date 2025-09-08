'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  StickyNote,
  Plus,
  Search,
  Filter,
  Palette,
  Pin,
  Trash2,
  Edit,
  Calendar,
  Tag,
  Archive,
  Star,
  Copy,
  Share
} from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  color: string
  category: string
  isPinned: boolean
  isStarred: boolean
  created: string
  updated: string
  tags: string[]
  reminder?: string
}

export default function StickyNotesPage() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Meeting Notes',
      content: 'Discussed project timeline and deliverables. Need to follow up with client by Friday.',
      color: 'yellow',
      category: 'work',
      isPinned: true,
      isStarred: false,
      created: '2024-01-15T10:30:00',
      updated: '2024-01-15T14:20:00',
      tags: ['meeting', 'client', 'urgent'],
      reminder: '2024-01-19T09:00:00'
    },
    {
      id: '2',
      title: 'Shopping List',
      content: '• Milk\n• Bread\n• Eggs\n• Coffee\n• Apples',
      color: 'green',
      category: 'personal',
      isPinned: false,
      isStarred: true,
      created: '2024-01-14T16:45:00',
      updated: '2024-01-15T08:15:00',
      tags: ['shopping', 'groceries']
    },
    {
      id: '3',
      title: 'Book Recommendations',
      content: 'Books to read:\n- The Clean Code\n- Design Patterns\n- Atomic Habits\n- Deep Work',
      color: 'blue',
      category: 'learning',
      isPinned: false,
      isStarred: false,
      created: '2024-01-13T20:00:00',
      updated: '2024-01-13T20:00:00',
      tags: ['books', 'learning', 'development']
    },
    {
      id: '4',
      title: 'Weekend Plans',
      content: 'Saturday: Visit the museum, lunch with family\nSunday: Hiking, grocery shopping',
      color: 'pink',
      category: 'personal',
      isPinned: false,
      isStarred: false,
      created: '2024-01-12T19:30:00',
      updated: '2024-01-14T10:00:00',
      tags: ['weekend', 'family', 'activities']
    },
    {
      id: '5',
      title: 'Code Snippets',
      content: 'Useful React hooks:\nuseEffect, useState, useCallback, useMemo, useContext',
      color: 'purple',
      category: 'work',
      isPinned: true,
      isStarred: true,
      created: '2024-01-11T14:15:00',
      updated: '2024-01-15T11:30:00',
      tags: ['code', 'react', 'development']
    },
    {
      id: '6',
      title: 'Ideas',
      content: 'App ideas:\n- Habit tracker\n- Expense manager\n- Recipe organizer\n- Workout planner',
      color: 'orange',
      category: 'ideas',
      isPinned: false,
      isStarred: false,
      created: '2024-01-10T22:00:00',
      updated: '2024-01-12T15:45:00',
      tags: ['ideas', 'apps', 'projects']
    }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)

  const colorOptions = [
    { name: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' },
    { name: 'green', bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' },
    { name: 'blue', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' },
    { name: 'pink', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-800' },
    { name: 'purple', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-800' },
    { name: 'orange', bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-800' }
  ]

  const categories = ['all', 'work', 'personal', 'learning', 'ideas']

  const getColorClasses = (color: string) => {
    const colorConfig = colorOptions.find(c => c.name === color)
    return colorConfig || colorOptions[0]
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const pinnedNotes = filteredNotes.filter(note => note.isPinned)
  const unpinnedNotes = filteredNotes.filter(note => !note.isPinned)

  const togglePin = (noteId: string) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    ))
  }

  const toggleStar = (noteId: string) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, isStarred: !note.isStarred } : note
    ))
  }

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId))
  }

  const duplicateNote = (noteId: string) => {
    const originalNote = notes.find(note => note.id === noteId)
    if (originalNote) {
      const newNote: Note = {
        ...originalNote,
        id: Date.now().toString(),
        title: `${originalNote.title} (Copy)`,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        isPinned: false
      }
      setNotes([newNote, ...notes])
    }
  }

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      color: 'yellow',
      category: 'personal',
      isPinned: false,
      isStarred: false,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: []
    }
    setNotes([newNote, ...notes])
    setEditingNote(newNote.id)
  }

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setNotes(notes.map(note => 
      note.id === noteId 
        ? { ...note, ...updates, updated: new Date().toISOString() }
        : note
    ))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderNote = (note: Note) => {
    const colorClasses = getColorClasses(note.color)
    const isEditing = editingNote === note.id

    return (
      <Card 
        key={note.id} 
        className={`relative group transition-all duration-200 hover:shadow-md cursor-pointer transform hover:-translate-y-1 ${colorClasses.bg} ${colorClasses.border} border-2`}
      >
        {isEditing ? (
          <div className="p-4 space-y-3">
            <Input
              value={note.title}
              onChange={(e) => updateNote(note.id, { title: e.target.value })}
              className="font-medium bg-transparent border-none p-0 focus:ring-0"
              placeholder="Note title..."
            />
            <Textarea
              value={note.content}
              onChange={(e) => updateNote(note.id, { content: e.target.value })}
              className="bg-transparent border-none p-0 resize-none focus:ring-0"
              placeholder="Write your note here..."
              rows={4}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    className={`w-6 h-6 rounded-full border-2 ${color.bg} ${color.border} ${
                      note.color === color.name ? 'ring-2 ring-gray-400' : ''
                    }`}
                    onClick={() => updateNote(note.id, { color: color.name })}
                  />
                ))}
              </div>
              <Button 
                size="sm" 
                onClick={() => setEditingNote(null)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <CardContent className="p-4">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePin(note.id)
                    }}
                  >
                    <Pin className={`w-3 h-3 ${note.isPinned ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStar(note.id)
                    }}
                  >
                    <Star className={`w-3 h-3 ${note.isStarred ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>

              <div onClick={() => setEditingNote(note.id)}>
                <h3 className={`font-semibold mb-2 pr-16 ${colorClasses.text}`}>
                  {note.title}
                </h3>
                <p className={`text-sm whitespace-pre-wrap mb-3 ${colorClasses.text} opacity-80`}>
                  {note.content.substring(0, 150)}
                  {note.content.length > 150 ? '...' : ''}
                </p>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-xs px-1 py-0"
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs opacity-60">
                  <span>{formatDate(note.updated)}</span>
                  <div className="flex items-center gap-2">
                    {note.reminder && (
                      <Calendar className="w-3 h-3" />
                    )}
                    <Badge variant="outline" className="text-xs">
                      {note.category}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateNote(note.id)
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNote(note.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sticky Notes</h1>
          <p className="text-muted-foreground">
            Click + to add a note
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button size="sm" onClick={createNewNote}>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{notes.length}</div>
            <p className="text-xs text-muted-foreground">Total Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{notes.filter(n => n.isPinned).length}</div>
            <p className="text-xs text-muted-foreground">Pinned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{notes.filter(n => n.isStarred).length}</div>
            <p className="text-xs text-muted-foreground">Starred</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{notes.filter(n => n.reminder).length}</div>
            <p className="text-xs text-muted-foreground">With Reminders</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes Grid */}
      <div className="space-y-6">
        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Pin className="w-4 h-4" />
              <h2 className="text-lg font-semibold">Pinned</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pinnedNotes.map(renderNote)}
            </div>
          </div>
        )}

        {/* Regular Notes */}
        {unpinnedNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h2 className="text-lg font-semibold mb-4">Other Notes</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {unpinnedNotes.map(renderNote)}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No notes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first note to get started'
                }
              </p>
              <Button onClick={createNewNote}>
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}