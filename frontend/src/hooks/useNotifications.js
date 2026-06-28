import { useQuery, useMutation } from "@apollo/client";
import { useEffect } from "react";
import { NOTIFICATIONS, MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ } from "../graphql/notifications.js";
import { useNotificationRefresh } from "../contexts/NotificationContext.jsx";

export default function useNotifications(limit = 5) {
  const { data, loading, refetch } = useQuery(NOTIFICATIONS, {
    variables: { limit },
    fetchPolicy: "network-only",
  });

  const { registerRefresh } = useNotificationRefresh();

  // Register refetch with global context so any mutation can trigger refresh
  useEffect(() => {
    const unregister = registerRefresh(refetch);
    return unregister;
  }, [refetch, registerRefresh]);

  const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
    onCompleted: () => refetch(),
  });

  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    onCompleted: () => refetch(),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadNotificationCount || 0;

  const handleMarkRead = (id) => {
    markRead({ variables: { id } });
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  return {
    notifications,
    unreadCount,
    loading,
    refetch,
    markRead: handleMarkRead,
    markAllRead: handleMarkAllRead,
  };
}
