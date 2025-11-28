import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { identityApi } from '../api/identityApi';

interface UserData {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  roles?: string[]; // array from identity service
  role?: string; // fallback single role for legacy checks
  department?: string;
  username?: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  canAssignPm: () => boolean;
  canEditBom: () => boolean;
  canViewProjects: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrapTokenAndUser();
  }, []);

  // Bootstrap similar to engineering: URL token > fresh cross-app token > stored token
  const bootstrapTokenAndUser = async () => {
    try {
      console.log('[AUTH] Bootstrap starting...');
      const params = new URLSearchParams(window.location.search);
      // Accept both `token` (legacy) and `cross_app_token` (main dashboard)
      const urlToken = params.get('token') || params.get('cross_app_token');
      let activeToken: string | null = null;

      if (urlToken) {
        console.log('[AUTH] Token found in URL, length:', urlToken.length);
        localStorage.setItem('token', urlToken);
        activeToken = urlToken;
        // remove both possible param names from URL
        params.delete('token');
        params.delete('cross_app_token');
        const cleaned = params.toString();
        const newUrl = window.location.pathname + (cleaned ? `?${cleaned}` : '');
        window.history.replaceState({}, '', newUrl);
        console.log('[AUTH] URL cleaned');
      } else {
        console.log('[AUTH] No URL token, checking cross_app_token...');
        const crossToken = localStorage.getItem('cross_app_token');
        const crossUser = localStorage.getItem('cross_app_user');
        const crossTs = localStorage.getItem('cross_app_timestamp');
        if (crossToken && crossTs) {
          const age = Date.now() - parseInt(crossTs, 10);
          console.log('[AUTH] Cross-app token age:', age, 'ms');
          if (age < 30000) {
            // 30s freshness window
            console.log('[AUTH] Using cross-app token');
            localStorage.setItem('token', crossToken);
            activeToken = crossToken;
            if (crossUser) {
              try {
                const raw = JSON.parse(crossUser);
                const mapped: UserData = {
                  id: raw.id || raw.userId || '',
                  email: raw.email,
                  full_name: raw.full_name || raw.name,
                  name: raw.name || raw.full_name,
                  roles: raw.roles || [],
                  role: (raw.roles && raw.roles[0]) || raw.role,
                };
                setUser(mapped);
                localStorage.setItem('user', JSON.stringify(mapped));
                console.log('[AUTH] Cross-app user set:', mapped.email);
              } catch (e) {
                console.log('[AUTH] Failed to parse cross-app user');
              }
            }
          } else {
            console.log('[AUTH] Cross-app token expired');
          }
          // Clean up cross-app residue regardless
          localStorage.removeItem('cross_app_token');
          localStorage.removeItem('cross_app_user');
          localStorage.removeItem('cross_app_timestamp');
        } else {
          console.log('[AUTH] No cross-app token');
        }
      }

      if (!activeToken) {
        activeToken = localStorage.getItem('token');
        console.log(
          '[AUTH] Using stored token:',
          activeToken ? 'exists' : 'none'
        );
      }

      if (activeToken) {
        console.log(
          '[AUTH] Setting token to state, length:',
          activeToken.length
        );
        setToken(activeToken);
        console.log('[AUTH] Token state updated, checking cached user...');
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            setUser(parsed);
            console.log('[AUTH] Using cached user:', parsed.email);
            console.log('[AUTH] Setting isLoading to FALSE (cached path)');
            setIsLoading(false);
            // Also refresh silently in background
            refreshUser(activeToken, true);
            return;
          } catch {
            console.log('[AUTH] Cached user parse failed');
          }
        }
        console.log('[AUTH] Fetching user from server...');
        await refreshUser(activeToken);
      } else {
        console.log('[AUTH] No token found anywhere');
        console.log('[AUTH] Setting isLoading to FALSE (no token)');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[AUTH] Bootstrap failed:', err);
      setIsLoading(false);
    }
  };

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          setToken(e.newValue);
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (err) {
              console.error('Failed to parse user from storage event:', err);
            }
          }
        } else {
          // Token was removed in another tab
          setToken(null);
          setUser(null);
        }
      } else if (e.key === 'user' && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse user from storage event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refreshUser = async (authToken: string, background = false) => {
    try {
      if (!background) setIsLoading(true);
      const profile: any = await identityApi.getCurrentUser();
      if (!profile) throw new Error('No profile');
      const mapped: UserData = {
        id: profile.id || '',
        email: profile.email,
        full_name: profile.full_name || profile.name,
        name: profile.name || profile.full_name,
        roles: profile.roles || [],
        role: (profile.roles && profile.roles[0]) || profile.role,
        department: profile.department,
      };
      setUser(mapped);
      localStorage.setItem('user', JSON.stringify(mapped));
      console.log('[AUTH] User refreshed successfully:', mapped.email);
      if (!background) setIsLoading(false);
    } catch (error: any) {
      console.error('[AUTH] Failed to refresh user:', error);
      // Don't remove token on network errors (CORS, connection issues)
      // Only remove on 401/403 authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.error('[AUTH] Authentication failed, removing token');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } else {
        console.warn('[AUTH] Network error, keeping token for retry');
      }
    } finally {
      if (!background) setIsLoading(false);
    }
  };

  const login = (newToken: string, userData: UserData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cross_app_token');
    localStorage.removeItem('cross_app_timestamp');
    localStorage.removeItem('cross_app_user');
    // Redirect to main dashboard login
    const mainDashboardUrl = `${window.location.protocol}//${window.location.hostname}:3000/?redirect=project-frontend`;
    window.location.href = mainDashboardUrl;
  };

  // Legacy refresh for external callers (without background flag)
  const legacyRefreshUser = async () => {
    if (!token) return;
    await refreshUser(token);
  };

  // Role-based permission helpers

  // Normalize all roles to uppercase for comparison
  const getUserRoles = (): string[] => {
    if (!user) return [];
    const rolesArr = user.roles && user.roles.length > 0 ? user.roles : (user.role ? [user.role] : []);
    return rolesArr.map((r) => (r || '').toString().toUpperCase());
  };

  const hasRole = (role: string): boolean => {
    const userRoles = getUserRoles();
    return userRoles.includes(role.toUpperCase());
  };

  const hasAnyRole = (roles: string[]): boolean => {
    const userRoles = getUserRoles();
    const allowed = roles.map((r) => r.toUpperCase());
    return userRoles.some((r) => allowed.includes(r));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    const userRoles = getUserRoles();
    const allowed = roles.map((r) => r.toUpperCase());
    return allowed.every((r) => userRoles.includes(r));
  };

  // Project-specific permissions
  const canAssignPm = (): boolean => {
    return hasAnyRole([
      'admin',
      'ceo',
      'operational_manager',
      'operations_manager',
    ]);
  };

  const canEditBom = (): boolean => {
    return hasAnyRole(['admin', 'project_manager', 'engineer']);
  };

  const canViewProjects = (): boolean => {
    return hasAnyRole([
      'admin',
      'operations_manager',
      'project_manager',
      'sales',
      'engineer',
    ]);
  };

  const value: AuthContextType = {
    user,
    token,
    // Consider authenticated if token exists; user may still be loading
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    refreshUser: legacyRefreshUser,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAssignPm,
    canEditBom,
    canViewProjects,
  };

  // Debug logging for auth state changes
  useEffect(() => {
    console.log('[AUTH STATE] Changed:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasUser: !!user,
      userEmail: user?.email,
      isAuthenticated: !!token,
      isLoading,
    });
  }, [token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
