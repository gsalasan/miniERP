  import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
  import { api } from '@shared/services/api/apiInstance';
  import { authStore } from '@shared/services/stores/auth';
  import { Config } from '@shared/services/config';
  import { UserData, AuthContextType } from '@shared/interface/index';

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  interface AuthProviderProps {
    children: ReactNode;
  }

  export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const Auth = authStore();
    const [user, setUser] = useState<UserData | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const authToken = Auth.getToken();
        if (!authToken) {
          setUser(null);
          setToken(null);
          return;
        }

        setToken(authToken);

        // decode JWT untuk fallback
        let payload: any = null;
        try {
          payload = JSON.parse(atob(authToken.split(".")[1]));
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp <= now) throw new Error("Token expired");
        } catch {
          setUser(null);
          setToken(null);
          Config.logout();
          return;
        }

        // verifikasi token ke server
        try {
          const response = await new Promise<any>((resolve, reject) => {
            api.get('auth/me', (status: number, data: any) => {
              if (status === 200) resolve(data);
              else reject('Invalid token');
            }, 'identity');
          });

          const userData: UserData = {
            id: response.id,
            email: response.email,
            name: response.name || response.full_name || undefined,
            roles: response.roles || [],
          };

          setUser(userData);
          Auth.setUser(userData); // sync ke store
        } catch {
          // fallback decode JWT
          if (payload) {
            setUser({
              id: payload.id,
              email: payload.email,
              name: payload.name || payload.full_name || undefined,
              roles: payload.roles || [],
            });
          } else {
            setUser(null);
            setToken(null);
            Config.logout();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    const logout = () => {
      Config.logout();
      setUser(null);
      setToken(null);
    };

    useEffect(() => {
      checkAuth();
    }, []);

    return (
      <AuthContext.Provider
        value={{
          user,
          token,
          isAuthenticated: !!user,
          isLoading,
          logout,
          checkAuth,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  };

  // hook
  export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
  };
