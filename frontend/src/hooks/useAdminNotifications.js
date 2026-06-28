import { useQuery, useMutation } from "@apollo/client";
import { useState, useCallback } from "react";
import {
  ADMIN_NOTIFICATION_CAMPAIGNS,
  USERS_FOR_NOTIFICATION,
  CREATE_ADMIN_NOTIFICATION_CAMPAIGN,
  SAVE_NOTIFICATION_DRAFT,
  DELETE_NOTIFICATION_CAMPAIGN,
  RESEND_NOTIFICATION_CAMPAIGN,
} from "../graphql/adminNotifications.js";

export function useAdminCampaigns(pageSize = 10) {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState(null);

  const { data, loading, refetch } = useQuery(ADMIN_NOTIFICATION_CAMPAIGNS, {
    variables: {
      status: filterStatus || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    },
    fetchPolicy: "network-only",
  });

  const campaigns = data?.adminNotificationCampaigns || [];

  return {
    campaigns,
    loading,
    page,
    setPage,
    filterStatus,
    setFilterStatus,
    refetch,
  };
}

export function useUsersForNotification() {
  const [searchText, setSearchText] = useState("");

  const { data, loading } = useQuery(USERS_FOR_NOTIFICATION, {
    variables: { search: searchText || undefined },
    fetchPolicy: "network-only",
  });

  const users = data?.usersForNotification || [];

  return {
    users,
    loading,
    searchText,
    setSearchText,
  };
}

export function useCreateCampaign(refetchCampaigns) {
  const [createCampaign, { loading: creating }] = useMutation(CREATE_ADMIN_NOTIFICATION_CAMPAIGN, {
    refetchQueries: ["AdminNotificationCampaigns"],
    onCompleted: () => {
      if (refetchCampaigns) refetchCampaigns();
    },
  });

  return { createCampaign, creating };
}

export function useSaveDraft(refetchCampaigns) {
  const [saveDraft, { loading: saving }] = useMutation(SAVE_NOTIFICATION_DRAFT, {
    refetchQueries: ["AdminNotificationCampaigns"],
    onCompleted: () => {
      if (refetchCampaigns) refetchCampaigns();
    },
  });

  return { saveDraft, saving };
}

export function useDeleteCampaign(refetchCampaigns) {
  const [deleteCampaign, { loading: deleting }] = useMutation(DELETE_NOTIFICATION_CAMPAIGN, {
    onCompleted: () => {
      if (refetchCampaigns) refetchCampaigns();
    },
  });

  return { deleteCampaign, deleting };
}

export function useResendCampaign(refetchCampaigns) {
  const [resendCampaign, { loading: resending }] = useMutation(RESEND_NOTIFICATION_CAMPAIGN, {
    refetchQueries: ["AdminNotificationCampaigns", "Notifications", "UnreadNotificationCount"],
    onCompleted: () => {
      if (refetchCampaigns) refetchCampaigns();
    },
  });

  return { resendCampaign, resending };
}