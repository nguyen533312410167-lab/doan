import { useMutation } from "@apollo/client";
import { Alert, Button, Form, Input, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";

import { REGISTER } from "../graphql/account.js";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [register, { loading, error }] = useMutation(REGISTER);

  const onFinish = async (values) => {
    await register({ variables: values });
    navigate("/login", { replace: true });
  };

  return (
    <div className="auth-wrap">
      <div className="auth-panel">
        <Title level={2}>Đăng ký tài khoản</Title>
        <Text type="secondary">Tạo tài khoản người dùng mới qua GraphQL mutation.</Text>
        {error && <Alert className="form-alert" type="error" showIcon message={error.message} />}
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: "Nhập tên đăng nhập" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input />
          </Form.Item>
          <div className="form-grid">
            <Form.Item name="firstName" label="Tên">
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Họ">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 8, message: "Tối thiểu 8 ký tự" }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Đăng ký
          </Button>
        </Form>
        <Text>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </Text>
      </div>
    </div>
  );
}

