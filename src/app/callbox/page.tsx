'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Circle,
  Play,
  Square,
  Pause,
  Users,
  Clock,
  BarChart3,
  Search,
  Filter,
  Calendar,
  Download,
  Settings,
  Plus,
  PhoneMissed
} from 'lucide-react'

interface CallRecord {
  id: string
  type: 'incoming' | 'outgoing' | 'missed'
  contact: string
  number: string
  duration: string
  timestamp: string
  recording?: string
  notes?: string
}

export default function CallboxPage() {
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [callHistory] = useState<CallRecord[]>([
    {
      id: '1',
      type: 'incoming',
      contact: 'John Smith',
      number: '+1 (555) 123-4567',
      duration: '05:23',
      timestamp: '2024-01-15 14:30',
      recording: 'recording_001.wav',
      notes: 'Discussed project timeline'
    },
    {
      id: '2',
      type: 'outgoing',
      contact: 'Sarah Johnson',
      number: '+1 (555) 987-6543',
      duration: '12:45',
      timestamp: '2024-01-15 13:15',
      recording: 'recording_002.wav'
    },
    {
      id: '3',
      type: 'missed',
      contact: 'Unknown',
      number: '+1 (555) 555-5555',
      duration: '00:00',
      timestamp: '2024-01-15 12:00'
    }
  ])

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming': return <PhoneIncoming className="w-4 h-4 text-green-500" />
      case 'outgoing': return <PhoneOutgoing className="w-4 h-4 text-blue-500" />
      case 'missed': return <PhoneMissed className="w-4 h-4 text-red-500" />
      default: return <Phone className="w-4 h-4" />
    }
  }

  const initiateCall = (contact: string, number: string) => {
    const newCall: CallRecord = {
      id: Date.now().toString(),
      type: 'outgoing',
      contact,
      number,
      duration: '00:00',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
    setActiveCall(newCall)
  }

  const endCall = () => {
    setActiveCall(null)
    setIsRecording(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Callbox</h1>
          <p className="text-muted-foreground">
            Communication management for internal use
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Contact
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Call Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5" />
                {activeCall ? 'Active Call' : 'Dialer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeCall ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">{activeCall.contact}</h3>
                    <p className="text-sm text-muted-foreground">{activeCall.number}</p>
                    <div className="text-2xl font-mono mt-2">
                      {activeCall.duration}
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      {isRecording ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </Button>
                    <Button variant="destructive" onClick={endCall}>
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {isRecording && (
                    <div className="text-center">
                      <Badge variant="destructive" className="animate-pulse">
                        Recording
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Contact Name</label>
                    <Input placeholder="Enter contact name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input placeholder="+1 (555) 123-4567" />
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => initiateCall("New Contact", "+1 (555) 123-4567")}
                  >
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Call Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Today's Calls</span>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Duration</span>
                <span className="font-semibold">2h 34m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Missed Calls</span>
                <span className="font-semibold text-red-500">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Recordings</span>
                <span className="font-semibold">15</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Call History
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search calls..."
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {callHistory.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getCallIcon(call.type)}
                      <div>
                        <p className="font-medium">{call.contact}</p>
                        <p className="text-sm text-muted-foreground">{call.number}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="text-right">
                        <p>{call.timestamp}</p>
                        <p>{call.duration}</p>
                      </div>
                      
                      {call.recording && (
                        <Button variant="outline" size="sm">
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm">
                        <PhoneCall className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Call Notes */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Call Notes</CardTitle>
              <CardDescription>
                Add notes for the selected call
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter notes about the call..."
                className="min-h-[100px]"
              />
              <div className="flex justify-end mt-3">
                <Button size="sm">Save Notes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}