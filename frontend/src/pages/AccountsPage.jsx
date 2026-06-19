import { useState, useEffect } from "react";
import { Alert, Avatar, Button, Form, Input, Modal, Space, Typography, Upload, message, Card, Row, Col } from "antd";
import { EditOutlined, UploadOutlined, UserOutlined, LockOutlined } from "@ant-design/icons";
import { authService } from "../services/authService.js";

const { Title, Text } = Typography;

export default function AccountsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data);
    } catch (error) {
      console.error("Load user error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      const response = await authService.updateProfile({ fullname: values.fullname });
      setUser({ ...user, fullname: response.data.fullname });
      messageApi.success("Đã cập nhật hồ sơ");
      setEditProfileOpen(false);
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleChangePassword = async (values) => {
    try {
      await authService.changePassword(values.oldPassword, values.newPassword);
      messageApi.success("Đã đổi mật khẩu");
      setChangePasswordOpen(false);
      passwordForm.resetFields();
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
    }
  };

  const handleUploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const response = await authService.uploadAvatar(formData);
      setUser({ ...user, avatar: response.data.avatar });
      messageApi.success("Đã upload avatar");
    } catch (error) {
      messageApi.error(error.message || "Upload thất bại");
    }
    return false;
  };

  if (loading) return <div style={{ padding: 24, color: "#fff" }}>Đang tải...</div>;

  return (
    <div style={{ padding: 24, background: "#0F172A", minHeight: "100vh" }}>
      {contextHolder}

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card style={{ background: "#1E293B", borderColor: "#334155", textAlign: "center" }}>
            <div style={{ padding: "20px 0" }}>
              <Avatar size={100} src={user?.avatar ? `http://localhost:5000${user.avatar}` : null}
                icon={<UserOutlined />} style={{ backgroundColor: "#22C55E", marginBottom: 16 }} />
              <Title level={4} style={{ color: "#fff", margin: 0 }}>{user?.fullname}</Title>
              <Text style={{ color: "#94A3B8" }}>{user?.email}</Text>
              <div style={{ marginTop: 16 }}>
                <Upload showUploadList={false} beforeUpload={handleUploadAvatar} accept="image/*">
                  <Button icon={<UploadOutlined />}>Đổi avatar</Button>
                </Upload>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title={<span style={{ color: "#fff" }}>Thông tin tài khoản</span>}
            style={{ background: "#1E293B", borderColor: "#334155", marginBottom: 16 }}
            extra={<Button icon={<EditOutlined />} onClick={() => {
              profileForm.setFieldsValue({ fullname: user?.fullname, email: user?.email });
              setEditProfileOpen(true);
            }}>Sửa</Button>}
          >
            <div style={{ color: "#94A3B8" }}>
              <p><strong style={{ color: "#fff" }}>Họ tên:</strong> {user?.fullname}</p>
              <p><strong style={{ color: "#fff" }}>Email:</strong> {user?.email}</p>
              <p><strong style={{ color: "#fff" }}>Ngày tham gia:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "N/A"}</p>
            </div>
          </Card>

          <Card title={<span style={{ color: "#fff" }}>Bảo mật</span>}
            style={{ background: "#1E293B", borderColor: "#334155" }}>
            <Button icon={<LockOutlined />} onClick={() => setChangePasswordOpen(true)}>
              Đổi mật khẩu
            </Button>
          </Card>
        </Col>
      </Row>

      <Modal title="Chỉnh sửa hồ sơ" open={editProfileOpen}
        onOk={() => profileForm.submit()} onCancel={() => setEditProfileOpen(false)}
        okText="Lưu" cancelText="Hủy">
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
          <Form.Item label="Họ tên" name="fullname" rules={[{ required: true, message: "Nhập họ tên" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input disabled />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Đổi mật khẩu" open={changePasswordOpen}
        onOk={() => passwordForm.submit()} onCancel={() => { setChangePasswordOpen(false); passwordForm.resetFields(); }}
        okText="Lưu" cancelText="Hủy">
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item label="Mật khẩu cũ" name="oldPassword"
            rules={[{ required: true, message: "Nhập mật khẩu cũ" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="Mật khẩu mới" name="newPassword"
            rules={[
              { required: true, message: "Nhập mật khẩu mới" },
              { min: 6, message: "Tối thiểu 6 ký tự" },
            ]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="Xác nhận mật khẩu" name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu không khớp"));
                },
              }),
            ]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}