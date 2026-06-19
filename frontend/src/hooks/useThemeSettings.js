import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext.jsx";

export function useThemeSettings() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeSettings must be used inside ThemeProvider");
  return context;
}
