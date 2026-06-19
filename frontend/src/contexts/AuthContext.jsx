import { createContext, useCallback, useMemo, useState } from "react";
import { authService } from "../services/authService.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.currentUser());

  const login = useCallback((values) => {
    const result = authService.login(values);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback((values) => authService.register(values), []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback((values) => {
    const nextUser = authService.updateProfile(values);
    setUser(nextUser);
    return nextUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
    }),
    [login, logout, register, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
