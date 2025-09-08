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
  Star
} from 'lucide-react'

const featureCards = [
  {
    title: 'Word Processor',
    description: 'Create and edit secure documents with police-grade redaction capabilities',
    icon: FileText,
    href: '/word-processor',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: ['Rich Text Editing', 'Redaction Tools', 'AI Assistance', 'Export Options']
  },
  {
    title: 'Spreadsheet Editor',
    description: 'Analyze data with powerful formulas and secure redaction features',
    icon: Table,
    href: '/spreadsheet',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    features: ['Formula Engine', 'Charts', 'Multi-sheet', 'Data Analysis']
  },
  {
    title: 'Image Editor',
    description: 'Edit images with AI-powered background removal and redaction tools',
    icon: Image,
    href: '/image-editor',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: ['AI Background Removal', 'Filters', 'Layers', 'Redaction Brush']
  },
  {
    title: 'Video Editor',
    description: 'Edit videos with frame-by-frame redaction and secure processing',
    icon: Video,
    href: '/video-editor',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    features: ['Timeline Editing', 'Frame Redaction', 'Audio Mixing', 'Effects']
  },
  {
    title: 'Creation Studio',
    description: 'Build presentations and courses with AI-powered content generation',
    icon: Presentation,
    href: '/creation-studio',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    features: ['Slide Editor', 'AI Generation', 'Templates', 'Animations']
  },
  {
    title: 'Video Chat',
    description: 'Secure video calls with live transcription and translation',
    icon: VideoIcon,
    href: '/video-chat',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    features: ['P2P Encryption', 'Live Transcription', 'Translation', 'Screen Share']
  },
  {
    title: 'Messaging',
    description: 'Encrypted messaging with AI personas and secure file transfer',
    icon: MessageSquare,
    href: '/messaging',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    features: ['End-to-End Encryption', 'AI Personas', 'File Transfer', 'Group Chat']
  },
  {
    title: 'Billing & Invoicing',
    description: 'Manage invoices and track payments with secure data handling',
    icon: Receipt,
    href: '/billing',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    features: ['Invoice Generation', 'Payment Tracking', 'Reports', 'Client Management']
  },
  {
    title: 'Contacts',
    description: 'Secure contact management with encrypted storage',
    icon: Users,
    href: '/contacts',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    features: ['Contact Database', 'Groups', 'Communication History', 'Privacy Controls']
  },
  {
    title: 'Secure Vault',
    description: 'Encrypted file storage with military-grade security',
    icon: FolderLock,
    href: '/vault',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    features: ['AES-256 Encryption', 'Local Storage', 'File Organization', 'Backup Options']
  },
  {
    title: 'Audit Trail',
    description: 'Monitor all system activities with immutable security logs',
    icon: Activity,
    href: '/audit',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    features: ['Activity Logging', 'Security Analysis', 'Compliance Reports', 'Alerts']
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
          <Clock className="w-4 h-4" />
          Recent Files
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Feature Cards Grid */}
        <div className="lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Security Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon
              return (
                <Card 
                  key={feature.href} 
                  className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  <Link href={feature.href} className="block">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${feature.bgColor}`}>
                          <Icon className={`w-5 h-5 ${feature.color}`} />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {feature.features.slice(0, 3).map((feat, index) => (
                          <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                            <Star className="w-3 h-3" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-1.5 rounded bg-muted">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.action} • {activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Encryption Status</span>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audit Trail</span>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                  Logging
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Local Storage</span>
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                  Secured
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}