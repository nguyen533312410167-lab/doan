import { useState } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import { LockOutlined, UserOutlined, WalletOutlined, MailOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { setToken } from "../lib/auth.js";
import { authService } from "../services/authService.js";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await authService.register(values.fullname, values.email, values.password);
      const { accessToken, refreshToken, user } = response.data;

      setToken(accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      message.success("Đăng ký thành công");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || "Đăng ký thất bại";
      message.error(msg);
    } finally {
      setLoading(false);
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
            Tạo tài khoản
          </Title>
          <Text className="auth-subtitle">
            Đăng ký để bắt đầu quản lý tài chính
          </Text>

          <Form layout="vertical" onFinish={onFinish} className="auth-form">
            <Form.Item
              label="Họ và tên"
              name="fullname"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" size="large" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Nhập email" size="large" />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" size="large" />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu không khớp"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" size="large" />
            </Form.Item>

            <Button htmlType="submit" block loading={loading} className="auth-btn">
              ĐĂNG KÝ
            </Button>
          </Form>

          <div className="bottom-text">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}