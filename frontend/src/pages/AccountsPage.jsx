import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Avatar,
  Button,
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
} from "antd";

import { CREATE_USER, DELETE_USER, ME, UPDATE_ME, UPDATE_USER, UPLOAD_AVATAR, USERS } from "../graphql/account.js";

const { Title, Text } = Typography;

function userFullName(user) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username;
}

export default function AccountsPage() {
  const [messageApi, contextHolder] = message.useMessage();
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

  const [createUser, createState] = useMutation(CREATE_USER, { refetchQueries: ["Users"] });
  const [updateUser, updateState] = useMutation(UPDATE_USER, { refetchQueries: ["Users", "Me"] });
  const [updateMe, updateMeState] = useMutation(UPDATE_ME, { refetchQueries: ["Me"] });
  const [uploadAvatar] = useMutation(UPLOAD_AVATAR, { refetchQueries: ["Users", "Me"] });
  const [deleteUser] = useMutation(DELETE_USER, { refetchQueries: ["Users"] });

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
    await uploadAvatar({ variables: { file, userId } });
    messageApi.success("Đã upload avatar");
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
    <div className="page-stack">
      {contextHolder}
      <section className="page-panel">
        <div className="section-head">
          <div>
            <Title level={3}>Hồ sơ của tôi</Title>
            <Text type="secondary">{me?.username}</Text>
          </div>
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              handleUploadAvatar(file, me.id);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Upload avatar</Button>
          </Upload>
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
            <Form.Item name="firstName" label="Tên">
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Họ">
              <Input />
            </Form.Item>
          </div>
          <div className="form-grid">
            <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Email không hợp lệ" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateMeState.loading}>
            Lưu hồ sơ
          </Button>
        </Form>
      </section>

      {me?.isStaff ? (
        <section className="page-panel">
          <div className="section-head">
            <div>
              <Title level={3}>Quản lý tài khoản</Title>
              <Text type="secondary">Tạo, cập nhật, khóa/mở khóa, phân quyền và xóa user.</Text>
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
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Thêm user
              </Button>
            </Space>
          </div>
          {usersQuery.error && <Alert className="form-alert" type="error" showIcon message={usersQuery.error.message} />}
          <Table rowKey="id" columns={columns} dataSource={users} loading={usersQuery.loading} scroll={{ x: 900 }} />
        </section>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Tài khoản hiện tại không có quyền staff nên chỉ xem và cập nhật hồ sơ cá nhân."
        />
      )}

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
              <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: "Nhập tên đăng nhập" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 8, message: "Tối thiểu 8 ký tự" }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
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
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <div className="switch-grid">
            <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isStaff" label="Staff" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" loading={createState.loading || updateState.loading} block>
            Lưu
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

