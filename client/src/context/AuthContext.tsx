import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<User>;
  logout: () => void;
  isStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('tbr_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('tbr_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiRequest<{ user: User }>('/auth/me');
        setUser(res.user);
      } catch (err) {
        localStorage.removeItem('tbr_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('tbr_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ): Promise<User> => {
    const res = await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, phone }),
    });

    localStorage.setItem('tbr_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('tbr_token');
    setToken(null);
    setUser(null);
  };

  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isStaff,
        isAdmin,
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
