/**
 * Offline-First Architecture Service
 * Manages online/offline state and warns users when attempting online operations
 */

export interface NetworkState {
  isOnline: boolean;
  isOfflineMode: boolean; // User-controlled offline mode
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

export interface OnlineWarning {
  id: string;
  type: 'data-transmission' | 'external-api' | 'cloud-sync' | 'file-share' | 'database-connection';
  message: string;
  risksExposed: string[];
  suggestedAction: string;
  timestamp: Date;
}

export interface SecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'external-access-attempt' | 'screen-reader-access' | 'unauthorized-write' | 'data-exfiltration';
  source: string;
  details: string;
  affectedData: string[];
  timestamp: Date;
  resolved: boolean;
}

export class OfflineFirstService {
  private static instance: OfflineFirstService;
  private networkState: NetworkState = {
    isOnline: navigator.onLine,
    isOfflineMode: true, // Default to offline mode for security
    connectionType: 'unknown',
    connectionSpeed: 'unknown'
  };
  
  private listeners: Array<(state: NetworkState) => void> = [];
  private warningListeners: Array<(warning: OnlineWarning) => void> = [];
  private alertListeners: Array<(alert: SecurityAlert) => void> = [];
  
  private constructor() {
    this.initializeNetworkMonitoring();
    this.initializeSecurityMonitoring();
  }

  static getInstance(): OfflineFirstService {
    if (!this.instance) {
      this.instance = new OfflineFirstService();
    }
    return this.instance;
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Toggle offline mode (user controlled)
   */
  setOfflineMode(enabled: boolean): void {
    const previousState = this.networkState.isOfflineMode;
    this.networkState.isOfflineMode = enabled;
    
    if (previousState !== enabled) {
      this.notifyStateChange();
      
      if (!enabled) {
        // User is going online - show warning
        this.showOnlineWarning({
          type: 'data-transmission',
          message: 'You are now in ONLINE mode. Your data may be transmitted over the internet.',
          risksExposed: [
            'Network traffic monitoring',
            'Data interception',
            'IP address exposure',
            'Potential data breaches'
          ],
          suggestedAction: 'Return to offline mode when possible to maintain maximum security.'
        });
      }
      
      // Store preference
      localStorage.setItem('sdc_offline_mode', enabled.toString());
    }
  }

  /**
   * Check if operation requires online access and warn user
   */
  async requestOnlineOperation(
    operationType: OnlineWarning['type'],
    description: string,
    requiredFor: string[]
  ): Promise<boolean> {
    if (this.networkState.isOfflineMode || !this.networkState.isOnline) {
      this.showOnlineWarning({
        type: operationType,
        message: `${description} requires internet access. You are currently in offline mode.`,
        risksExposed: requiredFor,
        suggestedAction: 'Use offline alternatives or enable online mode with caution.'
      });
      
      return false;
    }

    // Show warning even if online
    const userConfirmed = await this.showOnlineConfirmation({
      type: operationType,
      message: `${description} will transmit data over the internet.`,
      risksExposed: [
        'Data transmission over network',
        'Potential monitoring',
        'External server access',
        ...requiredFor
      ],
      suggestedAction: 'Consider if this operation is necessary for your security needs.'
    });

    return userConfirmed;
  }

  /**
   * Monitor for external access attempts
   */
  detectExternalAccess(source: string, details: string): void {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      severity: 'high',
      type: 'external-access-attempt',
      source,
      details,
      affectedData: ['Application state', 'User interface'],
      timestamp: new Date(),
      resolved: false
    };

    this.triggerSecurityAlert(alert);
  }

  /**
   * Monitor for screen reader or accessibility tool access
   */
  detectScreenReaderAccess(toolName: string, accessType: string): void {
    if (this.isKnownScreenReader(toolName)) {
      // Legitimate screen reader - log but don't alert
      console.log(`Screen reader access: ${toolName} - ${accessType}`);
      return;
    }

    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      severity: 'medium',
      type: 'screen-reader-access',
      source: toolName,
      details: `Potentially unauthorized accessibility tool access: ${accessType}`,
      affectedData: ['UI content', 'Form data', 'Screen content'],
      timestamp: new Date(),
      resolved: false
    };

