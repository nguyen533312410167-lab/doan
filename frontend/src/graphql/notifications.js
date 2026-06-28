import { gql } from "@apollo/client";

export const NOTIFICATIONS = gql`
  query Notifications($type: String, $category: String, $isRead: Boolean, $search: String, $limit: Int, $offset: Int) {
    notifications(type: $type, category: $category, isRead: $isRead, search: $search, limit: $limit, offset: $offset) {
      id
      title
      message
      type
      category
      sender
      isRead
      link
      createdAt
    }
    unreadNotificationCount
  }
`;

export const UNREAD_NOTIFICATION_COUNT = gql`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      ok
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      ok
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) {
      ok
    }
  }
`;

export const DELETE_ALL_NOTIFICATIONS = gql`
  mutation DeleteAllNotifications {
    deleteAllNotifications {
      ok
    }
  }
`;