import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // TODO: Implement actual authentication logic with local encryption
          // For now, create a mock user
          const user: User = {
            id: Date.now().toString(),
            email,
            name: email.split('@')[0],
            createdAt: new Date(),
          };
          
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        
        try {
          // TODO: Implement actual registration logic with local encryption
          const user: User = {
            id: Date.now().toString(),
            email,
            name,
            createdAt: new Date(),
          };
          
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'sdc-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);