import { useMutation } from "@apollo/client";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";

import { LOGIN } from "../graphql/account.js";
import { setToken } from "../lib/auth.js";

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, { loading, error }] = useMutation(LOGIN);

  const useDemoAccount = () => {
    // store demo token and basic demo user info locally for frontend-only demo
    setToken("demo-token-123");
    try {
      localStorage.setItem(
        "demo_user",
        JSON.stringify({ username: "demo", email: "demo@example.com" })
      );
    } catch (e) {}
    navigate("/dashboard", { replace: true });
  };

  const onFinish = async (values) => {
    const result = await login({ variables: values });
    setToken(result.data.tokenAuth.token);
    navigate("/accounts", { replace: true });
  };

 return (
  <div
    className="auth-wrap"
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background:
        "linear-gradient(135deg, #07120B 0%, #0B1D12 50%, #10291A 100%)",
    }}
  >
    <div
      className="auth-panel"
      style={{
        width: 420,
        padding: 32,
        background: "#101A13",
        border: "1px solid #1E3A29",
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(0,0,0,.35)",
      }}
    >
      <Title level={2} style={{ color: "#F8FAFC", marginBottom: 8 }}>
        Đăng nhập
      </Title>

      <Text style={{ color: "#94A3B8" }}>
        Sử dụng tài khoản Django để truy cập GraphQL dashboard.
      </Text>

      {error && (
        <Alert
          className="form-alert"
          type="error"
          showIcon
          message={error.message}
          style={{ marginTop: 16, marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item
          name="username"
          label={<span style={{ color: "#E2E8F0" }}>Tên đăng nhập</span>}
          rules={[{ required: true, message: "Nhập tên đăng nhập" }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: "#22C55E" }} />}
            style={{
              background: "#16231A",
              border: "1px solid #284333",
              color: "#fff",
            }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span style={{ color: "#E2E8F0" }}>Mật khẩu</span>}
          rules={[{ required: true, message: "Nhập mật khẩu" }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#22C55E" }} />}
            style={{
              background: "#16231A",
              border: "1px solid #284333",
              color: "#fff",
            }}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          style={{
            background: "#22C55E",
            borderColor: "#22C55E",
            height: 42,
            fontWeight: 600,
          }}
        >
          Đăng nhập
        </Button>
      </Form>

      <Button
        style={{
          marginTop: 12,
          background: "#16231A",
          borderColor: "#284333",
          color: "#E2E8F0",
        }}
        block
        onClick={useDemoAccount}
      >
        Dùng tài khoản demo
      </Button>

      <div style={{ marginTop: 16 }}>
        <Text style={{ color: "#CBD5E1" }}>
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            style={{
              color: "#4ADE80",
              fontWeight: 500,
            }}
          >
            Đăng ký
          </Link>
        </Text>
      </div>
    </div>
  </div>
);
}

