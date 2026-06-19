import { useState } from "react";
import { Form, Input, Button, Typography, message, Divider } from "antd";
import { LockOutlined, UserOutlined, WalletOutlined, CrownOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { setToken } from "../lib/auth.js";
import { authService } from "../services/authService.js";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await authService.login(values.username, values.password);
      const { accessToken, refreshToken, user } = response.data;

      setToken(accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      message.success("Đăng nhập thành công");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || "Đăng nhập thất bại";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      setAdminLoading(true);
      const response = await authService.autoLogin();
      const { accessToken, refreshToken, user } = response.data;

      setToken(accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      message.success("Đăng nhập Admin thành công");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || "Đăng nhập Admin thất bại";
      message.error(msg);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow glow-left" />
      <div className="auth-glow glow-right" />

      <div className="auth-wrapper">
        <div className="auth-banner">
          <div className="banner-content">
            <WalletOutlined className="banner-icon" />
            <h1>Finance Manager</h1>
            <p>
              Quản lý chi tiêu thông minh,
              theo dõi thu nhập và đạt được
              mục tiêu tài chính của bạn.
            </p>
          </div>
        </div>

        <div className="auth-container">
          <div className="logo-box">
            <WalletOutlined />
          </div>

          <Title level={2} className="auth-title">
            Chào mừng trở lại
          </Title>
          <Text className="auth-subtitle">
            Đăng nhập để tiếp tục sử dụng hệ thống
          </Text>

          <Form layout="vertical" onFinish={onFinish} className="auth-form">
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nhập tên đăng nhập" size="large" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" size="large" />
            </Form.Item>

            <Button htmlType="submit" block loading={loading} className="auth-btn">
              ĐĂNG NHẬP
            </Button>
          </Form>

          <Divider style={{ borderColor: '#334155', margin: '16px 0' }}>
            <Text style={{ color: '#64748B', fontSize: 13 }}>HOẶC</Text>
          </Divider>

          <Button
            block
            loading={adminLoading}
            icon={<CrownOutlined />}
            onClick={handleAdminLogin}
            style={{
              height: 44,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            ĐĂNG NHẬP ADMIN
          </Button>

          <div className="bottom-text">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </div>
        </div>
      </div>
    </div>
  );
}