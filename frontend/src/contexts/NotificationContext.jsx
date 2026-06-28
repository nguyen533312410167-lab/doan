import { createContext, useContext, useCallback, useRef } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const refreshCallbacks = useRef(new Set());

  const registerRefresh = useCallback((callback) => {
    refreshCallbacks.current.add(callback);
    return () => refreshCallbacks.current.delete(callback);
  }, []);

  const refreshNotifications = useCallback(() => {
    refreshCallbacks.current.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error("Notification refresh error:", e);
      }
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ refreshNotifications, registerRefresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationRefresh() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return { refreshNotifications: () => {}, registerRefresh: () => () => {} };
  }
  return ctx;
}