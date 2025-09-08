import { AuditEvent, AuditCategory } from '../types';
import { EncryptionService } from './encryption';
import { v4 as uuidv4 } from 'uuid';

export interface AuditConfig {
  enabled: boolean;
  retentionDays: number;
  encryptLogs: boolean;
  maxLogSize: number; // bytes
  alertThresholds: {
    failedLogins: number;
    suspiciousActivity: number;
    dataAccess: number;
  };
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  category?: AuditCategory;
  risk?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByCategory: Record<AuditCategory, number>;
  eventsByRisk: Record<string, number>;
  recentEvents: AuditEvent[];
  alerts: AuditAlert[];
}

export interface AuditAlert {
  id: string;
  type: 'security' | 'compliance' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  events: string[]; // event IDs
  triggered: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export class AuditService {
  private static readonly DB_NAME = 'SDC_Audit';
  private static readonly DB_VERSION = 1;
  private static readonly STORES = {
    events: 'events',
    alerts: 'alerts',
    config: 'config',
  };

  private static readonly DEFAULT_CONFIG: AuditConfig = {
    enabled: true,
    retentionDays: 365,
    encryptLogs: true,
    maxLogSize: 10 * 1024 * 1024, // 10MB
    alertThresholds: {
      failedLogins: 5,
      suspiciousActivity: 10,
      dataAccess: 100,
    },
  };

  private static db: IDBDatabase | null = null;
  private static config: AuditConfig = this.DEFAULT_CONFIG;

  /**
   * Initialize the audit system
   */
  static async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open audit database'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.loadConfig().then(() => resolve());
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create events store
        if (!db.objectStoreNames.contains(this.STORES.events)) {
          const eventsStore = db.createObjectStore(this.STORES.events, { keyPath: 'id' });
          eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
          eventsStore.createIndex('userId', 'userId', { unique: false });
          eventsStore.createIndex('action', 'action', { unique: false });
          eventsStore.createIndex('resource', 'resource', { unique: false });
          eventsStore.createIndex('category', 'category', { unique: false });
          eventsStore.createIndex('risk', 'risk', { unique: false });
        }

        // Create alerts store
        if (!db.objectStoreNames.contains(this.STORES.alerts)) {
          const alertsStore = db.createObjectStore(this.STORES.alerts, { keyPath: 'id' });
          alertsStore.createIndex('triggered', 'triggered', { unique: false });
          alertsStore.createIndex('severity', 'severity', { unique: false });
          alertsStore.createIndex('acknowledged', 'acknowledged', { unique: false });
        }

        // Create config store
        if (!db.objectStoreNames.contains(this.STORES.config)) {
          db.createObjectStore(this.STORES.config, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Log an audit event
   */
  static async logEvent(
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any> = {},
    category: AuditCategory = 'data-access',
    risk: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    if (!this.config.enabled) return;

    await this.ensureInitialized();

    const event: AuditEvent = {
      id: uuidv4(),
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      userEmail: this.getCurrentUserEmail(),
      action,
      resource,
      resourceId,
      details,
      ip: await this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      risk,
      category,
    };

    // Encrypt event if configured
    let eventData: AuditEvent | any = event;
    if (this.config.encryptLogs) {
      const password = this.getEncryptionPassword();
      const encryptedDetails = EncryptionService.encrypt(JSON.stringify(event), password);
      eventData = {
        id: event.id,
        timestamp: event.timestamp,
        encrypted: true,
        data: encryptedDetails,
      };
    }

    await this.executeTransaction([this.STORES.events], 'readwrite', (transaction) => {
      transaction.objectStore(this.STORES.events).add(eventData);
    });

    // Check for alert conditions
    await this.checkAlertConditions(event);

    // Cleanup old events
    await this.cleanupOldEvents();
  }

  /**
   * Query audit events
   */
  static async queryEvents(query: AuditQuery = {}): Promise<{ events: AuditEvent[]; total: number }> {
    await this.ensureInitialized();

    const allEvents = await this.executeTransaction([this.STORES.events], 'readonly', (transaction) => {
      const store = transaction.objectStore(this.STORES.events);
      
      // If we have a date range, use the timestamp index
      if (query.startDate || query.endDate) {
        const index = store.index('timestamp');
        const range = this.createDateRange(query.startDate, query.endDate);
        const request = index.getAll(range);
        return new Promise<any[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } else {
        const request = store.getAll();
        return new Promise<any[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
    });

    // Decrypt events if necessary
    const events: AuditEvent[] = [];
    for (const eventData of allEvents) {
      if (eventData.encrypted) {
        try {
          const password = this.getEncryptionPassword();
          const decryptedData = EncryptionService.decrypt(eventData.data, password);
          events.push(JSON.parse(decryptedData));
        } catch (error) {
          console.error('Failed to decrypt audit event:', error);
          continue;
        }
      } else {
        events.push(eventData);
      }
    }

    // Apply filters
    const filteredEvents = events.filter(event => {
      if (query.userId && event.userId !== query.userId) return false;
      if (query.action && !event.action.includes(query.action)) return false;
      if (query.resource && !event.resource.includes(query.resource)) return false;
      if (query.category && event.category !== query.category) return false;
      if (query.risk && event.risk !== query.risk) return false;
      return true;
    });

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedEvents = filteredEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total: filteredEvents.length,
    };
  }

  /**
   * Get audit summary
   */
  static async getSummary(): Promise<AuditSummary> {
    const { events } = await this.queryEvents({ limit: 1000 });
    const alerts = await this.getActiveAlerts();

    const eventsByCategory: Record<AuditCategory, number> = {
      authentication: 0,
      authorization: 0,
      'data-access': 0,
      'data-modification': 0,
      'file-operation': 0,
      'system-configuration': 0,
      'security-event': 0,
      communication: 0,
    };

    const eventsByRisk: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    events.forEach(event => {
      eventsByCategory[event.category]++;
      eventsByRisk[event.risk]++;
    });

    return {
      totalEvents: events.length,
      eventsByCategory,
      eventsByRisk,
      recentEvents: events.slice(0, 10),
      alerts,
    };
  }

  /**
   * Create security alert
   */
  static async createAlert(
    type: 'security' | 'compliance' | 'performance',
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    eventIds: string[] = []
  ): Promise<AuditAlert> {
    await this.ensureInitialized();

    const alert: AuditAlert = {
      id: uuidv4(),
      type,
      severity,
      message,
      events: eventIds,
      triggered: new Date(),
      acknowledged: false,
    };

    await this.executeTransaction([this.STORES.alerts], 'readwrite', (transaction) => {
      transaction.objectStore(this.STORES.alerts).add(alert);
    });

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    await this.ensureInitialized();

    const alert = await this.getAlertById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    await this.executeTransaction([this.STORES.alerts], 'readwrite', (transaction) => {
      transaction.objectStore(this.STORES.alerts).put(alert);
    });
  }

  /**
   * Export audit logs
   */
  static async exportLogs(
    query: AuditQuery = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { events } = await this.queryEvents(query);

    if (format === 'csv') {
      const headers = [
        'timestamp',
        'userId',
        'userEmail',
        'action',
        'resource',
        'resourceId',
        'category',
        'risk',
        'ip',
        'sessionId'
      ];

      const csvLines = [headers.join(',')];
      events.forEach(event => {
        const row = headers.map(header => {
          const value = event[header as keyof AuditEvent];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvLines.push(row.join(','));
      });

      return csvLines.join('\n');
    } else {
      return JSON.stringify(events, null, 2);
    }
  }

  // Private helper methods

  private static async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  private static async loadConfig(): Promise<void> {
    if (!this.db) return;

    try {
      const configRecord = await this.executeTransaction([this.STORES.config], 'readonly', (transaction) => {
        const request = transaction.objectStore(this.STORES.config).get('audit-config');
        return new Promise<any>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });

      if (configRecord) {
        this.config = { ...this.DEFAULT_CONFIG, ...configRecord.value };
      }
    } catch (error) {
      console.warn('Failed to load audit config, using defaults:', error);
    }
  }

  private static getCurrentUserId(): string {
    // This should be replaced with actual user ID from auth store
    return localStorage.getItem('currentUserId') || 'anonymous';
  }

  private static getCurrentUserEmail(): string {
    // This should be replaced with actual user email from auth store
    return localStorage.getItem('currentUserEmail') || 'anonymous@example.com';
  }

  private static async getClientIP(): Promise<string> {
    // In a real application, this would get the actual client IP
    // For now, return localhost
    return '127.0.0.1';
  }

  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('auditSessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('auditSessionId', sessionId);
    }
    return sessionId;
  }

  private static getEncryptionPassword(): string {
    // This should use a proper key derivation method
    return 'audit-encryption-key-' + this.getCurrentUserId();
  }

  private static async checkAlertConditions(event: AuditEvent): Promise<void> {
    // Check for failed login attempts
    if (event.action === 'login-failed') {
      const recentFailures = await this.queryEvents({
        userId: event.userId,
        action: 'login-failed',
        startDate: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      });

      if (recentFailures.events.length >= this.config.alertThresholds.failedLogins) {
        await this.createAlert(
          'security',
          'high',
          `Multiple failed login attempts for user ${event.userEmail}`,
          recentFailures.events.map(e => e.id)
        );
      }
    }

    // Check for high-risk events
    if (event.risk === 'critical') {
      await this.createAlert(
        'security',
        'critical',
        `Critical security event: ${event.action} on ${event.resource}`,
        [event.id]
      );
    }
  }

  private static async getActiveAlerts(): Promise<AuditAlert[]> {
    return this.executeTransaction([this.STORES.alerts], 'readonly', (transaction) => {
      const index = transaction.objectStore(this.STORES.alerts).index('acknowledged');
      const request = index.getAll(false);
      return new Promise<AuditAlert[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  private static async getAlertById(alertId: string): Promise<AuditAlert | null> {
    return this.executeTransaction([this.STORES.alerts], 'readonly', (transaction) => {
      const request = transaction.objectStore(this.STORES.alerts).get(alertId);
      return new Promise<AuditAlert | null>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    });
  }

  private static async cleanupOldEvents(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);

    await this.executeTransaction([this.STORES.events], 'readwrite', (transaction) => {
      const index = transaction.objectStore(this.STORES.events).index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffDate);
      
      index.openCursor(range).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    });
  }

  private static createDateRange(startDate?: Date, endDate?: Date): IDBKeyRange | undefined {
    if (startDate && endDate) {
      return IDBKeyRange.bound(startDate, endDate);
    } else if (startDate) {
      return IDBKeyRange.lowerBound(startDate);
    } else if (endDate) {
      return IDBKeyRange.upperBound(endDate);
    }
    return undefined;
  }

  private static executeTransaction<T>(
    stores: string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => T | Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(stores, mode);
      transaction.onerror = () => reject(transaction.error);
      
      try {
        const result = operation(transaction);
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          transaction.oncomplete = () => resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}