import { useState } from "react";
import { Form, Input, Button, Typography, message, Divider } from "antd";
import { LockOutlined, MailOutlined, WalletOutlined, GoogleOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { setToken } from "../lib/auth.js";
import { authService } from "../services/authService.js";

const { Title, Text } = Typography;

// --- Khai báo demoUser trực tiếp ở đây để đối chiếu kiểm tra ---
const demoUser = {
  id: "user_admin",
  fullname: "Admin Finance",
  email: "admin@finance.local",
  username: "admin",
  password: "123456789",
  avatar: "",
  role: "admin",
  joinedAt: "2026-01-01",
};

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
<<<<<<< HEAD

      // 1. Kiểm tra nếu trùng khớp dữ liệu với demoUser thì đăng nhập thẳng (Mock Login)
      if (values.email === demoUser.email && values.password === demoUser.password) {
        setToken("mock_access_token_123456"); // Lưu token ảo để thỏa mãn hàm isAuthenticated()
        localStorage.setItem("refreshToken", "mock_refresh_token_abcdef");
        localStorage.setItem("user", JSON.stringify(demoUser));

        message.success("Đăng nhập bằng tài khoản mẫu thành công");
        navigate("/dashboard", { replace: true });
        return; // Dừng hàm xử lý tại đây, không cần gọi API thật nữa
      }

      // 2. Nếu không khớp tài khoản demoUser, tiếp tục xử lý gọi API thật từ server như cũ
      const response = await authService.login(values.email, values.password);
=======
      const response = await authService.login(values.username, values.password);
>>>>>>> 8ccb06107d883323e28dcd750c8b3f15653586d1
      const { accessToken, refreshToken, user } = response.data;

      setToken(accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      message.success("Đăng nhập thành công");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý nút "Đăng nhập nhanh Admin" (Điền thẳng demoUser không cần gõ)
  const handleQuickAdminLogin = () => {
    setToken("mock_access_token_123456");
    localStorage.setItem("refreshToken", "mock_refresh_token_abcdef");
    localStorage.setItem("user", JSON.stringify(demoUser));
    message.success("Đăng nhập nhanh với quyền Admin thành công");
    navigate("/dashboard", { replace: true });
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
              Quản lý chi tiêu thông minh, theo dõi thu nhập và đạt được mục tiêu tài chính của bạn.
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
            Đăng nhập để tiếp tục quản lý tài chính của bạn
          </Text>

          <Form layout="vertical" onFinish={onFinish} className="auth-form">
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập" },
              ]}
            >
<<<<<<< HEAD
              <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" size="large" />
=======
              <Input prefix={<UserOutlined />} placeholder="Nhập tên đăng nhập" size="large" />
>>>>>>> 8ccb06107d883323e28dcd750c8b3f15653586d1
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu của bạn" size="large" />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <Link to="/forgot-password" style={{ color: '#22c55e', fontSize: 13 }}>Quên mật khẩu?</Link>
            </div>

            <Button htmlType="submit" block loading={loading} className="auth-btn">
              ĐĂNG NHẬP
            </Button>
          </Form>

          <Divider style={{ borderColor: '#1f2937', margin: '16px 0' }}>
            <Text style={{ color: '#4b5563', fontSize: 12 }}>hoặc</Text>
          </Divider>

          {/* Nút Đăng nhập nhanh sử dụng trực tiếp dữ liệu mẫu */}
          <Button
            block
            icon={<GoogleOutlined />}
            onClick={handleQuickAdminLogin}
            style={{
              height: 44,
              backgroundColor: '#0f172a',
              borderColor: '#1f2937',
              color: '#9ca3af',
              fontWeight: 500,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            Đăng nhập nhanh với Admin
          </Button>

          <div className="bottom-text" style={{ color: '#9ca3af', textAlign: 'center' }}>
            Chưa có tài khoản? <Link to="/register" style={{ color: '#22c55e' }}>Đăng ký</Link>
          </div>
        </div>
      </div>
    </div>
  );
}