import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthService } from "../utils/mockAuth";

interface UserData {
  id: string;
  email: string;
  name?: string;
  roles: string[];
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      // Accept cross-app token via URL for first-time entry
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("cross_app_token");
      if (urlToken) {
        localStorage.setItem("authToken", urlToken);
        // Clean token from URL
        const url = new URL(window.location.href);
        url.searchParams.delete("cross_app_token");
        window.history.replaceState({}, "", url.toString());
      }

      // Get token from localStorage (after possible URL set)
      let authToken = localStorage.getItem("authToken");

      if (!authToken) {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(authToken);

      // Check if token is valid (not expired)
      try {
        const payload = JSON.parse(atob(authToken.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp <= now;

        if (isExpired) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("authToken");
          return;
        }
      } catch {
        setUser(null);
        setToken(null);
        localStorage.removeItem("authToken");
        return;
      }

      // Verify token with server
      try {
        const response = await fetch("http://localhost:4000/api/v1/auth/me", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.data);
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem("authToken");
        }
      } catch {
        // Fallback: decode token manually
        try {
          const payload = JSON.parse(atob(authToken.split(".")[1]));
          const userData: UserData = {
            id: payload.id,
            email: payload.email,
            name: payload.name || payload.full_name || payload.fullName || undefined,
            roles: payload.roles || [],
          };
          setUser(userData);
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem("authToken");
        }
      }
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("authToken");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { user: userData, token: authToken } = await AuthService.login(email, password);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook untuk menggunakan AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// HOC untuk protected routes - DISEDERHANAKAN
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>Loading authentication...</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Checking token and verifying with server...
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect ke main frontend login
      window.location.href = "http://localhost:3000/login";
      return null;
    }

    return <Component {...props} />;
  };
};
