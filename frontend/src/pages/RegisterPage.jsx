import { useMutation } from "@apollo/client";
import { Alert, Button, Form, Input, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";

import { REGISTER } from "../graphql/account.js";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [register, { loading, error }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      if (data?.register?.user) {
        navigate("/login", { replace: true });
      }
    },
    onError: (err) => {
      console.error("Register error:", err);
    },
  });

  const onFinish = async (values) => {
    await register({
      variables: {
        username: values.username,
        email: values.email,
        password: values.password,
        firstName: values.firstName || "",
        lastName: values.lastName || "",
      },
    });
  };

  const getErrorMessage = () => {
    if (!error) return null;
    return error.graphQLErrors?.[0]?.message || error.message || "Đăng ký thất bại";
  };

  const errMsg = getErrorMessage();

  return (
    <div className="auth-wrap">
      <div className="auth-panel">
        <Title level={2}>Đăng ký tài khoản</Title>
        <Text type="secondary">Tạo tài khoản người dùng mới.</Text>
        {errMsg && (
          <Alert
            className="form-alert"
            type="error"
            showIcon
            message={errMsg}
          />
        )}
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: "Nhập tên đăng nhập" }]}
          >
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
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: "Nhập mật khẩu" },
              { min: 8, message: "Tối thiểu 8 ký tự" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
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