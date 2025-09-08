'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
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
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and quick access'
  },
  {
    title: 'Word Processor',
    href: '/word-processor',
    icon: FileText,
    description: 'Secure document editing'
  },
  {
    title: 'Spreadsheet',
    href: '/spreadsheet',
    icon: Table,
    description: 'Data analysis and calculations'
  },
  {
    title: 'Image Editor',
    href: '/image-editor',
    icon: Image,
    description: 'Photo editing and manipulation'
  },
  {
    title: 'Video Editor',
    href: '/video-editor',
    icon: Video,
    description: 'Video editing with redaction'
  },
  {
    title: 'Creation Studio',
    href: '/creation-studio',
    icon: Presentation,
    description: 'Presentations and courses'
  },
  {
    title: 'Video Chat',
    href: '/video-chat',
    icon: VideoIcon,
    description: 'Secure video communication'
  },
  {
    title: 'Messaging',
    href: '/messaging',
    icon: MessageSquare,
    description: 'Encrypted messaging'
  },
  {
    title: 'Billing',
    href: '/billing',
    icon: Receipt,
    description: 'Invoicing and payments'
  },
  {
    title: 'Contacts',
    href: '/contacts',
    icon: Users,
    description: 'Contact management'
  },
  {
    title: 'Secure Vault',
    href: '/vault',
    icon: FolderLock,
    description: 'Encrypted file storage'
  },
  {
    title: 'Audit Trail',
    href: '/audit',
    icon: Activity,
    description: 'Security and access logs'
  }
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">Tools</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Quick Create Button */}
      <div className="px-4 mb-4">
        <Button 
          className="w-full justify-start" 
          size={isCollapsed ? "icon" : "default"}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">New Document</span>}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>SDC v0.1.0</p>
            <p>Zero-trust security</p>
          </div>
        </div>
      )}
    </aside>
  )
}