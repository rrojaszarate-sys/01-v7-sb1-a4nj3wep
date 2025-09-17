import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'Administrador' | 'Ejecutivo' | 'Visualizador';
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUserRole: (role: 'Administrador' | 'Ejecutivo' | 'Visualizador') => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const setUserRole = (role: 'Administrador' | 'Ejecutivo' | 'Visualizador') => {
    const mockUser: User = {
      id: `temp-${role.toLowerCase().replace(' ', '-')}`,
      username: `${role} Usuario`,
      email: `${role.toLowerCase().replace(' ', '')}@made.com`,
      role: role,
      created_at: new Date().toISOString()
    };
    setUser(mockUser);
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUserRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}