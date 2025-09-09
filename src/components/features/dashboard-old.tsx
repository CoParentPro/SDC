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
  Nfc,
  Monitor,
  Shield,
  Cog,
  Focus,
  Database,
  Bot,
  Eye,
  Scissors,
  AlertTriangle,
  BarChart3,
  Calendar,
  StickyNote,
  BookOpen,
  Layout,
  UserPlus,
  LinkIcon,
  CheckCircle,
  Bell,
  Settings,
  FileSearch,
  Zap,
  Globe,
  Smartphone,
  Wifi,
  Radio,
  Tv,
  Camera,
  Printer,
  HardDrive,
  Cloud,
  Lock,
  Key,
  Search,
  Filter,
  Target,
  Briefcase,
  Archive,
  Download,
  Upload,
  Share,
  Copy,
  Move,
  Trash,
  RefreshCw,
  Save,
  Edit,
  PlusCircle,
  MinusCircle,
  PlayCircle,
  StopCircle,
  PauseCircle
} from 'lucide-react'

const featureCards = [
  // EXISTING CORE APPLICATIONS
  {
    title: 'Word Processor',
    description: 'Create and edit documents with redaction.',
    icon: FileText,
    href: '/word-processor',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Rich Text Editing', 'Redaction Tools', 'AI Assistance']
  },
  {
    title: 'Spreadsheet Editor',
    description: 'Manage data in spreadsheets with redaction.',
    icon: Table,
    href: '/spreadsheet',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Formula Engine', 'Charts', 'Multi-sheet']
  },
  {
    title: 'Image Editor',
    description: 'Edit images with background removal and redaction.',
    icon: Image,
    href: '/image-editor',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['AI Background Removal', 'Filters', 'Layers']
  },
  {
    title: 'Video Editor',
    description: 'Securely edit and redact video files.',
    icon: Video,
    href: '/video-editor',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Timeline Editing', 'Frame Redaction', 'Audio Mixing']
  },
  {
    title: 'Creation Studio',
    description: 'Build courses, presentations and creative content.',
    icon: Presentation,
    href: '/creation-studio',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Slide Editor', 'AI Generation', 'Templates']
  },
  {
    title: 'Video Chat',
    description: 'Use video calls with transcription & translation.',
    icon: VideoIcon,
    href: '/video-chat',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['P2P Encryption', 'Live Transcription', 'Translation']
  },
  {
    title: 'Messaging',
    description: 'Chat with encrypted and human contacts.',
    icon: MessageSquare,
    href: '/messaging',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['End-to-End Encryption', 'AI Personas', 'File Transfer']
  },
  {
    title: 'Billing & Invoicing',
    description: 'Track invoices and generate invoices.',
    icon: Receipt,
    href: '/billing',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Invoice Generation', 'Payment Tracking', 'Reports']
  },
  {
    title: 'Contacts',
    description: 'Manage contacts and various calls.',
    icon: Users,
    href: '/contacts',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Contact Database', 'Groups', 'Communication History']
  },
  {
    title: 'Secure Vault',
    description: 'An encrypted vault for all of your sensitive data.',
    icon: FolderLock,
    href: '/vault',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['AES-256 Encryption', 'Local Storage', 'File Organization']
  },
  {
    title: 'Audit Trail',
    description: 'View a complete, immutable log of all system actions.',
    icon: Activity,
    href: '/audit',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Activity Logging', 'Security Analysis', 'Compliance Reports']
  },

  // NEW PROFESSIONAL APPLICATIONS
  {
    title: 'Callbox',
    description: 'Communication management for internal use.',
    icon: Phone,
    href: '/callbox',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Call Management', 'Recording', 'Analytics']
  },
  {
    title: 'QR DevStudio Generator',
    description: 'Generate design dynamic QR codes.',
    icon: QrCode,
    href: '/qr-generator',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Dynamic QR', 'Analytics', 'Customization']
  },
  {
    title: 'NFC Wizard',
    description: 'Contactless NFC protocol handling secure proximity.',
    icon: Nfc,
    href: '/nfc-wizard',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['NFC Programming', 'Data Transfer', 'Security']
  },
  {
    title: 'DisplayLive',
    description: 'Source Digital Signage & Content Deployment.',
    icon: Monitor,
    href: '/display-live',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Digital Signage', 'Content Management', 'Live Updates']
  },
  {
    title: 'CompliCert',
    description: 'Secure messaging & Collaboration Drafting.',
    icon: Shield,
    href: '/compli-cert',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Compliance Tracking', 'Certification', 'Reporting']
  },
  {
    title: 'OptCore',
    description: 'A asset Operations Platform.',
    icon: Cog,
    href: '/opt-core',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Asset Management', 'Operations', 'Optimization']
  },
  {
    title: 'DocFocus',
    description: 'Apply digital signatures, cryptographic signatures.',
    icon: Focus,
    href: '/doc-focus',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Digital Signatures', 'Document Focus', 'Security']
  },
  {
    title: 'CallerFacts',
    description: 'Information gathering and contact handling secure proximity authentication, data intake and smart.',
    icon: Database,
    href: '/caller-facts',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Caller Information', 'Verification', 'Data Analysis']
  },
  {
    title: 'DialInGPT',
    description: 'Connect with AI without any assistance.',
    icon: Bot,
    href: '/dial-in-gpt',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['AI Assistant', 'Voice Commands', 'Natural Language']
  },
  {
    title: 'SDC Viewer',
    description: 'View and Verify Secure Documents Container Files.',
    icon: Eye,
    href: '/sdc-viewer',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Document Viewing', 'Verification', 'Security']
  },
  {
    title: 'ClearFab',
    description: 'A robust Data Operations Platform.',
    icon: Scissors,
    href: '/clear-fab',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Data Clearing', 'Fabrication', 'Processing']
  },
  {
    title: 'Conflict Check',
    description: 'Verify potential conflicts of interest across your data.',
    icon: AlertTriangle,
    href: '/conflict-check',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Conflict Detection', 'Analysis', 'Reporting']
  },
  {
    title: 'Transparency',
    description: 'Transparency with arbitrary scoring.',
    icon: BarChart3,
    href: '/transparency',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Transparency Tracking', 'Scoring', 'Analytics']
  },
  {
    title: 'Calendar',
    description: 'Your scheduling system and scheduling.',
    icon: Calendar,
    href: '/calendar',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Event Scheduling', 'Reminders', 'Integration']
  },
  {
    title: 'Sticky Notes',
    description: 'Click to add a note.',
    icon: StickyNote,
    href: '/sticky-notes',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Quick Notes', 'Organization', 'Reminders']
  },
  {
    title: 'Lexicographic',
    description: 'Language & Reconciliation Engine.',
    icon: BookOpen,
    href: '/lexicographic',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Language Processing', 'Documentation', 'Translation']
  },
  {
    title: 'DisplayLab',
    description: 'Display Language & Content Deployment.',
    icon: Layout,
    href: '/display-lab',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Content Display', 'Layout Design', 'Deployment']
  },
  {
    title: 'CollabMgr',
    description: 'Collaboration & Collaboration Drafting.',
    icon: UserPlus,
    href: '/collab-mgr',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Team Collaboration', 'Project Management', 'Drafting']
  },
  {
    title: 'ClientLink',
    description: 'A secure for clients to view and sign.',
    icon: LinkIcon,
    href: '/client-link',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Client Portal', 'Document Sharing', 'Digital Signatures']
  },
  {
    title: 'Compliance',
    description: 'Secure messaging & Collaboration Drafting.',
    icon: CheckCircle,
    href: '/compliance',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Regulatory Compliance', 'Policy Management', 'Auditing']
  },
  {
    title: 'Claxon',
    description: 'Calendar & Engagement System.',
    icon: Bell,
    href: '/claxon',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    features: ['Alert System', 'Notifications', 'Engagement Tracking']
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Feature Cards Grid - Main Area */}
        <div className="lg:col-span-4">
          <h2 className="text-xl font-semibold mb-4">Applications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon
              return (
                <Card 
                  key={feature.href} 
                  className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer h-[140px]"
                >
                  <Link href={feature.href} className="block h-full">
                    <CardHeader className="pb-2 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-1.5 rounded-lg ${feature.bgColor}`}>
                            <Icon className={`w-4 h-4 ${feature.color}`} />
                          </div>
                          <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <CardTitle className="text-sm font-medium leading-tight mb-1">{feature.title}</CardTitle>
                        <CardDescription className="text-xs leading-tight line-clamp-2">
                          {feature.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {feature.features.slice(0, 2).map((feat, index) => (
                          <span key={index} className="text-xs bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </CardHeader>
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

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-center">
                  <h3 className="text-sm font-medium">August 2024</h3>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs text-center">
                  <div className="p-1 font-medium">Su</div>
                  <div className="p-1 font-medium">Mo</div>
                  <div className="p-1 font-medium">Tu</div>
                  <div className="p-1 font-medium">We</div>
                  <div className="p-1 font-medium">Th</div>
                  <div className="p-1 font-medium">Fr</div>
                  <div className="p-1 font-medium">Sa</div>
                  
                  {/* Calendar Days */}
                  {Array.from({length: 31}, (_, i) => i + 1).map((day) => (
                    <div key={day} className={`p-1 rounded hover:bg-muted cursor-pointer ${
                      day === 15 ? 'bg-primary text-primary-foreground' : ''
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sticky Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sticky Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Click + to add a note.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
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
                <span className="text-xs bg-gray-500/10 text-gray-500 px-2 py-1 rounded-full">
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