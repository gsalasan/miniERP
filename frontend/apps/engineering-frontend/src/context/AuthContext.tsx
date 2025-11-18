import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  
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

  // Load user from localStorage on mount
  const previousTokenRef = useRef<string | null>(null);

  // Central bootstrap: always prefer URL token if present, otherwise localStorage. If token changes, refresh user.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      // Always override token if provided in URL
      localStorage.setItem("token", tokenFromUrl);
      setToken(tokenFromUrl);
      // Remove token param from URL
      urlParams.delete("token");
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, document.title, newUrl);
    } else {
      const storedToken = localStorage.getItem("token");
      if (storedToken) setToken(storedToken);
    }

    const initToken = localStorage.getItem("token") || tokenFromUrl || null;
    previousTokenRef.current = initToken;

    if (initToken) {
      refreshUser(initToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    // Listen for token/user changes from other tabs or programmatic updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" && e.newValue && e.newValue !== previousTokenRef.current) {
        previousTokenRef.current = e.newValue;
        setToken(e.newValue);
        refreshUser(e.newValue);
      }
      if (e.key === "user" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUser(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Helper function untuk load dari localStorage
  async function refreshUser(_activeToken: string) {
    try {
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
    } catch {
      // If fetching user fails, keep existing state
    }
  }

  const login = async (email: string, password: string) => {
    const response = await identityApi.login(email, password);
    if (!response.data.success) throw new Error(response.data.message || "Login failed");
    const { token: newToken, data: userData } = response.data;
    // Clear any stale cached user before setting new
    localStorage.setItem("token", newToken);
    setToken(newToken);
    const mappedUser: User = {
      userId: userData.id,
      email: userData.email,
      name: userData.name || userData.email,
      roles: userData.roles || [],
    };
    setUser(mappedUser);
    localStorage.setItem("user", JSON.stringify(mappedUser));
    previousTokenRef.current = newToken;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Do not full clear to preserve other app data
    window.location.href = "/login";
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
