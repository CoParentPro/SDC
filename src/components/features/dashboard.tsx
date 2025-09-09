'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Table,
  Image,
  Video,
  Presentation,
  VideoIcon,
  MessageSquare,
  Receipt,
  Users,
  FolderLock,
  Activity,
  Plus,
  ArrowRight,
  Clock,
  Star,
  Phone,
  QrCode,
  AlertTriangle,
  Calendar,
  StickyNote,
  BookOpen
} from 'lucide-react'

const featureCards = [
  // CORE PRODUCTIVITY APPLICATIONS
  {
    title: 'Word Processor',
    description: 'Create and edit documents with redaction.',
    icon: FileText,
    href: '/word-processor',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    features: ['Rich Text Editing', 'Redaction Tools', 'AI Assistance']
  },
  {
    title: 'Spreadsheet Editor',
    description: 'Manage data in spreadsheets with redaction.',
    icon: Table,
    href: '/spreadsheet',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    features: ['Formula Engine', 'Charts', 'Multi-sheet']
  },
  {
    title: 'Image Editor',
    description: 'Edit images with background removal and redaction.',
    icon: Image,
    href: '/image-editor',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    features: ['Background Removal', 'Redaction', 'Basic Editing']
  },
  {
    title: 'Video Editor',
    description: 'Securely edit and redact video files.',
    icon: Video,
    href: '/video-editor',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    features: ['Video Editing', 'Audio Redaction', 'Export Tools']
  },
  {
    title: 'Creation Studio',
    description: 'Build courses, presentations, and creative content.',
    icon: Presentation,
    href: '/creation-studio',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    features: ['Slide Editor', 'AI Generation', 'Templates']
  },

  // COMMUNICATION & COLLABORATION
  {
    title: 'Video Chat',
    description: 'Use video calls with transcription & translation.',
    icon: VideoIcon,
    href: '/video-chat',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    features: ['P2P Encryption', 'Live Transcription', 'Translation']
  },
  {
    title: 'Messaging',
    description: 'Chat with encrypted and human contacts.',
    icon: MessageSquare,
    href: '/messaging',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    features: ['End-to-End Encryption', 'AI Personas', 'File Transfer']
  },
  {
    title: 'Contacts',
    description: 'Manage contacts and various calls.',
    icon: Users,
    href: '/contacts',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    features: ['Contact Database', 'Groups', 'Communication History']
  },
  {
    title: 'Callbox',
    description: 'Communication management for internal use.',
    icon: Phone,
    href: '/callbox',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    features: ['Call Management', 'Recording', 'Analytics']
  },

  // SECURITY & COMPLIANCE
  {
    title: 'Secure Vault',
    description: 'An encrypted vault for all of your sensitive data.',
    icon: FolderLock,
    href: '/vault',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    features: ['AES-256 Encryption', 'Local Storage', 'File Organization']
  },
  {
    title: 'Audit Trail',
    description: 'View a complete, immutable log of all system actions.',
    icon: Activity,
    href: '/audit',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    features: ['Activity Logging', 'Security Analysis', 'Compliance Reports']
  },
  {
    title: 'Conflict Check',
    description: 'Verify potential connections of interest across your data.',
    icon: AlertTriangle,
    href: '/conflict-check',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    features: ['Conflict Detection', 'Data Analysis', 'Verification']
  },

  // BUSINESS MANAGEMENT
  {
    title: 'Billing & Invoicing',
    description: 'Track invoices and generate invoices.',
    icon: Receipt,
    href: '/billing',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    features: ['Invoice Generation', 'Payment Tracking', 'Reports']
  },
  {
    title: 'Calendar',
    description: 'Your scheduling system and scheduling.',
    icon: Calendar,
    href: '/calendar',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    features: ['Event Scheduling', 'Reminders', 'Integration']
  },

  // UTILITIES & TOOLS
  {
    title: 'QR Generator',
    description: 'Generate design dynamic QR codes.',
    icon: QrCode,
    href: '/qr-generator',
    color: 'text-lime-400',
    bgColor: 'bg-lime-500/10',
    features: ['Dynamic QR', 'Analytics', 'Customization']
  },
  {
    title: 'SDC Reader',
    description: 'Read and analyze Secure Documents Container Files.',
    icon: BookOpen,
    href: '/sdc-reader',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    features: ['Document Reading', 'Analysis', 'Security Verification']
  },
  {
    title: 'Sticky Notes',
    description: 'Quick notes and reminders.',
    icon: StickyNote,
    href: '/sticky-notes',
    color: 'text-stone-400',
    bgColor: 'bg-stone-500/10',
    features: ['Quick Notes', 'Organization', 'Reminders']
  }
]

const recentActivity = [
  { title: 'Project Report.docx', action: 'Edited', time: '2 minutes ago', icon: FileText },
  { title: 'Budget Analysis.xlsx', action: 'Created', time: '1 hour ago', icon: Table },
  { title: 'Marketing Image.png', action: 'Redacted', time: '3 hours ago', icon: Image },
  { title: 'Video Call with Team', action: 'Completed', time: '1 day ago', icon: VideoIcon },
]

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to SDC</h1>
        <p className="text-muted-foreground">
          Your secure, offline-first workspace for data management and productivity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Document
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <FolderLock className="w-4 h-4" />
          Open Vault
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          View Audit
        </Button>
      </div>

      {/* Featured Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {featureCards.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <Link key={index} href={feature.href}>
              <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {feature.features.map((featureItem, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                        <span>{featureItem}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest actions and file changes
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const IconComponent = activity.icon
              return (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-background">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">
              +12 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-emerald-400" />
              Vault Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              All securely encrypted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              Security Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No threats detected
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}