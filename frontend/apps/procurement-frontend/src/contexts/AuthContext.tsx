import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
      console.log('[Procurement Auth] 🔄 Checking authentication...');
      
      // 1. Accept cross-app token via URL for first-time entry (from main frontend)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("cross_app_token");
      const ssoToken = params.get("ssoToken");
      const ssoUserParam = params.get("ssoUser");
      
      console.log('[Procurement Auth] URL params:', {
        hasUrlToken: !!urlToken,
        hasSsoToken: !!ssoToken,
        hasSsoUser: !!ssoUserParam
      });

      // Handle ssoToken from URL (preferred method)
      if (ssoToken) {
        localStorage.setItem("token", ssoToken);
        localStorage.setItem("authToken", ssoToken);
        console.log('[Procurement Auth] ✅ SSO token applied from URL');
      }

      // Handle ssoUser from URL
      if (ssoUserParam) {
        try {
          const decoded = atob(ssoUserParam);
          const ssoUser = JSON.parse(decoded);
          localStorage.setItem("user", JSON.stringify(ssoUser));
          if (ssoUser?.roles) {
            localStorage.setItem("roles", JSON.stringify(ssoUser.roles));
            console.log('[Procurement Auth] ✅ SSO roles stored:', ssoUser.roles);
          }
          if (ssoUser?.id) {
            const idStr = String(ssoUser.id);
            localStorage.setItem("userId", idStr);
            localStorage.setItem("user_id", idStr);
          }
          console.log('[Procurement Auth] ✅ SSO user applied from URL');
        } catch (e) {
          console.error('[Procurement Auth] ❌ Failed to parse SSO user from URL', e);
        }
      }

      // Handle cross_app_token from URL (legacy method)
      if (urlToken) {
        console.log('[Procurement Auth] ✅ Cross-app token found in URL');
        localStorage.setItem("authToken", urlToken);
        localStorage.setItem("token", urlToken);
        // Clean token from URL
        const url = new URL(window.location.href);
        url.searchParams.delete("cross_app_token");
        url.searchParams.delete("ssoToken");
        url.searchParams.delete("ssoUser");
        url.searchParams.delete("ssoTs");
        window.history.replaceState({}, "", url.toString());
      }

      // 2. Check for cross_app data in localStorage (set by main frontend)
      const crossAppToken = localStorage.getItem('cross_app_token');
      const crossAppUser = localStorage.getItem('cross_app_user');
      const crossAppTimestamp = localStorage.getItem('cross_app_timestamp');
      
      console.log('[Procurement Auth] Cross-app data:', {
        hasToken: !!crossAppToken,
        hasUser: !!crossAppUser,
        timestamp: crossAppTimestamp
      });
      
      // Check if cross-app data is still valid (within 30 seconds)
      const now = Date.now();
      const timestamp = crossAppTimestamp ? parseInt(crossAppTimestamp) : 0;
      const isValid = (now - timestamp) < 30000;
      
      if (crossAppToken && crossAppUser && isValid) {
        console.log('[Procurement Auth] ✅ Using valid cross-app data');
        localStorage.setItem('token', crossAppToken);
        localStorage.setItem('authToken', crossAppToken);
        localStorage.setItem('user', crossAppUser);
        
        try {
          const userObj = JSON.parse(crossAppUser);
          if (userObj.roles) {
            localStorage.setItem('roles', JSON.stringify(userObj.roles));
          }
          if (userObj.id) {
            const idStr = String(userObj.id);
            localStorage.setItem('userId', idStr);
            localStorage.setItem('user_id', idStr);
          }
        } catch (e) {
          console.error('[Procurement Auth] ❌ Error parsing cross-app user:', e);
        }
      }

      // 3. Get token from localStorage
      let authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
      console.log('[Procurement Auth] Token from localStorage:', authToken ? '✅ Found' : '❌ Not found');

      if (!authToken) {
        console.log('[Procurement Auth] ⚠️ No token found, user not authenticated');
        setUser(null);
        setToken(null);
        return;
      }

      setToken(authToken);

      // 4. Check if token is valid (not expired)
      try {
        const payload = JSON.parse(atob(authToken.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        const isExpired = payload.exp <= now;

        if (isExpired) {
          console.log('[Procurement Auth] ⚠️ Token expired');
          setUser(null);
          setToken(null);
          localStorage.removeItem("authToken");
          localStorage.removeItem("token");
          return;
        }

        console.log('[Procurement Auth] ✅ Token valid, exp:', new Date(payload.exp * 1000).toISOString());
      } catch (e) {
        console.error('[Procurement Auth] ❌ Error checking token expiry:', e);
        setUser(null);
        setToken(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
        return;
      }

      // 5. Try to verify token with server
      try {
        const response = await fetch("http://localhost:4000/api/v1/auth/me", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log('[Procurement Auth] ✅ Token verified with server:', data.data);
          const userData: UserData = {
            id: data.data.id,
            email: data.data.email,
            name: data.data.name || data.data.full_name || data.data.fullName || undefined,
            roles: data.data.roles || [],
          };
          setUser(userData);
          
          // Store roles in localStorage for easy access
          localStorage.setItem('roles', JSON.stringify(userData.roles));
          localStorage.setItem('user', JSON.stringify(userData));
          if (userData.id) {
            const idStr = String(userData.id);
            localStorage.setItem('userId', idStr);
            localStorage.setItem('user_id', idStr);
          }
          return;
        } else {
          console.log('[Procurement Auth] ⚠️ Server verification failed');
        }
      } catch (e) {
        console.log('[Procurement Auth] ⚠️ Server verification error, using fallback:', e);
      }

      // 6. Fallback: decode token manually or use localStorage user
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const userData = JSON.parse(userString);
          console.log('[Procurement Auth] ✅ Using user from localStorage:', userData);
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.full_name || userData.fullName || undefined,
            roles: userData.roles || [],
          });
          
          // Ensure roles are stored
          if (userData.roles) {
            localStorage.setItem('roles', JSON.stringify(userData.roles));
          }
          return;
        } catch (e) {
          console.error('[Procurement Auth] ❌ Error parsing user from localStorage:', e);
        }
      }

      // 7. Last resort: decode from token
      try {
        const payload = JSON.parse(atob(authToken.split(".")[1]));
        console.log('[Procurement Auth] 📦 Token payload:', payload);
        const userData: UserData = {
          id: payload.id,
          email: payload.email,
          name: payload.name || payload.full_name || payload.fullName || undefined,
          roles: payload.roles || [],
        };
        console.log('[Procurement Auth] ✅ User extracted from token');
        setUser(userData);
        
        // Store for future use
        localStorage.setItem('roles', JSON.stringify(userData.roles));
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.id) {
          const idStr = String(userData.id);
          localStorage.setItem('userId', idStr);
          localStorage.setItem('user_id', idStr);
        }
      } catch (e) {
        console.error('[Procurement Auth] ❌ Failed to decode token:', e);
        setUser(null);
        setToken(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error('[Procurement Auth] ❌ Auth check error:', error);
      setUser(null);
      setToken(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for storage changes (when another tab sets cross_app data)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cross_app_token' || event.key === 'authToken' || event.key === 'token') {
        if (event.newValue) {
          console.log('[Procurement Auth] 🔄 Token changed in another tab, re-checking auth...');
          setTimeout(checkAuth, 100);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    checkAuth,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Custom hook to use AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// HOC for protected routes
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
      // Redirect to main frontend login
      window.location.href = "http://localhost:3000/login";
      return null;
    }

    return <Component {...props} />;
  };
};
