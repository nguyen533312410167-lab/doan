import { useMutation } from "@apollo/client";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Typography,
  Row,
  Col, } from "antd";
import { Link, useNavigate } from "react-router-dom";
import {

  UserAddOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

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
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: `
        radial-gradient(circle at bottom left, rgba(34,197,94,.35), transparent 30%),
        radial-gradient(circle at bottom right, rgba(34,197,94,.25), transparent 30%),
        #05070d
      `,
      padding: 24,
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 860,
        background: "rgba(10,12,20,.92)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 24,
        padding: 40,
        backdropFilter: "blur(20px)",
        boxShadow: "0 25px 60px rgba(0,0,0,.5)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            margin: "0 auto 18px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,197,94,.35), rgba(34,197,94,.08))",
            border: "1px solid rgba(34,197,94,.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 0 30px rgba(34,197,94,.25)",
          }}
        >
          <UserAddOutlined
            style={{
              fontSize: 42,
              color: "#4ade80",
            }}
          />
        </div>

        <Title
          level={1}
          style={{
            color: "#fff",
            marginBottom: 4,
            fontSize: 42,
          }}
        >
          Tạo tài khoản mới
        </Title>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 16,
          }}
        >
          Điền thông tin để tạo tài khoản của bạn
        </Text>
      </div>

      {errMsg && (
        <Alert
          type="error"
          showIcon
          message={errMsg}
          style={{
            marginBottom: 24,
          }}
        />
      )}

      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="username"
              label={<span style={{ color: "#fff" }}>Họ và tên</span>}
              rules={[
                {
                  required: true,
                  message: "Nhập tên của bạn",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#39d353" }} />}
                placeholder="Nhập họ và tên của bạn"
                size="large"
                style={{
                  background: "#0f1118",
                  border: "1px solid #222734",
                  color: "#fff",
                  height: 50,
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="email"
              label={<span style={{ color: "#fff" }}>Email</span>}
              rules={[
                {
                  required: true,
                  message: "Nhập email",
                },
                {
                  type: "email",
                  message: "Email không hợp lệ",
                },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#39d353" }} />}
                placeholder="Nhập email của bạn"
                size="large"
                style={{
                  background: "#0f1118",
                  border: "1px solid #222734",
                  color: "#fff",
                  height: 50,
                }}
              />
            </Form.Item>

            <div
              style={{
                color: "#39d353",
                fontSize: 13,
                marginTop: -16,
                marginBottom: 14,
              }}
            >
              <CheckCircleOutlined /> Email hợp lệ
            </div>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="password"
              label={<span style={{ color: "#fff" }}>Mật khẩu</span>}
              rules={[
                {
                  required: true,
                  message: "Nhập mật khẩu",
                },
                {
                  min: 8,
                  message: "Tối thiểu 8 ký tự",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#39d353" }} />}
                placeholder="Nhập mật khẩu"
                size="large"
                style={{
                  background: "#0f1118",
                  border: "1px solid #222734",
                  color: "#fff",
                  height: 50,
                }}
              />
            </Form.Item>

            <div
              style={{
                color: "#94a3b8",
                fontSize: 13,
                marginTop: -16,
                marginBottom: 14,
              }}
            >
              <CheckCircleOutlined style={{ color: "#39d353" }} /> Mật khẩu
              phải có ít nhất 8 ký tự
            </div>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="confirmPassword"
              label={
                <span style={{ color: "#fff" }}>
                  Xác nhận mật khẩu
                </span>
              }
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: "Xác nhận mật khẩu",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu không khớp!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#39d353" }} />}
                placeholder="Nhập lại mật khẩu"
                size="large"
                style={{
                  background: "#0f1118",
                  border: "1px solid #222734",
                  color: "#fff",
                  height: 50,
                }}
              />
            </Form.Item>

            <div
              style={{
                color: "#39d353",
                fontSize: 13,
                marginTop: -16,
                marginBottom: 14,
              }}
            >
              <CheckCircleOutlined /> Mật khẩu xác nhận khớp
            </div>
          </Col>
        </Row>

        <Button
          htmlType="submit"
          loading={loading}
          block
          style={{
            marginTop: 10,
            height: 56,
            border: "none",
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            background:
              "linear-gradient(90deg,#2dd34f 0%,#39d353 50%,#1fb141 100%)",
          }}
        >
          ĐĂNG KÝ
        </Button>

        <div
          style={{
            textAlign: "center",
            marginTop: 24,
          }}
        >
          <Text style={{ color: "#94a3b8" }}>
            Đã có tài khoản?{" "}
          </Text>

          <Link
            to="/login"
            style={{
              color: "#39d353",
              fontWeight: 600,
            }}
          >
            Đăng nhập
          </Link>
        </div>
      </Form>
    </div>
  </div>
);}