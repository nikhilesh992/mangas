import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import type { AuthState, User } from "@/lib/types";

interface AuthContextType extends AuthState {
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isAdmin: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Verify token and get user info
      authApi.getProfile()
        .then((user: User) => {
          setState({
            user,
            token,
            isAuthenticated: true,
            isAdmin: user.role === "admin",
          });
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem("auth_token");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const response = await authApi.login(credentials);
    const { user, token } = response;

    localStorage.setItem("auth_token", token);
    setState({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.role === "admin",
    });
  };

  const register = async (userData: { username: string; email: string; password: string }) => {
    const response = await authApi.register(userData);
    const { user, token } = response;

    localStorage.setItem("auth_token", token);
    setState({
      user,
      token,
      isAuthenticated: true,
      isAdmin: user.role === "admin",
    });
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
