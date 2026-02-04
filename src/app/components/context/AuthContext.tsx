import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Add to login history
    const loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
    loginHistory.unshift({
      id: Date.now(),
      user: userData.name,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ip: '192.168.1.' + Math.floor(Math.random() * 255),
      device: navigator.userAgent.includes('Chrome') 
        ? 'Chrome ' + navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] + ' / ' + (navigator.platform.includes('Win') ? 'Windows' : navigator.platform.includes('Mac') ? 'macOS' : 'Linux')
        : 'Unknown Browser',
      status: 'Success',
    });
    // Keep only last 20 entries
    localStorage.setItem('loginHistory', JSON.stringify(loginHistory.slice(0, 20)));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
