import { useMutation, useApolloClient } from "@apollo/client";
import { LockOutlined, UserOutlined, BankOutlined  } from "@ant-design/icons";
import { Alert, Button, Form, Input, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";

import { LOGIN } from "../graphql/account.js";
import { setToken } from "../lib/auth.js";

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const client = useApolloClient();
  const [login, { loading, error }] = useMutation(LOGIN);

  const onFinish = async (values) => {
    const result = await login({ variables: values });
    setToken(result.data.tokenAuth.token);
    await client.resetStore();
    navigate("/dashboard", { replace: true });
  };

 return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: `
        radial-gradient(circle at bottom left, rgba(34,197,94,.25), transparent 30%),
        radial-gradient(circle at bottom right, rgba(34,197,94,.20), transparent 30%),
        #030712
      `,
      padding: 24,
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 560,
        background: "rgba(8,12,20,.95)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 24,
        padding: "40px 48px",
        boxShadow: "0 20px 60px rgba(0,0,0,.5)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#22C55E",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 0 30px rgba(34,197,94,.6)",
          }}
        >
          <BankOutlined 
            style={{
              fontSize: 34,
              color: "#04120A",
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        <Title
          level={2}
          style={{
            color: "#fff",
            marginBottom: 6,
            fontWeight: 700,
          }}
        >
          Chào mừng trở lại
        </Title>

        <Text
          style={{
            color: "#94A3B8",
            fontSize: 15,
          }}
        >
          Đăng nhập để tiếp tục sử dụng hệ thống
        </Text>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error.message}
          style={{
            marginBottom: 20,
          }}
        />
      )}

      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="username"
          label={
            <span
              style={{
                color: "#fff",
                fontWeight: 500,
              }}
            >
              Tên đăng nhập
            </span>
          }
          rules={[
            {
              required: true,
              message: "Nhập tên đăng nhập",
            },
          ]}
        >
          <Input
            size="large"
            prefix={
              <UserOutlined
                style={{
                  color: "#94A3B8",
                }}
              />
            }
            placeholder="Nhập tên đăng nhập"
            style={{
              height: 52,
              background: "#0B1220",
              border: "1px solid #1E293B",
              borderRadius: 12,
              color: "#fff",
            }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            <span
              style={{
                color: "#fff",
                fontWeight: 500,
              }}
            >
              Mật khẩu
            </span>
          }
          rules={[
            {
              required: true,
              message: "Nhập mật khẩu",
            },
          ]}
        >
          <Input.Password
            size="large"
            prefix={
              <LockOutlined
                style={{
                  color: "#94A3B8",
                }}
              />
            }
            placeholder="Nhập mật khẩu"
            style={{
              height: 52,
              background: "#0B1220",
              border: "1px solid #1E293B",
              borderRadius: 12,
              color: "#fff",
            }}
          />
        </Form.Item>

        <div
          style={{
            textAlign: "right",
            marginTop: -8,
            marginBottom: 20,
          }}
        >
          <Link
            to="/forgot-password"
            style={{
              color: "#22C55E",
              fontWeight: 500,
            }}
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          htmlType="submit"
          loading={loading}
          block
          style={{
            height: 56,
            border: "none",
            borderRadius: 12,
            background: "#22C55E",
            color: "#04120A",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          ĐĂNG NHẬP
        </Button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "24px 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: "#1E293B",
            }}
          />

          <span
            style={{
              color: "#94A3B8",
              padding: "0 14px",
            }}
          >
            hoặc
          </span>

          <div
            style={{
              flex: 1,
              height: 1,
              background: "#1E293B",
            }}
          />
        </div>

        

        <div
          style={{
            textAlign: "center",
            marginTop: 28,
          }}
        >
          <Text style={{ color: "#94A3B8" }}>
            Chưa có tài khoản?{" "}
          </Text>

          <Link
            to="/register"
            style={{
              color: "#22C55E",
              fontWeight: 600,
            }}
          >
            Đăng ký
          </Link>
        </div>
      </Form>
    </div>
  </div>
);
}

