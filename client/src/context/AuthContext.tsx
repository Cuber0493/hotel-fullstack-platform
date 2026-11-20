import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api, setAccessToken, getAccessToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  isStaff: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silent session restore on app launch using httpOnly refresh token cookie
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        if (!isMounted) return;

        const newAccessToken = refreshRes.data.accessToken;
        setAccessToken(newAccessToken);

        if (refreshRes.data.user) {
          setUser(refreshRes.data.user);
        } else {
          const meRes = await api.get('/auth/me');
          if (isMounted) setUser(meRes.data.user);
        }
      } catch {
        // Unauthenticated visitor: in-memory token stays null, user stays null
        if (isMounted) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: loggedInUser } = res.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<User> => {
    const res = await api.post('/auth/register', { email, password, name, phone });
    const { accessToken, user: registeredUser } = res.data;
    setAccessToken(accessToken);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network errors
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token: getAccessToken(),
        isLoading,
        login,
        register,
        logout,
        isStaff,
        isAdmin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
