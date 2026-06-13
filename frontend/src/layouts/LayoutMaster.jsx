import { Layout, Menu, Dropdown, Avatar, Button, Drawer } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SwapOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useState } from "react";
import { clearToken, isAuthenticated } from "../lib/auth.js";
import { ME_QUERY } from "../graphql/account.js";
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
  ];

  const accountMenu = {
    items: [
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
        width={250}
        className="layout-sider"
      >
        <div className="logo">
          <DashboardOutlined style={{ fontSize: "24px" }} />
          {!collapsed && <span>Quản Lý Chi Tiêu</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          style={{ marginTop: "20px" }}
        />
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
        <Header className="layout-header">
          <div className="header-left">
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
          </div>

          <div className="header-right">
            <Dropdown menu={accountMenu} trigger={["click"]}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <Avatar icon={<DashboardOutlined />} />
                <span>{username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="layout-main-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
