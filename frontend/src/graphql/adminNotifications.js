import { gql } from "@apollo/client";

export const ADMIN_NOTIFICATION_CAMPAIGNS = gql`
  query AdminNotificationCampaigns($status: String, $limit: Int, $offset: Int) {
    adminNotificationCampaigns(status: $status, limit: $limit, offset: $offset) {
      id
      title
      message
      category
      targetType
      targetDisplay
      link
      status
      recipientCount
      createdBy {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

export const USERS_FOR_NOTIFICATION = gql`
  query UsersForNotification($search: String) {
    usersForNotification(search: $search) {
      id
      username
      email
      firstName
      lastName
    }
  }
`;

export const CREATE_ADMIN_NOTIFICATION_CAMPAIGN = gql`
  mutation CreateAdminNotificationCampaign(
    $title: String!
    $message: String!
    $category: String
    $link: String
    $targetType: String
    $userIds: [ID]
    $saveAsDraft: Boolean
  ) {
    createAdminNotificationCampaign(
      title: $title
      message: $message
      category: $category
      link: $link
      targetType: $targetType
      userIds: $userIds
      saveAsDraft: $saveAsDraft
    ) {
      campaign {
        id
        title
        message
        category
        targetType
        targetDisplay
        link
        status
        recipientCount
        createdBy {
          id
          username
        }
        createdAt
      }
      ok
    }
  }
`;

export const SAVE_NOTIFICATION_DRAFT = gql`
  mutation SaveNotificationDraft(
    $title: String!
    $message: String!
    $category: String
    $link: String
    $targetType: String
    $userIds: [ID]
  ) {
    saveNotificationDraft(
      title: $title
      message: $message
      category: $category
      link: $link
      targetType: $targetType
      userIds: $userIds
    ) {
      campaign {
        id
        title
        message
        category
        targetType
        targetDisplay
        link
        status
        recipientCount
        createdBy {
          id
          username
        }
        createdAt
      }
      ok
    }
  }
`;

export const DELETE_NOTIFICATION_CAMPAIGN = gql`
  mutation DeleteNotificationCampaign($id: ID!) {
    deleteNotificationCampaign(id: $id) {
      ok
    }
  }
`;

export const RESEND_NOTIFICATION_CAMPAIGN = gql`
  mutation ResendNotificationCampaign($id: ID!) {
    resendNotificationCampaign(id: $id) {
      ok
    }
  }
`;