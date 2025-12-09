export interface UserData {
    id: string;
    email: string;
    name?: string;
    roles: string[];
}

export interface AuthContextType {
    user: UserData | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
    checkAuth: () => Promise<void>;
}