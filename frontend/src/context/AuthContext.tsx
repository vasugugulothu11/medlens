import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Clinician' | 'Patient' | 'Administrator';
  hospital?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: 'Clinician' | 'Patient' | 'Administrator', name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'medlens_authenticated_user';

const MOCK_DEFAULT_USER: User = {
  id: 'usr_001',
  name: 'Dr. Sarah Vance, MD',
  email: 's.vance@medlens.ai',
  role: 'Clinician',
  hospital: 'St. Jude Clinical Research Center',
  avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_DEFAULT_USER;
    } catch {
      return MOCK_DEFAULT_USER;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (email: string, role: 'Clinician' | 'Patient' | 'Administrator' = 'Clinician', name?: string) => {
    const isDoctor = role === 'Clinician';
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name || (isDoctor ? 'Dr. Sarah Vance, MD' : 'Eleanor Vance'),
      email,
      role,
      hospital: isDoctor ? 'St. Jude Clinical Research Center' : undefined,
      avatar: isDoctor
        ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
