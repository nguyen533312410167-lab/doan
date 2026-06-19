import { createContext, useMemo, useState } from "react";
import { settingsService } from "../services/settingsService.js";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => settingsService.get());

  const updateSettings = (values) => {
    const next = settingsService.update(values);
    setSettings(next);
    return next;
  };

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
