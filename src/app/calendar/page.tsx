'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Settings,
  Bell,
  Users,
  MapPin,
  Video,
  Phone,
  Mail,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react'

interface Event {
  id: string
  title: string
  type: 'meeting' | 'call' | 'reminder' | 'task'
  startTime: string
  endTime: string
  date: string
  location?: string
  attendees?: string[]
  description?: string
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
  priority: 'low' | 'medium' | 'high'
  status: 'scheduled' | 'completed' | 'cancelled'
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Team Standup',
      type: 'meeting',
      startTime: '09:00',
      endTime: '09:30',
      date: '2024-01-15',
      location: 'Conference Room A',
      attendees: ['John Doe', 'Jane Smith', 'Bob Johnson'],
      description: 'Daily team standup meeting',
      recurring: 'daily',
      priority: 'medium',
      status: 'scheduled'
    },
    {
      id: '2',
      title: 'Client Presentation',
      type: 'meeting',
      startTime: '14:00',
      endTime: '15:30',
      date: '2024-01-15',
      location: 'Virtual - Zoom',
      attendees: ['Alice Cooper', 'Mike Wilson'],
      description: 'Q4 results presentation to client',
      recurring: 'none',
      priority: 'high',
      status: 'scheduled'
    },
    {
      id: '3',
      title: 'Follow up on proposal',
      type: 'task',
      startTime: '16:00',
      endTime: '16:30',
      date: '2024-01-15',
      description: 'Call client about project proposal',
      recurring: 'none',
      priority: 'high',
      status: 'scheduled'
    },
    {
      id: '4',
      title: 'Code Review',
      type: 'meeting',
      startTime: '10:00',
      endTime: '11:00',
      date: '2024-01-16',
      location: 'Development Room',
      attendees: ['Dev Team'],
      description: 'Review sprint deliverables',
      recurring: 'weekly',
      priority: 'medium',
      status: 'scheduled'
    }
  ])

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="w-4 h-4" />
      case 'call': return <Phone className="w-4 h-4" />
      case 'task': return <FileText className="w-4 h-4" />
      case 'reminder': return <Bell className="w-4 h-4" />
      default: return <CalendarIcon className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-200 bg-red-50'
      case 'medium': return 'text-yellow-500 border-yellow-200 bg-yellow-50'
      case 'low': return 'text-green-500 border-green-200 bg-green-50'
      default: return 'text-gray-500 border-gray-200 bg-gray-50'
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long'
    })
  }

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = getEventsForDate(dateString)
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
      
      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-100 p-1 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
            {day}
          </div>
          <div className="space-y-1 mt-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs px-1 py-0.5 rounded truncate ${getPriorityColor(event.priority)}`}
              >
                {event.startTime} {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
          <div key={dayName} className="bg-gray-100 p-2 text-center text-sm font-medium border-b border-gray-200">
            {dayName}
          </div>
        ))}
        {days}
      </div>
    )
  }

  const todayEvents = events.filter(event => {
    const today = new Date().toISOString().split('T')[0]
    return event.date === today
  })

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date)
    const today = new Date()
    return eventDate > today
  }).slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Your scheduling system and scheduling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateMonth('prev')}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <h2 className="text-xl font-semibold min-w-[200px] text-center">
                          {formatDate(currentDate)}
                        </h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateMonth('next')}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                      >
                        Today
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={viewMode === 'month' ? 'default' : 'outline'}>
                        Month
                      </Badge>
                      <Badge variant={viewMode === 'week' ? 'default' : 'outline'}>
                        Week
                      </Badge>
                      <Badge variant={viewMode === 'day' ? 'default' : 'outline'}>
                        Day
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderMonthView()}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Today's Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todayEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events today</p>
                  ) : (
                    todayEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-2 p-2 rounded-lg border">
                        {getEventTypeIcon(event.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.startTime} - {event.endTime}
                          </p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(event.priority)}`}
                        >
                          {event.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-2 p-2 rounded-lg border">
                      {getEventTypeIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()} at {event.startTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="w-4 h-4 mr-2" />
                    Schedule Video Call
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Phone Call
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Schedule Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Set Reminder
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Events</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getEventTypeIcon(event.type)}
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()} • {event.startTime} - {event.endTime}
                        </p>
                        {event.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getPriorityColor(event.priority)}
                      >
                        {event.priority}
                      </Badge>
                      <Badge variant={event.status === 'scheduled' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                      {event.recurring !== 'none' && (
                        <Badge variant="outline">
                          {event.recurring}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Settings</CardTitle>
              <CardDescription>
                Configure your calendar preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Default View</label>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">Month</Badge>
                  <Badge variant="outline">Week</Badge>
                  <Badge variant="outline">Day</Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Time Zone</label>
                <Input value="America/New_York" className="mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Default Event Duration</label>
                <Input value="30 minutes" className="mt-1" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Working Hours</label>
                <div className="flex gap-2 mt-1">
                  <Input value="9:00 AM" />
                  <span className="self-center">to</span>
                  <Input value="5:00 PM" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}