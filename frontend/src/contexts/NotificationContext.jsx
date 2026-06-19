import { createContext, useEffect, useMemo, useState } from "react";
import { notificationService } from "../services/notificationService.js";

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => notificationService.list());

  const refresh = () => setNotifications([...notificationService.list()]);

  useEffect(() => {
    window.addEventListener("finance-db-change", refresh);
    return () => window.removeEventListener("finance-db-change", refresh);
  }, []);

  const markAllRead = () => {
    setNotifications([...notificationService.markAllRead()]);
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.isRead).length,
      markAllRead,
      refresh,
    }),
    [notifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
