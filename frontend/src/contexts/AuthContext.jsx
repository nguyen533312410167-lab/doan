import { createContext, useCallback, useMemo, useState } from "react";
import { getToken, clearToken } from "../lib/auth.js";
import { authService } from "../services/authService.js";

export const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const { accessToken, refreshToken, user: userData } = response.data;
    if (accessToken) localStorage.setItem("account_admin_token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData || null);
    return userData;
  }, []);

  const register = useCallback(async (fullname, email, password) => {
    const response = await authService.register(fullname, email, password);
    const { accessToken, refreshToken, user: userData } = response.data;
    if (accessToken) localStorage.setItem("account_admin_token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData || null);
    return userData;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const response = await authService.updateProfile(data);
    const updatedUser = response.data;
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && getToken()),
      login,
      register,
      logout,
      updateProfile,
    }),
    [login, logout, register, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
