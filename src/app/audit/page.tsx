'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  AlertTriangle,
  Eye,
  Download,
  Filter,
  Search,
  Calendar,
  Clock,
  User,
  Activity,
  TrendingUp,
  TrendingDown,
  MapPin,
  Smartphone,
  Monitor,
  FileText,
  Database,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Image,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { AuditEvent, AuditCategory } from '../../../types';
import { AuditService } from '@/services/audit';
import { formatDate, formatDateString } from '@/utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AuditTrailPage = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    highRiskEvents: 0,
    uniqueUsers: 0,
    failedLogins: 0,
    securityEvents: 0,
  });

  useEffect(() => {
    loadAuditEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, selectedCategory, selectedRisk, dateRange]);

  const loadAuditEvents = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from an API
      const mockEvents: AuditEvent[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          userId: 'user-1',
          userEmail: 'john@example.com',
          action: 'login-success',
          resource: 'authentication',
          resourceId: 'session-123',
          details: { ip: '192.168.1.100', userAgent: 'Chrome/91.0' },
          ip: '192.168.1.100',
          userAgent: 'Chrome/91.0',
          sessionId: 'session-123',
          risk: 'low',
          category: 'authentication',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          userId: 'user-2',
          userEmail: 'admin@example.com',
          action: 'file-encrypted',
          resource: 'vault',
          resourceId: 'file-456',
          details: { filename: 'confidential.pdf', size: 1024000 },
          ip: '192.168.1.101',
          userAgent: 'Firefox/89.0',
          sessionId: 'session-124',
          risk: 'low',
          category: 'file-operation',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 10800000), // 3 hours ago
          userId: 'unknown',
          userEmail: 'attacker@malicious.com',
          action: 'login-failed',
          resource: 'authentication',
          resourceId: 'failed-attempt-789',
          details: { reason: 'invalid_password', attempts: 5 },
          ip: '10.0.0.1',
          userAgent: 'Bot/1.0',
          sessionId: 'session-125',
          risk: 'high',
          category: 'security-event',
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 14400000), // 4 hours ago
          userId: 'user-3',
          userEmail: 'jane@example.com',
          action: 'video-call-created',
          resource: 'video-chat',
          resourceId: 'call-101',
          details: { title: 'Team Meeting', participants: 5 },
          ip: '192.168.1.102',
          userAgent: 'Chrome/91.0',
          sessionId: 'session-126',
          risk: 'low',
          category: 'communication',
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 18000000), // 5 hours ago
          userId: 'user-1',
          userEmail: 'john@example.com',
          action: 'document-redacted',
          resource: 'word-processor',
          resourceId: 'doc-202',
          details: { redactionCount: 3, documentName: 'sensitive-report.docx' },
          ip: '192.168.1.100',
          userAgent: 'Chrome/91.0',
          sessionId: 'session-127',
          risk: 'medium',
          category: 'data-modification',
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 21600000), // 6 hours ago
          userId: 'admin',
          userEmail: 'admin@example.com',
          action: 'security-alert-triggered',
          resource: 'security-monitor',
          resourceId: 'alert-303',
          details: { alertType: 'unusual_activity', score: 85 },
          ip: '192.168.1.1',
          userAgent: 'Chrome/91.0',
          sessionId: 'session-128',
          risk: 'critical',
          category: 'security-event',
        },
      ];

      setEvents(mockEvents);
      
      // Calculate stats
      const uniqueUsers = new Set(mockEvents.map(e => e.userId)).size;
      const failedLogins = mockEvents.filter(e => e.action.includes('login-failed')).length;
      const securityEvents = mockEvents.filter(e => e.category === 'security-event').length;
      const criticalEvents = mockEvents.filter(e => e.risk === 'critical').length;
      const highRiskEvents = mockEvents.filter(e => e.risk === 'high').length;

      setStats({
        totalEvents: mockEvents.length,
        criticalEvents,
        highRiskEvents,
        uniqueUsers,
        failedLogins,
        securityEvents,
      });
      
    } catch (error) {
      console.error('Failed to load audit events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.action.toLowerCase().includes(query) ||
        event.userEmail.toLowerCase().includes(query) ||
        event.resource.toLowerCase().includes(query) ||
        event.ip.includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Risk filter
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(event => event.risk === selectedRisk);
    }

    // Date filter
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(event => event.timestamp >= cutoff);
    }

    setFilteredEvents(filtered);
  };

  const exportAuditLog = () => {
    const csvContent = [
      'Timestamp,User,Action,Resource,Risk Level,IP Address,Details',
      ...filteredEvents.map(event =>
        `"${event.timestamp.toISOString()}","${event.userEmail}","${event.action}","${event.resource}","${event.risk}","${event.ip}","${JSON.stringify(event.details)}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: AuditCategory) => {
    const iconMap = {
      'authentication': <UserCheck className="h-4 w-4" />,
      'authorization': <Shield className="h-4 w-4" />,
      'data-access': <Eye className="h-4 w-4" />,
      'data-modification': <FileText className="h-4 w-4" />,
      'file-operation': <Database className="h-4 w-4" />,
      'system-configuration': <Settings className="h-4 w-4" />,
      'security-event': <AlertTriangle className="h-4 w-4" />,
      'communication': <MessageSquare className="h-4 w-4" />,
      'content-creation': <Image className="h-4 w-4" />,
    };
    return iconMap[category] || <Activity className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('failed') || action.includes('denied') || action.includes('blocked')) {
      return 'text-red-600 dark:text-red-400';
    }
    if (action.includes('success') || action.includes('created') || action.includes('completed')) {
      return 'text-green-600 dark:text-green-400';
    }
    if (action.includes('warning') || action.includes('alert') || action.includes('modified')) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Security Audit Trail
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor and analyze system security events
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadAuditEvents}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportAuditLog}>
            <Download className="h-4 w-4 mr-2" />
            Export Log
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEvents}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Events</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalEvents}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Risk</p>
              <p className="text-2xl font-bold text-orange-500">{stats.highRiskEvents}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{stats.uniqueUsers}</p>
            </div>
            <User className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Logins</p>
              <p className="text-2xl font-bold text-red-500">{stats.failedLogins}</p>
            </div>
            <UserX className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Events</p>
              <p className="text-2xl font-bold text-purple-600">{stats.securityEvents}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 px-6 pb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events, users, actions, or IP addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Category: {selectedCategory === 'all' ? 'All' : selectedCategory}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
              All Categories
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedCategory('authentication')}>
              Authentication
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedCategory('security-event')}>
              Security Events
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedCategory('data-modification')}>
              Data Modification
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedCategory('file-operation')}>
              File Operations
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedCategory('communication')}>
              Communication
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedCategory('content-creation')}>
              Content Creation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Risk: {selectedRisk === 'all' ? 'All' : selectedRisk}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedRisk('all')}>
              All Risk Levels
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedRisk('critical')}>
              Critical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedRisk('high')}>
              High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedRisk('medium')}>
              Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedRisk('low')}>
              Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              {dateRange === 'all' ? 'All Time' : dateRange}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDateRange('today')}>
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateRange('week')}>
              Past Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateRange('month')}>
              Past Month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateRange('all')}>
              All Time
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Events List */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Audit Events ({filteredEvents.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading audit events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No audit events found</p>
                  <p className="text-sm">Try adjusting your filters or search criteria</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getRiskIcon(event.risk)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(event.category)}
                            <h4 className={`text-sm font-medium ${getActionColor(event.action)}`}>
                              {event.action.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </h4>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {event.category.replace(/-/g, ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(event.timestamp)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.ip}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{event.userEmail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Database className="h-3 w-3" />
                            <span>{event.resource}</span>
                          </div>
                          {event.userAgent && (
                            <div className="flex items-center space-x-1">
                              <Monitor className="h-3 w-3" />
                              <span className="truncate max-w-xs">
                                {event.userAgent.split('/')[0]}
                              </span>
                            </div>
                          )}
                        </div>

                        {Object.keys(event.details).length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Details:</div>
                            <div className="space-y-1">
                              {Object.entries(event.details).map(([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">
                                    {key}:
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailPage;