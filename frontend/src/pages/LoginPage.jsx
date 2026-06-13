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
    <div className="auth-wrap">
      <div className="auth-panel">
        <Title level={2}>Đăng nhập</Title>
        <Text type="secondary">Sử dụng tài khoản Django để truy cập GraphQL dashboard.</Text>
        {error && <Alert className="form-alert" type="error" showIcon message={error.message} />}
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: "Nhập tên đăng nhập" }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Đăng nhập
          </Button>
        </Form>
        <Button style={{ marginTop: 12 }} block onClick={useDemoAccount}>
          Dùng tài khoản demo
        </Button>
        <Text>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </Text>
      </div>
    </div>
  );
}

