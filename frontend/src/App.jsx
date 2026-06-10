import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Button, Layout } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";

import { clearToken, isAuthenticated } from "./lib/auth.js";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import AccountsPage from "./pages/AccountsPage.jsx";

const { Header, Content } = Layout;

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function AppShell({ children }) {
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="brand">
          <UserOutlined />
          <span>Account Admin</span>
        </div>
        {isAuthenticated() && (
          <Button icon={<LogoutOutlined />} onClick={logout}>
            Đăng xuất
          </Button>
        )}
      </Header>
      <Content className="app-content">{children}</Content>
    </Layout>
  );
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/accounts"
          element={
            <PrivateRoute>
              <AccountsPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to={isAuthenticated() ? "/accounts" : "/login"} replace />} />
      </Routes>
    </AppShell>
  );
}

