import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse, UserRole } from '../types';
import { authService, LoginPayload, RegisterPayload } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('sx_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sx_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Refresh profile on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          localStorage.setItem('sx_user', JSON.stringify(freshUser));
        } catch {
          // Invalid or expired token
          setToken(null);
          setUser(null);
          localStorage.removeItem('sx_token');
          localStorage.removeItem('sx_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const saveSession = (access_token: string, userObj: User) => {
    setToken(access_token);
    setUser(userObj);
    localStorage.setItem('sx_token', access_token);
    localStorage.setItem('sx_user', JSON.stringify(userObj));
  };

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await authService.login(payload);
    saveSession(res.access_token, res.user);
    return res;
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await authService.register(payload);
    saveSession(res.access_token, res.user);
    return res;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('sx_token');
    localStorage.removeItem('sx_user');
  };

  const refreshUser = async (): Promise<User | null> => {
    if (!token) return null;
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      localStorage.setItem('sx_user', JSON.stringify(freshUser));
      return freshUser;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isLoggedIn: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
