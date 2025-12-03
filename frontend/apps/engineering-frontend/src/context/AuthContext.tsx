import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { identityApi } from "../api/identityApi";

export interface User {
  userId: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  
  // Role helper functions
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isProjectManager: () => boolean;
  isProjectEngineer: () => boolean;
  canCreateMaterial: () => boolean;
  canEditMaterial: () => boolean;
  canDeleteMaterial: () => boolean;
  canCreateService: () => boolean;
  canEditService: () => boolean;
  canDeleteService: () => boolean;
  canCreateEstimation: () => boolean;
  canEditEstimation: () => boolean;
  canDeleteEstimation: () => boolean;
  canAssignEstimation: () => boolean;
  canStartEstimation: () => boolean;
  canSubmitEstimation: () => boolean;
  canManageTaxonomy: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrapTokenAndUser();
  }, []);

  // Bootstrap similar to project-frontend: URL token > fresh cross-app token > stored token
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
                const mapped: User = {
                  userId: raw.id || raw.userId || '',
                  email: raw.email,
                  name: raw.full_name || raw.name,
                  roles: raw.roles || [],
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
      if (e.key === 'token' && e.newValue) {
        console.log('[AUTH] Token changed in another tab');
        setToken(e.newValue);
        refreshUser(e.newValue);
      }
      if (e.key === 'user' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUser(parsed);
          console.log('[AUTH] User synced from another tab');
        } catch {
          console.log('[AUTH] Failed to parse user from storage event');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper function untuk refresh user
  async function refreshUser(_activeToken: string, silent = false) {
    try {
      if (!silent) console.log('[AUTH] Refreshing user from API...');
      const profile = await identityApi.getCurrentUser();
      if (profile && (profile.id || profile.email)) {
        interface ProfileShape {
          full_name?: string;
          name?: string;
          email?: string;
          roles?: string[];
          id?: string;
        }
        const p = profile as ProfileShape;
        const fullName = p.full_name || p.name || p.email || "";
        const rolesArr = p.roles || [];
        const updatedUser: User = {
          userId: profile.id || "",
          email: profile.email || "",
          name: fullName,
          roles: rolesArr,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        // token already set
      }
      if (!silent) console.log('[AUTH] User refreshed successfully');
    } catch (err) {
      if (!silent) console.log('[AUTH] Failed to refresh user:', err);
      // If fetching user fails, keep existing state
    } finally {
      if (!silent) {
        console.log('[AUTH] Setting isLoading to FALSE');
        setIsLoading(false);
      }
    }
  }

  const login = (newToken: string, userData: User) => {
    console.log('[AUTH] Login called with token and user data');
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    console.log('[AUTH] Logout called');
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem('cross_app_token');
    localStorage.removeItem('cross_app_timestamp');
    localStorage.removeItem('cross_app_user');
    // Redirect to main dashboard
    const mainDashboardUrl = `${window.location.protocol}//${window.location.hostname}:3000/?redirect=engineering-frontend`;
    window.location.href = mainDashboardUrl;
  };

  // Public refresh function for external calls
  const publicRefreshUser = async () => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      await refreshUser(currentToken);
    }
  };

  // Role helper functions
  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every((role) => hasRole(role));
  };

  const isProjectManager = (): boolean => {
    return hasRole("PROJECT_MANAGER");
  };

  const isProjectEngineer = (): boolean => {
    return hasRole("PROJECT_ENGINEER");
  };

  // Materials permissions
  const canCreateMaterial = (): boolean => {
    // Allow PM and PE to add items, aligned with estimation modals
    return isProjectManager() || isProjectEngineer();
  };

  const canEditMaterial = (): boolean => {
    return isProjectManager();
  };

  const canDeleteMaterial = (): boolean => {
    return isProjectManager();
  };

  // Services permissions
  const canCreateService = (): boolean => {
    // Allow PM and PE to add services
    return isProjectManager() || isProjectEngineer();
  };

  const canEditService = (): boolean => {
    return isProjectManager();
  };

  const canDeleteService = (): boolean => {
    return isProjectManager();
  };

  // Estimation permissions
  const canCreateEstimation = (): boolean => {
    return isProjectManager();
  };

  const canEditEstimation = (): boolean => {
    return isProjectManager();
  };

  const canDeleteEstimation = (): boolean => {
    return isProjectManager();
  };

  const canAssignEstimation = (): boolean => {
    // Hanya CEO dan PROJECT_MANAGER yang boleh assign
    return hasAnyRole(["CEO", "PROJECT_MANAGER"]);
  };

  const canStartEstimation = (): boolean => {
    return isProjectEngineer();
  };

  const canSubmitEstimation = (): boolean => {
    return isProjectEngineer();
  };

  // Taxonomy permissions
  const canManageTaxonomy = (): boolean => {
    return isProjectManager();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
    refreshUser: publicRefreshUser,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isProjectManager,
    isProjectEngineer,
    canCreateMaterial,
    canEditMaterial,
    canDeleteMaterial,
    canCreateService,
    canEditService,
    canDeleteService,
    canCreateEstimation,
    canEditEstimation,
    canDeleteEstimation,
    canAssignEstimation,
    canStartEstimation,
    canSubmitEstimation,
    canManageTaxonomy,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