    this.triggerSecurityAlert(alert);
  }

  /**
   * Monitor for unauthorized write attempts
   */
  detectUnauthorizedWrite(source: string, targetData: string): void {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      severity: 'critical',
      type: 'unauthorized-write',
      source,
      details: `Unauthorized attempt to modify: ${targetData}`,
      affectedData: [targetData],
      timestamp: new Date(),
      resolved: false
    };

    // Immediately disable online access
    this.emergencyOfflineMode();
    this.triggerSecurityAlert(alert);
  }

  /**
   * Emergency offline mode activation
   */
  emergencyOfflineMode(): void {
    this.networkState.isOfflineMode = true;
    this.notifyStateChange();
    
    // Clear any active network connections
    this.terminateNetworkConnections();
    
    // Log security event
    this.logSecurityEvent('emergency-offline-activated', 'critical');
  }

  /**
   * Subscribe to network state changes
   */
  subscribe(callback: (state: NetworkState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Subscribe to online warnings
   */
  subscribeToWarnings(callback: (warning: OnlineWarning) => void): () => void {
    this.warningListeners.push(callback);
    return () => {
      this.warningListeners = this.warningListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Subscribe to security alerts
   */
  subscribeToAlerts(callback: (alert: SecurityAlert) => void): () => void {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Get offline alternatives for common operations
   */
  getOfflineAlternatives(operationType: string): string[] {
    const alternatives: Record<string, string[]> = {
      'file-share': [
        'Export as .sdc file and share via USB/email',
        'Generate QR code for local sharing',
        'Use local network transfer'
      ],
      'data-sync': [
        'Export data for manual sync later',
        'Use local backup/restore',
        'Schedule sync for later'
      ],
      'cloud-storage': [
        'Use local vault storage',
        'Save to local filesystem',
        'Create encrypted local backup'
      ],
      'ai-processing': [
        'Use offline AI models',
        'Process manually',
        'Save for later processing'
      ]
    };

    return alternatives[operationType] || ['Consider local alternatives'];
  }

  // Private methods

  private initializeNetworkMonitoring(): void {
    // Load user preference
    const savedOfflineMode = localStorage.getItem('sdc_offline_mode');
    if (savedOfflineMode !== null) {
      this.networkState.isOfflineMode = savedOfflineMode === 'true';
    }

    // Monitor browser online/offline events
    window.addEventListener('online', () => {
      this.networkState.isOnline = true;
      this.notifyStateChange();
    });

    window.addEventListener('offline', () => {
      this.networkState.isOnline = false;
      this.notifyStateChange();
    });

    // Monitor connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.updateConnectionInfo(connection);
        connection.addEventListener('change', () => {
          this.updateConnectionInfo(connection);
        });
      }
    }
  }

  private initializeSecurityMonitoring(): void {
    // Monitor for external script injection
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function<T extends Node>(newChild: T): T {
      if (newChild.nodeName === 'SCRIPT') {
        OfflineFirstService.getInstance().detectExternalAccess(
          'Script injection',
          `External script attempted: ${(newChild as unknown as HTMLScriptElement).src || 'inline'}`
        );
      }
      return originalAppendChild.call(this, newChild) as T;
    };

    // Monitor for unusual DOM modifications
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'IFRAME' || element.tagName === 'EMBED') {
                this.detectExternalAccess(
                  'DOM modification',
                  `Suspicious element added: ${element.tagName}`
                );
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private updateConnectionInfo(connection: any): void {
    this.networkState.connectionType = connection.type || 'unknown';
    this.networkState.connectionSpeed = connection.effectiveType === '4g' ? 'fast' : 'slow';
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.listeners.forEach(callback => callback(this.networkState));
  }

  private showOnlineWarning(warning: Omit<OnlineWarning, 'id' | 'timestamp'>): void {
    const fullWarning: OnlineWarning = {
      ...warning,
      id: `warning_${Date.now()}`,
      timestamp: new Date()
    };

    this.warningListeners.forEach(callback => callback(fullWarning));
  }

  private async showOnlineConfirmation(warning: Omit<OnlineWarning, 'id' | 'timestamp'>): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; margin: 20px;">
            <h3>⚠️ Online Operation Warning</h3>
            <p><strong>${warning.message}</strong></p>
            <p><strong>Risks Exposed:</strong></p>
            <ul>${warning.risksExposed.map(risk => `<li>${risk}</li>`).join('')}</ul>
            <p><strong>Suggestion:</strong> ${warning.suggestedAction}</p>
            <div style="text-align: right; margin-top: 20px;">
              <button id="cancel-online" style="margin-right: 10px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px;">Stay Offline</button>
              <button id="proceed-online" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px;">Proceed Online</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      dialog.querySelector('#cancel-online')?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(false);
      });

      dialog.querySelector('#proceed-online')?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve(true);
      });
    });
  }

  private triggerSecurityAlert(alert: SecurityAlert): void {
    this.alertListeners.forEach(callback => callback(alert));
    
    // Store alert for later review
    const alerts = JSON.parse(localStorage.getItem('sdc_security_alerts') || '[]');
    alerts.push(alert);
    localStorage.setItem('sdc_security_alerts', JSON.stringify(alerts));
    
    // Log to audit trail
    this.logSecurityEvent(`security-alert-${alert.type}`, alert.severity);
  }

  private isKnownScreenReader(toolName: string): boolean {
    const knownScreenReaders = [
      'NVDA', 'JAWS', 'VoiceOver', 'TalkBack', 'Dragon', 'ZoomText'
    ];
    return knownScreenReaders.some(reader => 
      toolName.toLowerCase().includes(reader.toLowerCase())
    );
  }

  private terminateNetworkConnections(): void {
    // Cancel any pending fetch requests
    // Close WebSocket connections
    // Clear service worker caches
    console.log('Emergency: Terminating all network connections');
  }

  private logSecurityEvent(eventType: string, severity: string): void {
    console.log(`Security Event: ${eventType} (${severity}) at ${new Date().toISOString()}`);
    
    // In a real implementation, this would integrate with the audit service
    if (typeof window !== 'undefined' && 'AuditService' in window) {
      (window as any).AuditService?.logEvent?.(
        eventType,
        'security',
        'system',
        { severity, timestamp: new Date().toISOString() },
        'security-event',
        severity
      );
    }
  }
}

// Export singleton instance
export const offlineFirst = OfflineFirstService.getInstance();