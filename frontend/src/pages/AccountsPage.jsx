import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
  theme,
} from "antd";

import { CREATE_USER, DELETE_USER, ME, UPDATE_ME, UPDATE_USER, UPLOAD_AVATAR, USERS } from "../graphql/account.js";
import { useNotificationRefresh } from "../contexts/NotificationContext.jsx";

const { Title, Text } = Typography;

function userFullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username;
}

export default function AccountsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const { refreshNotifications } = useNotificationRefresh();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();

  const meQuery = useQuery(ME);
  const usersQuery = useQuery(USERS, {
    variables: { search },
    skip: !meQuery.data?.me?.isStaff,
  });

  const [createUser, createState] = useMutation(CREATE_USER, {
    refetchQueries: ["Users"],
    onCompleted: () => refreshNotifications(),
  });
  const [updateUser, updateState] = useMutation(UPDATE_USER, {
    refetchQueries: ["Users", "Me"],
    onCompleted: () => refreshNotifications(),
  });
  const [updateMe, updateMeState] = useMutation(UPDATE_ME, {
    refetchQueries: ["Me"],
    onCompleted: () => refreshNotifications(),
  });
  const [uploadAvatar, uploadAvatarState] = useMutation(UPLOAD_AVATAR, {
    refetchQueries: ["Users", "Me"],
    onCompleted: () => refreshNotifications(),
  });
  const [deleteUser] = useMutation(DELETE_USER, {
    refetchQueries: ["Users"],
    onCompleted: () => refreshNotifications(),
  });

  const me = meQuery.data?.me;
  const users = usersQuery.data?.users || [];

  const columns = useMemo(
    () => [
      {
        title: "Người dùng",
        dataIndex: "username",
        render: (_, record) => (
          <Space>
            <Avatar src={record.profile?.avatarUrl}>{record.username?.[0]?.toUpperCase()}</Avatar>
            <div>
              <div className="strong">{userFullName(record)}</div>
              <Text type="secondary">{record.username}</Text>
            </div>
          </Space>
        ),
      },
      { title: "Email", dataIndex: "email" },
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        render: (value) => <Tag color={value ? "green" : "red"}>{value ? "Hoạt động" : "Khóa"}</Tag>,
      },
      {
        title: "Quyền",
        dataIndex: "isStaff",
        render: (value) => <Tag color={value ? "blue" : "default"}>{value ? "Staff" : "User"}</Tag>,
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 180,
        render: (_, record) => (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                handleUploadAvatar(file, record.id);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />} />
            </Upload>
            <Button danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
          </Space>
        ),
      },
    ],
    [],
  );

  const openEdit = (user) => {
    setEditingUser(user);
    setCreateOpen(false);
    form.setFieldsValue({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      isStaff: user.isStaff,
      phone: user.profile?.phone,
      address: user.profile?.address,
    });
  };

  const openCreate = () => {
    setEditingUser(null);
    setCreateOpen(true);
    form.resetFields();
    form.setFieldsValue({ isActive: true, isStaff: false });
  };

  const closeModal = () => {
    setEditingUser(null);
    setCreateOpen(false);
    form.resetFields();
  };

  const submitUser = async (values) => {
    if (isCreateOpen) {
      await createUser({ variables: values });
      messageApi.success("Đã tạo user");
    } else {
      await updateUser({ variables: { id: editingUser.id, ...values } });
      messageApi.success("Đã cập nhật user");
    }
    closeModal();
  };

  const submitProfile = async (values) => {
    await updateMe({ variables: values });
    messageApi.success("Đã cập nhật hồ sơ");
  };

  const handleUploadAvatar = async (file, userId) => {
    try {
      await uploadAvatar({ variables: { file, userId } });
      messageApi.success("Đã upload avatar");
    } catch (err) {
      messageApi.error(err.message || "Upload avatar thất bại");
    }
  };

  const confirmDelete = (user) => {
    Modal.confirm({
      title: `Xóa ${user.username}?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        await deleteUser({ variables: { id: user.id } });
        messageApi.success("Đã xóa user");
      },
    });
  };

  if (meQuery.loading) {
    return <div className="page-panel">Đang tải...</div>;
  }

  if (meQuery.error) {
    return <Alert type="error" showIcon message={meQuery.error.message} />;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: "#22c55e", borderRadius: 12 },
        components: {
          Card: { colorBgContainer: "#0b1220" },
          Table: {
            headerBg: "#111827",
            headerColor: "#ffffff",
            rowHoverBg: "#111827",
            bodyBg: "#0b1220",
            colorText: "#ffffff",
            borderColor: "rgba(255,255,255,0.08)",
          },
          Modal: { contentBg: "#0b1220", headerBg: "#111827", titleColor: "#ffffff" },
          Form: { labelColor: "#94a3b8" },
          Input: { colorBgContainer: "#111827", colorText: "#ffffff", colorBorder: "rgba(255,255,255,0.12)" },
          Select: { colorBgContainer: "#111827", colorText: "#ffffff", colorBorder: "rgba(255,255,255,0.12)" },
        },
      }}
    >
      <div className="page-stack" style={{ padding: "24px", background: "#0b0f14", minHeight: "100vh", color: "#fff" }}>
        {contextHolder}
        <Card
          style={{
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 16,
          }}
        >
          <div className="section-head">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div>
                <Title level={3} style={{ margin: 0, color: "#fff" }}>Hồ sơ của tôi</Title>
                <Text style={{ color: "#94a3b8" }}>{me?.username}</Text>
              </div>
            </div>
            <Space direction="vertical" align="center" size="small">
              <Avatar size={80} src={me?.profile?.avatarUrl} icon={<UserOutlined />} />
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleUploadAvatar(file, me.id);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploadAvatarState.loading}>
                  {me?.profile?.avatarUrl ? "Đổi avatar" : "Upload avatar"}
                </Button>
              </Upload>
            </Space>
          </div>
          <Form
            form={profileForm}
            layout="vertical"
            initialValues={{
              email: me?.email,
              firstName: me?.firstName,
              lastName: me?.lastName,
              phone: me?.profile?.phone,
              address: me?.profile?.address,
            }}
            onFinish={submitProfile}
          >
            <div className="form-grid">
              <Form.Item name="firstName" label={<Text style={{ color: "#fff" }}>Tên</Text>}>
                <Input />
              </Form.Item>
              <Form.Item name="lastName" label={<Text style={{ color: "#fff" }}>Họ</Text>}>
                <Input />
              </Form.Item>
            </div>
            <div className="form-grid">
              <Form.Item name="email" label={<Text style={{ color: "#fff" }}>Email</Text>} rules={[{ type: "email", message: "Email không hợp lệ" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phone" label={<Text style={{ color: "#fff" }}>Số điện thoại</Text>}>
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="address" label={<Text style={{ color: "#fff" }}>Địa chỉ</Text>}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={updateMeState.loading} style={{ background: "#22c55e", borderColor: "#22c55e" }}>
              Lưu hồ sơ
            </Button>
          </Form>
        </Card>

        {me?.isStaff ? (
          <Card
            style={{
              background: "#0b1220",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="section-head">
              <div>
                <Title level={3} style={{ color: "#fff", margin: 0 }}>Quản lý tài khoản</Title>
                <Text style={{ color: "#94a3b8" }}>Tạo, cập nhật, khóa/mở khóa, phân quyền và xóa user.</Text>
              </div>
              <Space>
                <Input.Search
                  allowClear
                  placeholder="Tìm username hoặc email"
                  onSearch={setSearch}
                  style={{ width: 260 }}
                />
                <Button icon={<ReloadOutlined />} onClick={() => usersQuery.refetch()}>
                  Tải lại
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ background: "#22c55e", borderColor: "#22c55e" }}>
                  Thêm user
                </Button>
              </Space>
            </div>
            {usersQuery.error && <Alert className="form-alert" type="error" showIcon message={usersQuery.error.message} />}
            <Table rowKey="id" columns={columns} dataSource={users} loading={usersQuery.loading} scroll={{ x: 900 }} />
          </Card>
        ) : null}

        <Modal
          title={isCreateOpen ? "Thêm user" : `Cập nhật ${editingUser?.username || ""}`}
          open={isCreateOpen || Boolean(editingUser)}
          onCancel={closeModal}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={submitUser}>
            {isCreateOpen && (
              <>
                <Form.Item name="username" label={<Text style={{ color: "#fff" }}>Tên đăng nhập</Text>} rules={[{ required: true, message: "Nhập tên đăng nhập" }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="password" label={<Text style={{ color: "#fff" }}>Mật khẩu</Text>} rules={[{ required: true, min: 8, message: "Tối thiểu 8 ký tự" }]}>
                  <Input.Password />
                </Form.Item>
              </>
            )}
            <Form.Item
              name="email"
              label={<Text style={{ color: "#fff" }}>Email</Text>}
              rules={[
                { required: true, message: "Nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input />
            </Form.Item>
            <div className="form-grid">
              <Form.Item name="firstName" label={<Text style={{ color: "#fff" }}>Tên</Text>}>
                <Input />
              </Form.Item>
              <Form.Item name="lastName" label={<Text style={{ color: "#fff" }}>Họ</Text>}>
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="phone" label={<Text style={{ color: "#fff" }}>Số điện thoại</Text>}>
              <Input />
            </Form.Item>
            <Form.Item name="address" label={<Text style={{ color: "#fff" }}>Địa chỉ</Text>}>
              <Input />
            </Form.Item>
            <div className="switch-grid">
              <Form.Item name="isActive" label={<Text style={{ color: "#fff" }}>Hoạt động</Text>} valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isStaff" label={<Text style={{ color: "#fff" }}>Staff</Text>} valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit" loading={createState.loading || updateState.loading} block style={{ background: "#22c55e", borderColor: "#22c55e" }}>
              Lưu
            </Button>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}

