'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Plus } from 'lucide-react'

export default function ApplicationPage() {
  const appName = 'CallerFacts'
  const description = 'Information gathering and contact handling secure proximity authentication'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{appName}</h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature 1</CardTitle>
            <CardDescription>
              Primary functionality for this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is a professional implementation of the core features.
            </p>
            <Button className="w-full mt-4">
              Access Feature
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature 2</CardTitle>
            <CardDescription>
              Secondary functionality and tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced tools and configuration options.
            </p>
            <Button className="w-full mt-4" variant="outline">
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature 3</CardTitle>
            <CardDescription>
              Analytics and reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View reports and analytics data.
            </p>
            <Button className="w-full mt-4" variant="outline">
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Learn how to use this application effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Step 1: Setup</h4>
                <p className="text-sm text-muted-foreground">
                  Configure your application settings and preferences.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Step 2: Import Data</h4>
                <p className="text-sm text-muted-foreground">
                  Import your existing data or start with new data.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Step 3: Process</h4>
                <p className="text-sm text-muted-foreground">
                  Use the application tools to process and manage your data.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Step 4: Export</h4>
                <p className="text-sm text-muted-foreground">
                  Export results and generate reports as needed.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button>Get Started</Button>
              <Button variant="outline">View Documentation</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
