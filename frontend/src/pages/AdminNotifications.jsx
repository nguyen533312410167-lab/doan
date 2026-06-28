import { Tabs, Typography, ConfigProvider, theme, Card, message } from "antd";
import { BellOutlined, HistoryOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { ME_QUERY } from "../graphql/account.js";
import { isAuthenticated } from "../lib/auth.js";
import AdminNotificationForm from "../components/AdminNotificationForm.jsx";
import NotificationCampaignTable from "../components/NotificationCampaignTable.jsx";
import { useAdminCampaigns } from "../hooks/useAdminNotifications.js";
import { useEffect } from "react";

const { Title, Text } = Typography;

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: meData, loading: meLoading } = useQuery(ME_QUERY, {
    skip: !isAuthenticated(),
    errorPolicy: "ignore",
  });

  const isStaff = meData?.me?.isStaff || false;
  const { campaigns, loading, refetch } = useAdminCampaigns(10);

  // Redirect non-staff users
  useEffect(() => {
    if (!meLoading && meData && !isStaff) {
      navigate("/dashboard", { replace: true });
    }
  }, [meLoading, meData, isStaff, navigate]);

  if (meLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0b0f14",
        color: "#fff",
      }}>
        Đang tải...
      </div>
    );
  }

  if (!isStaff) {
    return null; // Will redirect via useEffect
  }

  const tabItems = [
    {
      key: "compose",
      label: (
        <span>
          <BellOutlined style={{ marginRight: 8 }} />
          Soạn thông báo
        </span>
      ),
      children: (
        <Card
          style={{
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <AdminNotificationForm refetchCampaigns={refetch} />
        </Card>
      ),
    },
    {
      key: "history",
      label: (
        <span>
          <HistoryOutlined style={{ marginRight: 8 }} />
          Lịch sử gửi
        </span>
      ),
      children: (
        <Card
          style={{
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <NotificationCampaignTable
            campaigns={campaigns}
            loading={loading}
            refetch={refetch}
          />
        </Card>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#22c55e",
          borderRadius: 12,
        },
        components: {
          Card: { colorBgContainer: "#0b1220" },
          Input: {
            colorBgContainer: "#111827",
            colorText: "#ffffff",
            colorBorder: "rgba(255,255,255,0.12)",
          },
          Select: {
            colorBgContainer: "#111827",
            colorText: "#ffffff",
            colorBorder: "rgba(255,255,255,0.12)",
          },
          Tabs: {
            inkBarColor: "#22c55e",
            itemColor: "#94a3b8",
            itemSelectedColor: "#22c55e",
            itemHoverColor: "#22c55e",
          },
        },
      }}
    >
      <div style={{ padding: "24px", background: "#0b0f14", minHeight: "100vh", color: "#fff" }}>
        {contextHolder}

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ color: "#fff", margin: 0, fontSize: 28 }}>
            Quản lý thông báo
          </Title>
          <Text style={{ color: "#94a3b8", marginTop: 4, display: "block" }}>
            Soạn và gửi thông báo đến người dùng
          </Text>
        </div>

        {/* Tabs */}
        <Tabs
          defaultActiveKey="compose"
          items={tabItems}
          style={{ color: "#fff" }}
        />
      </div>
    </ConfigProvider>
  );
}