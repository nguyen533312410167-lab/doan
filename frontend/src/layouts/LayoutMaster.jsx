import { Layout, Menu, Dropdown, Avatar, Button, Drawer, Badge, Typography } from "antd";
import {
  MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined, DashboardOutlined,
  SwapOutlined, BankOutlined, UserOutlined, BellOutlined, SettingOutlined,
  WalletOutlined, AppstoreOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { clearToken } from "../lib/auth.js";
import { notificationService } from "../services/notificationService.js";
import dayjs from "dayjs";
import "../styles/layout.css";

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

export default function LayoutMaster({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      // ignore
    }
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/transactions", icon: <SwapOutlined />, label: "Giao dịch" },
    { key: "/them-giao-dich", icon: <WalletOutlined />, label: "Thêm giao dịch" },
    { key: "/goals", icon: <BankOutlined />, label: "Mục tiêu" },
    { key: "/thongbao", icon: <BellOutlined />, label: "Thông báo" },
    { key: "/caidat", icon: <SettingOutlined />, label: "Cài đặt" },
    { key: "/accounts", icon: <UserOutlined />, label: "Tài khoản" },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setDrawerOpen(false);
  };

  const accountMenu = {
    items: [
      { label: "Tài khoản", key: "accounts", icon: <UserOutlined />, onClick: () => navigate("/accounts") },
      { label: "Cài đặt", key: "settings", icon: <SettingOutlined />, onClick: () => navigate("/caidat") },
      { type: "divider" },
      { label: "Đăng xuất", key: "logout", icon: <LogoutOutlined />, onClick: handleLogout, danger: true },
    ],
  };

  const currentDate = dayjs().format("DD/MM/YYYY");

  return (
    <Layout className="layout-master">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        className="layout-sider"
      >
        <div className="logo">
          <WalletOutlined style={{ fontSize: "24px", color: "#22C55E" }} />
          {!collapsed && <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>Finance Manager</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        className="mobile-drawer"
        width={280}
      >
        <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={handleMenuClick} />
      </Drawer>

      <Layout className="layout-content">
        <Header className="layout-header">
          <div className="header-left">
            <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)} className="toggle-desktop" />
            <Button type="text" icon={<MenuUnfoldOutlined />}
              onClick={() => setDrawerOpen(true)} className="toggle-mobile" />
          </div>

          <div className="header-right">
            <Text style={{ color: "#94A3B8", marginRight: 16 }}>{currentDate}</Text>
            <Badge count={unreadCount} size="small" color="#22C55E">
              <Button type="text" icon={<BellOutlined style={{ color: "#94A3B8", fontSize: 18 }} />}
                onClick={() => navigate("/thongbao")} />
            </Badge>
            <Dropdown menu={accountMenu} trigger={["click"]}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginLeft: 12 }}>
                <Avatar src={user?.avatar ? `http://localhost:5000${user.avatar}` : null} icon={<UserOutlined />}
                  style={{ backgroundColor: "#22C55E" }} />
                <span style={{ color: "#fff" }}>{user?.fullname || "User"}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="layout-main-content">{children}</Content>

        <Footer className="layout-footer">
          <Text style={{ color: "#94A3B8" }}>© {(new Date()).getFullYear()} Finance Manager</Text>
        </Footer>
      </Layout>
    </Layout>
  );
}