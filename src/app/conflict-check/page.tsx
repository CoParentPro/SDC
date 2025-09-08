'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  Search,
  Filter,
  Users,
  Building,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Upload,
  Settings,
  BarChart3,
  Clock
} from 'lucide-react'

interface ConflictCheck {
  id: string
  type: 'client' | 'matter' | 'opposing_party' | 'vendor' | 'employee'
  entity: string
  relationship: string
  conflictLevel: 'high' | 'medium' | 'low' | 'none'
  status: 'active' | 'resolved' | 'monitoring' | 'waived'
  dateIdentified: string
  description: string
  recommendations: string[]
  relatedMatters: string[]
  reviewer: string
  lastReviewed: string
}

interface Entity {
  id: string
  name: string
  type: 'individual' | 'corporation' | 'partnership' | 'government'
  aliases: string[]
  relationships: Array<{
    entityId: string
    relationship: string
    startDate: string
    endDate?: string
  }>
  matters: string[]
  riskLevel: 'high' | 'medium' | 'low'
  lastUpdated: string
}

export default function ConflictCheckPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  const [conflicts] = useState<ConflictCheck[]>([
    {
      id: '1',
      type: 'client',
      entity: 'TechCorp Industries',
      relationship: 'Current client in IP litigation',
      conflictLevel: 'high',
      status: 'active',
      dateIdentified: '2024-01-15',
      description: 'Potential conflict with opposing party in new matter. TechCorp is current client in patent litigation case.',
      recommendations: ['Decline representation', 'Seek waiver from both parties', 'Refer to conflict counsel'],
      relatedMatters: ['Patent Litigation #2023-001', 'Contract Dispute #2024-003'],
      reviewer: 'John Smith',
      lastReviewed: '2024-01-15'
    },
    {
      id: '2',
      type: 'opposing_party',
      entity: 'Global Manufacturing LLC',
      relationship: 'Former opposing party',
      conflictLevel: 'medium',
      status: 'monitoring',
      dateIdentified: '2024-01-12',
      description: 'Entity was opposing party in concluded matter 2 years ago. Now seeking representation in unrelated matter.',
      recommendations: ['Request detailed matter description', 'Review prior case files', 'Consider engagement'],
      relatedMatters: ['Contract Breach #2022-045'],
      reviewer: 'Sarah Johnson',
      lastReviewed: '2024-01-14'
    },
    {
      id: '3',
      type: 'vendor',
      entity: 'Legal Support Services',
      relationship: 'Current vendor',
      conflictLevel: 'low',
      status: 'waived',
      dateIdentified: '2024-01-10',
      description: 'Vendor providing services to firm is involved in matter as expert witness.',
      recommendations: ['Monitor for material changes', 'Document waiver'],
      relatedMatters: ['Expert Testimony #2024-001'],
      reviewer: 'Mike Wilson',
      lastReviewed: '2024-01-12'
    }
  ])

  const [entities] = useState<Entity[]>([
    {
      id: '1',
      name: 'TechCorp Industries',
      type: 'corporation',
      aliases: ['TechCorp', 'Tech Corporation', 'TCI'],
      relationships: [
        { entityId: '2', relationship: 'Subsidiary', startDate: '2020-01-01' },
        { entityId: '3', relationship: 'Strategic Partner', startDate: '2022-06-15' }
      ],
      matters: ['Patent Litigation #2023-001', 'Contract Dispute #2024-003'],
      riskLevel: 'high',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      name: 'Global Manufacturing LLC',
      type: 'corporation',
      aliases: ['Global Mfg', 'GM LLC'],
      relationships: [
        { entityId: '1', relationship: 'Parent Company', startDate: '2020-01-01' }
      ],
      matters: ['Contract Breach #2022-045'],
      riskLevel: 'medium',
      lastUpdated: '2024-01-14'
    },
    {
      id: '3',
      name: 'Legal Support Services',
      type: 'corporation',
      aliases: ['LSS', 'Legal Support'],
      relationships: [],
      matters: ['Expert Testimony #2024-001'],
      riskLevel: 'low',
      lastUpdated: '2024-01-12'
    }
  ])

  const getConflictLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-500 bg-green-50 border-green-200'
      case 'none': return 'text-gray-500 bg-gray-50 border-gray-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-500 bg-red-50'
      case 'resolved': return 'text-green-500 bg-green-50'
      case 'monitoring': return 'text-yellow-500 bg-yellow-50'
      case 'waived': return 'text-blue-500 bg-blue-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <XCircle className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'monitoring': return <AlertCircle className="w-4 h-4" />
      case 'waived': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client': return <Users className="w-4 h-4" />
      case 'matter': return <FileText className="w-4 h-4" />
      case 'opposing_party': return <AlertTriangle className="w-4 h-4" />
      case 'vendor': return <Building className="w-4 h-4" />
      case 'employee': return <Users className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const filteredConflicts = conflicts.filter(conflict => {
    const matchesSearch = conflict.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conflict.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || conflict.type === selectedType
    return matchesSearch && matchesType
  })

  const conflictStats = {
    total: conflicts.length,
    high: conflicts.filter(c => c.conflictLevel === 'high').length,
    active: conflicts.filter(c => c.status === 'active').length,
    resolved: conflicts.filter(c => c.status === 'resolved').length
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conflict Check</h1>
          <p className="text-muted-foreground">
            Verify potential conflicts of interest across your data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Search className="w-4 h-4 mr-2" />
            New Check
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-gray-500" />
              <div>
                <div className="text-2xl font-bold">{conflictStats.total}</div>
                <p className="text-xs text-muted-foreground">Total Conflicts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-500">{conflictStats.high}</div>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-500">{conflictStats.active}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-500">{conflictStats.resolved}</div>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conflicts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="conflicts" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search conflicts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'client', 'matter', 'opposing_party', 'vendor', 'employee'].map((type) => (
                    <Badge
                      key={type}
                      variant={selectedType === type ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => setSelectedType(type)}
                    >
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Conflicts List */}
          <Card>
            <CardHeader>
              <CardTitle>Identified Conflicts</CardTitle>
              <CardDescription>
                Review and manage potential conflicts of interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredConflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(conflict.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{conflict.entity}</h3>
                            <Badge className={getConflictLevelColor(conflict.conflictLevel)}>
                              {conflict.conflictLevel} risk
                            </Badge>
                            <Badge className={getStatusColor(conflict.status)}>
                              {getStatusIcon(conflict.status)}
                              <span className="ml-1 capitalize">{conflict.status}</span>
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {conflict.relationship}
                          </p>
                          
                          <p className="text-sm mb-3">
                            {conflict.description}
                          </p>
                          
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium">Recommendations:</span>
                              <ul className="text-sm text-muted-foreground ml-4 list-disc">
                                {conflict.recommendations.map((rec, index) => (
                                  <li key={index}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                            
                            {conflict.relatedMatters.length > 0 && (
                              <div>
                                <span className="text-sm font-medium">Related Matters:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {conflict.relatedMatters.map((matter) => (
                                    <Badge key={matter} variant="outline" className="text-xs">
                                      {matter}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Reviewed by {conflict.reviewer}</p>
                        <p>{new Date(conflict.lastReviewed).toLocaleDateString()}</p>
                        <div className="flex gap-1 mt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="w-3 h-3 mr-1" />
                            Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entity Database</CardTitle>
              <CardDescription>
                Manage entities and their relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{entity.name}</h3>
                          <Badge variant="outline" className="capitalize">
                            {entity.type}
                          </Badge>
                          <Badge className={getConflictLevelColor(entity.riskLevel)}>
                            {entity.riskLevel} risk
                          </Badge>
                        </div>
                        
                        {entity.aliases.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm font-medium">Aliases:</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {entity.aliases.join(', ')}
                            </span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Relationships:</span>
                            <div className="text-muted-foreground">
                              {entity.relationships.length} active
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Matters:</span>
                            <div className="text-muted-foreground">
                              {entity.matters.length} total
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Updated {new Date(entity.lastUpdated).toLocaleDateString()}</p>
                        <div className="flex gap-1 mt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Search className="w-3 h-3 mr-1" />
                            Check
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Conflict Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>This Month</span>
                    <span className="font-semibold">3 new conflicts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Month</span>
                    <span className="font-semibold">5 new conflicts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Resolution Time</span>
                    <span className="font-semibold">7 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      High Risk
                    </span>
                    <span className="font-semibold">
                      {conflicts.filter(c => c.conflictLevel === 'high').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      Medium Risk
                    </span>
                    <span className="font-semibold">
                      {conflicts.filter(c => c.conflictLevel === 'medium').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      Low Risk
                    </span>
                    <span className="font-semibold">
                      {conflicts.filter(c => c.conflictLevel === 'low').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conflict Reports</CardTitle>
              <CardDescription>
                Generate and download conflict check reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold">Conflict Summary Report</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Overview of all active and resolved conflicts
                  </p>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-semibold">Analytics Report</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Detailed analytics and trends analysis
                  </p>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">Entity Relationship Map</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Visual map of entity relationships
                  </p>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Historical Report</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    Historical conflict data and patterns
                  </p>
                </Button>
              </div>
              
              <div className="flex justify-center pt-4">
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Custom Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}