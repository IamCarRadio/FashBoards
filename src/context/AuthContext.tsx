import React, { createContext, useContext, useState } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'CEO' | 'COO' | 'CFO' | 'Medical Director' | 'Branch Manager';
  avatar?: string;
  branchesAccessible: string[];
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
}

const DEFAULT_CEO_USER: UserProfile = {
  id: 'ceo-usr-001',
  name: 'Dr. Vikram Malhotra',
  email: 'v.malhotra@ceopulse.health',
  role: 'CEO',
  avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  branchesAccessible: ['all'],
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_CEO_USER,
  isAuthenticated: true,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stored state ready for Firebase auth plug-in
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_CEO_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const login = async (_email?: string, _password?: string) => {
    // When real Firebase auth is plugged in, signInWithEmailAndPassword will go here
    setIsAuthenticated(true);
    setUser(DEFAULT_CEO_USER);
  };

  const logout = async () => {
    // When real Firebase auth is plugged in, signOut(auth) will go here
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
