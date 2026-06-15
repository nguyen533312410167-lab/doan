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
    <div
      className="auth-wrap"
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(135deg, #020617 0%, #031B10 30%, #052E16 60%, #04180D 100%)",
      }}
    >
      <div
        className="auth-panel"
        style={{
          background: "rgba(8,22,15,0.95)",
          border: "1px solid #1F5132",
        }}
      >
        <Title level={2} style={{ color: "#FFFFFF" }}>
          Đăng ký tài khoản
        </Title>

        <Text style={{ color: "rgba(255,255,255,0.8)" }}>
          Tạo tài khoản người dùng mới.
        </Text>

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
            label={<span style={{ color: "#FFFFFF" }}>Tên đăng nhập</span>}
            rules={[{ required: true, message: "Nhập tên đăng nhập" }]}
          >
            <Input
              style={{
                background: "#102019",
                borderColor: "#2D5A3D",
                color: "#FFFFFF",
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ color: "#FFFFFF" }}>Email</span>}
            rules={[
              { required: true, message: "Nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              style={{
                background: "#102019",
                borderColor: "#2D5A3D",
                color: "#FFFFFF",
              }}
            />
          </Form.Item>

          <div className="form-grid">
            <Form.Item
              name="firstName"
              label={<span style={{ color: "#FFFFFF" }}>Tên</span>}
            >
              <Input
                style={{
                  background: "#102019",
                  borderColor: "#2D5A3D",
                  color: "#FFFFFF",
                }}
              />
            </Form.Item>

            <Form.Item
              name="lastName"
              label={<span style={{ color: "#FFFFFF" }}>Họ</span>}
            >
              <Input
                style={{
                  background: "#102019",
                  borderColor: "#2D5A3D",
                  color: "#FFFFFF",
                }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="password"
            label={<span style={{ color: "#FFFFFF" }}>Mật khẩu</span>}
            rules={[
              { required: true, message: "Nhập mật khẩu" },
              { min: 8, message: "Tối thiểu 8 ký tự" },
            ]}
          >
            <Input.Password
              style={{
                background: "#102019",
                borderColor: "#2D5A3D",
                color: "#FFFFFF",
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ color: "#FFFFFF" }}>Xác nhận mật khẩu</span>}
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
            <Input.Password
              style={{
                background: "#102019",
                borderColor: "#2D5A3D",
                color: "#FFFFFF",
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
              color: "#FFFFFF",
              fontWeight: 600,
            }}
          >
            Đăng ký
          </Button>
        </Form>

        <Text style={{ color: "#FFFFFF" }}>
          Đã có tài khoản?{" "}
          <Link to="/login" style={{ color: "#4ADE80" }}>
            Đăng nhập
          </Link>
        </Text>
      </div>
    </div>
  );
}