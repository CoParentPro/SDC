import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { EncryptionService } from '../../services/encryption'
import { AuditService } from '../../services/audit'
import { User, UserPreferences } from '../../types'
import { v4 as uuidv4 } from 'uuid'

interface StoredCredentials {
  passwordHash: string;
  salt: string;
  created: Date;
  lastChanged: Date;
}

interface LoginAttempt {
  timestamp: Date;
  success: boolean;
  ip: string;
}

interface SecuritySession {
  id: string;
  created: Date;
  lastActivity: Date;
  expiresAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: SecuritySession | null;
  loginAttempts: LoginAttempt[];
  twoFactorRequired: boolean;
  
  // Authentication methods
  login: (email: string, password: string, twoFactorCode?: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  
  // Security methods
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  enableTwoFactor: () => Promise<string>; // Returns setup key
  verifyTwoFactor: (code: string) => Promise<boolean>;
  disableTwoFactor: (password: string) => Promise<boolean>;
  
  // Session management
  refreshSession: () => boolean;
  isSessionValid: () => boolean;
  getSessionTimeRemaining: () => number; // minutes
  
  // Security utilities
  validatePassword: (password: string) => { valid: boolean; errors: string[] };
  getLoginHistory: () => LoginAttempt[];
  clearLoginHistory: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      session: null,
      loginAttempts: [],
      twoFactorRequired: false,

      login: async (email: string, password: string, twoFactorCode?: string) => {
        set({ isLoading: true });
        
        try {
          // Get stored credentials
          const credentialsKey = `credentials_${email}`;
          const storedCredentials = localStorage.getItem(credentialsKey);
          
          if (!storedCredentials) {
            await AuditService.logEvent('login-failed', 'authentication', email, 
              { reason: 'user_not_found' }, 'authentication', 'medium');
            
            get().recordLoginAttempt(false);
            set({ isLoading: false });
            return false;
          }

          const credentials: StoredCredentials = JSON.parse(storedCredentials);
          
          // Verify password
          const isValidPassword = EncryptionService.verifyPassword(
            password, 
            credentials.passwordHash, 
            credentials.salt
          );

          if (!isValidPassword) {
            await AuditService.logEvent('login-failed', 'authentication', email,
              { reason: 'invalid_password' }, 'authentication', 'high');
            
            get().recordLoginAttempt(false);
            set({ isLoading: false });
            return false;
          }

          // Get user data
          const userKey = `user_${email}`;
          const userData = localStorage.getItem(userKey);
          
          if (!userData) {
            set({ isLoading: false });
            return false;
          }

          const user: User = JSON.parse(userData);
          
          // Check if 2FA is required
          if (user.preferences.security.twoFactorEnabled && !twoFactorCode) {
            set({ twoFactorRequired: true, isLoading: false });
            return false;
          }

          // Verify 2FA if provided
          if (user.preferences.security.twoFactorEnabled && twoFactorCode) {
            const isValid2FA = await get().verifyTwoFactor(twoFactorCode);
            if (!isValid2FA) {
              await AuditService.logEvent('login-failed', 'authentication', email,
                { reason: 'invalid_2fa' }, 'authentication', 'high');
              
              get().recordLoginAttempt(false);
              set({ isLoading: false });
              return false;
            }
          }

          // Create session
          const session: SecuritySession = {
            id: uuidv4(),
            created: new Date(),
            lastActivity: new Date(),
            expiresAt: new Date(Date.now() + user.preferences.security.sessionTimeout * 60 * 1000),
          };

          // Update last login
          user.lastLogin = new Date();
          localStorage.setItem(userKey, JSON.stringify(user));

          // Log successful login
          await AuditService.logEvent('login-success', 'authentication', email,
            { session_id: session.id }, 'authentication', 'low');

          get().recordLoginAttempt(true);
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false, 
            session,
            twoFactorRequired: false 
          });
          
          return true;
        } catch (error) {
          console.error('Login error:', error);
          await AuditService.logEvent('login-error', 'authentication', email,
            { error: error instanceof Error ? error.message : 'unknown' }, 'authentication', 'medium');
          
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        const state = get();
        if (state.user && state.session) {
          await AuditService.logEvent('logout', 'authentication', state.user.email,
            { session_id: state.session.id }, 'authentication', 'low');
        }
        
        set({ 
          user: null, 
          isAuthenticated: false, 
          session: null, 
          twoFactorRequired: false 
        });
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        
        try {
          // Validate password strength
          const validation = get().validatePassword(password);
          if (!validation.valid) {
            set({ isLoading: false });
            return false;
          }

          // Check if user already exists
          const credentialsKey = `credentials_${email}`;
          const existingCredentials = localStorage.getItem(credentialsKey);
          
          if (existingCredentials) {
            await AuditService.logEvent('registration-failed', 'authentication', email,
              { reason: 'user_exists' }, 'authentication', 'medium');
            
            set({ isLoading: false });
            return false;
          }

          // Hash password
          const { hash, salt } = EncryptionService.hashPassword(password);
          
          // Store credentials
          const credentials: StoredCredentials = {
            passwordHash: hash,
            salt,
            created: new Date(),
            lastChanged: new Date(),
          };
          
          localStorage.setItem(credentialsKey, JSON.stringify(credentials));

          // Create user
          const user: User = {
            id: uuidv4(),
            email,
            name,
            role: 'user',
            createdAt: new Date(),
            preferences: {
              theme: 'dark',
              language: 'en',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              notifications: {
                email: true,
                push: true,
                sound: true,
                desktop: true,
              },
              security: {
                twoFactorEnabled: false,
                sessionTimeout: 30, // 30 minutes
                passwordChangeRequired: false,
                loginNotifications: true,
              },
            },
          };

          // Store user data
          const userKey = `user_${email}`;
          localStorage.setItem(userKey, JSON.stringify(user));

          // Log registration
          await AuditService.logEvent('registration-success', 'authentication', email,
            { user_id: user.id }, 'authentication', 'low');

          // Create session
          const session: SecuritySession = {
            id: uuidv4(),
            created: new Date(),
            lastActivity: new Date(),
            expiresAt: new Date(Date.now() + user.preferences.security.sessionTimeout * 60 * 1000),
          };

          set({ user, isAuthenticated: true, isLoading: false, session });
          return true;
        } catch (error) {
          console.error('Registration error:', error);
          await AuditService.logEvent('registration-error', 'authentication', email,
            { error: error instanceof Error ? error.message : 'unknown' }, 'authentication', 'medium');
          
          set({ isLoading: false });
          return false;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        const state = get();
        if (!state.user) return false;

        try {
          // Validate new password
          const validation = get().validatePassword(newPassword);
          if (!validation.valid) return false;

          // Get stored credentials
          const credentialsKey = `credentials_${state.user.email}`;
          const storedCredentials = localStorage.getItem(credentialsKey);
          
          if (!storedCredentials) return false;

          const credentials: StoredCredentials = JSON.parse(storedCredentials);
          
          // Verify current password
          const isValidPassword = EncryptionService.verifyPassword(
            currentPassword, 
            credentials.passwordHash, 
            credentials.salt
          );

          if (!isValidPassword) {
            await AuditService.logEvent('password-change-failed', 'authentication', state.user.email,
              { reason: 'invalid_current_password' }, 'authentication', 'high');
            return false;
          }

          // Hash new password
          const { hash, salt } = EncryptionService.hashPassword(newPassword);
          
          // Update credentials
          const updatedCredentials: StoredCredentials = {
            ...credentials,
            passwordHash: hash,
            salt,
            lastChanged: new Date(),
          };
          
          localStorage.setItem(credentialsKey, JSON.stringify(updatedCredentials));

          await AuditService.logEvent('password-changed', 'authentication', state.user.email,
            {}, 'authentication', 'medium');

          return true;
        } catch (error) {
          console.error('Password change error:', error);
          return false;
        }
      },

      enableTwoFactor: async () => {
        // Generate TOTP secret (simplified for demo)
        const secret = EncryptionService.generatePassword(32);
        
        const state = get();
        if (state.user) {
          const userKey = `user_${state.user.email}`;
          const updatedUser = {
            ...state.user,
            preferences: {
              ...state.user.preferences,
              security: {
                ...state.user.preferences.security,
                twoFactorEnabled: true,
              }
            }
          };
          
          localStorage.setItem(userKey, JSON.stringify(updatedUser));
          localStorage.setItem(`2fa_secret_${state.user.email}`, secret);
          
          set({ user: updatedUser });
          
          await AuditService.logEvent('2fa-enabled', 'authentication', state.user.email,
            {}, 'authentication', 'low');
        }
        
        return secret;
      },

      verifyTwoFactor: async (code: string) => {
        // Simplified 2FA verification - in real app would use TOTP library
        const state = get();
        if (!state.user) return false;
        
        const secret = localStorage.getItem(`2fa_secret_${state.user.email}`);
        if (!secret) return false;
        
        // For demo purposes, accept any 6-digit code
        return code.length === 6 && /^\d+$/.test(code);
      },

      disableTwoFactor: async (password: string) => {
        const state = get();
        if (!state.user) return false;

        try {
          // Verify password first
          const credentialsKey = `credentials_${state.user.email}`;
          const storedCredentials = localStorage.getItem(credentialsKey);
          
          if (!storedCredentials) return false;

          const credentials: StoredCredentials = JSON.parse(storedCredentials);
          
          const isValidPassword = EncryptionService.verifyPassword(
            password, 
            credentials.passwordHash, 
            credentials.salt
          );

          if (!isValidPassword) return false;

          // Disable 2FA
          const userKey = `user_${state.user.email}`;
          const updatedUser = {
            ...state.user,
            preferences: {
              ...state.user.preferences,
              security: {
                ...state.user.preferences.security,
                twoFactorEnabled: false,
              }
            }
          };
          
          localStorage.setItem(userKey, JSON.stringify(updatedUser));
          localStorage.removeItem(`2fa_secret_${state.user.email}`);
          
          set({ user: updatedUser });
          
          await AuditService.logEvent('2fa-disabled', 'authentication', state.user.email,
            {}, 'authentication', 'medium');

          return true;
        } catch (error) {
          console.error('Disable 2FA error:', error);
          return false;
        }
      },

      refreshSession: () => {
        const state = get();
        if (!state.session || !state.user) return false;

        const now = new Date();
        if (now > state.session.expiresAt) {
          get().logout();
          return false;
        }

        // Extend session
        const updatedSession = {
          ...state.session,
          lastActivity: now,
          expiresAt: new Date(now.getTime() + state.user.preferences.security.sessionTimeout * 60 * 1000),
        };

        set({ session: updatedSession });
        return true;
      },

      isSessionValid: () => {
        const state = get();
        if (!state.session) return false;
        
        return new Date() <= state.session.expiresAt;
      },

      getSessionTimeRemaining: () => {
        const state = get();
        if (!state.session) return 0;
        
        const remaining = state.session.expiresAt.getTime() - Date.now();
        return Math.max(0, Math.floor(remaining / (1000 * 60))); // minutes
      },

      validatePassword: (password: string) => {
        const errors: string[] = [];
        
        if (password.length < 8) {
          errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[A-Z]/.test(password)) {
          errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(password)) {
          errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/\d/.test(password)) {
          errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
          errors.push('Password must contain at least one special character');
        }
        
        return {
          valid: errors.length === 0,
          errors,
        };
      },

      getLoginHistory: () => {
        return get().loginAttempts;
      },

      clearLoginHistory: () => {
        set({ loginAttempts: [] });
      },

      // Private helper method
      recordLoginAttempt: (success: boolean) => {
        const state = get();
        const attempt: LoginAttempt = {
          timestamp: new Date(),
          success,
          ip: '127.0.0.1', // Would be actual IP in real app
        };
        
        const updatedAttempts = [...state.loginAttempts, attempt]
          .slice(-10) // Keep only last 10 attempts
          .filter(a => a.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)); // Last 24 hours
        
        set({ loginAttempts: updatedAttempts });
      },
    }),
    {
      name: 'sdc-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        session: state.session,
        loginAttempts: state.loginAttempts,
      }),
    }
  )
);