import { Layout, Menu, Dropdown, Avatar, Button, Drawer } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SwapOutlined,
  BankOutlined,
  UserOutlined,
  AppstoreOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useState } from "react";
import { clearToken, isAuthenticated } from "../lib/auth.js";
import { ME_QUERY } from "../graphql/account.js";
import NotificationBell from "../components/NotificationBell.jsx";
import "../styles/layout.css";

const { Header, Sider, Content } = Layout;

export default function LayoutMaster({ children }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Skip ME_QUERY if not authenticated to avoid errors
  const { data } = useQuery(ME_QUERY, {
    skip: !isAuthenticated(),
    errorPolicy: "ignore",
  });

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const isStaff = data?.me?.isStaff || false;

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => {
        navigate("/dashboard");
        setDrawerOpen(false);
      },
    },
    {
      key: "/transactions",
      icon: <SwapOutlined />,
      label: "Quản lý giao dịch",
      onClick: () => {
        navigate("/transactions");
        setDrawerOpen(false);
      },
    },
    {
      key: "/goals",
      icon: <BankOutlined />,
      label: "Mục tiêu tiết kiệm",
      onClick: () => {
        navigate("/goals");
        setDrawerOpen(false);
      },
    },
    ...(isStaff
      ? [
          {
            key: "/categories",
            icon: <AppstoreOutlined />,
            label: "Danh mục",
            onClick: () => {
              navigate("/categories");
              setDrawerOpen(false);
            },
          },
          {
            key: "/admin-notifications",
            icon: <BellOutlined />,
            label: "Thông báo",
            onClick: () => {
              navigate("/admin-notifications");
              setDrawerOpen(false);
            },
          },
        ]
      : []),
  ];

  const handleNavigateAccounts = () => {
    navigate("/accounts");
    setDrawerOpen(false);
  };

  const accountMenu = {
    items: [
      {
        label: "Tài khoản",
        key: "accounts",
        icon: <UserOutlined />,
        onClick: handleNavigateAccounts,
      },
      {
        label: "Đăng xuất",
        key: "logout",
        icon: <LogoutOutlined />,
        onClick: handleLogout,
      },
    ],
  };

  const username = data?.me?.username || "User";

  return (
    <Layout className="layout-master">
      {/* Desktop Sidebar */}
      <Sider
  trigger={null}
  collapsible
  collapsed={collapsed}
  width={260}
  className="layout-sider"
  style={{
    background: "#0b0f14",
    borderRight: "1px solid rgba(255,255,255,0.06)",
  }}
>
  {/* LOGO */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "18px 16px",
      marginBottom: 10,
    }}
  >
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        background: "rgba(34,197,94,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid rgba(34,197,94,0.3)",
        boxShadow: "0 0 15px rgba(34,197,94,0.2)",
      }}
    >
      <DashboardOutlined style={{ fontSize: 18, color: "#22c55e" }} />
    </div>

    {!collapsed && (
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
          Finance
        </div>
        <div style={{ color: "#22c55e", fontSize: 12 }}>
          Manager
        </div>
      </div>
    )}
  </div>

  {/* MENU */}
  <Menu
    theme="dark"
    mode="inline"
    items={menuItems}
    style={{
      background: "transparent",
      borderRight: "none",
      padding: "0 8px",
    }}
    className="finance-menu"
  />

  {/* UPGRADE CARD */}
  {!collapsed && (
    <div
      style={{
        margin: "20px 14px",
        padding: 16,
        borderRadius: 16,
        background:
          "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.03))",
        border: "1px solid rgba(34,197,94,0.2)",
      }}
    >
      <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
        Nâng cấp tài khoản
      </div>

      <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>
        Trải nghiệm đầy đủ tính năng Premium
      </div>

      <Button
        type="primary"
        size="small"
        style={{
          marginTop: 10,
          width: "100%",
          background: "#22c55e",
          borderColor: "#22c55e",
          fontWeight: 600,
        }}
      >
        Nâng cấp ngay
      </Button>
    </div>
  )}
</Sider>

      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        className="mobile-drawer"
      >
        <Menu mode="inline" items={menuItems} />
      </Drawer>

      {/* Main Layout */}
      <Layout className="layout-content">
        <Header
  className="layout-header"
  style={{
    background: "#0b0f14",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  }}
>
  {/* LEFT */}
  <div className="header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <Button
      type="text"
      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      onClick={() => setCollapsed(!collapsed)}
      className="toggle-desktop"
    />

    <Button
      type="text"
      icon={<MenuUnfoldOutlined />}
      onClick={() => setDrawerOpen(true)}
      className="toggle-mobile"
    />

    <div style={{ marginLeft: 10 }}>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>
        Xin chào, {username} 👋
      </div>
     
    </div>
  </div>

  {/* RIGHT */}
  <div
    className="header-right"
    style={{ display: "flex", alignItems: "center", gap: 14 }}
  >
    {/* Notification */}
    <NotificationBell />

    {/* Date */}
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
        color: "#cbd5e1",
        fontSize: 12,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {new Date().toLocaleDateString("vi-VN")}
    </div>

    {/* Avatar Dropdown (GIỮ NGUYÊN LOGIC) */}
    <Dropdown menu={accountMenu} trigger={["click"]}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          padding: "4px 10px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Avatar
          src={data?.me?.profile?.avatarUrl}
          icon={<UserOutlined />}
        />
      </div>
    </Dropdown>
  </div>
</Header>

        <Content className="layout-main-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
