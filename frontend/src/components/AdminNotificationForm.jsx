import { Form, Input, Select, Radio, Button, Space, message, Typography } from "antd";
import { SendOutlined, SaveOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useUsersForNotification, useCreateCampaign, useSaveDraft } from "../hooks/useAdminNotifications.js";

const { TextArea } = Input;
const { Text } = Typography;

const categoryOptions = [
  { label: "ℹ️ Thông tin", value: "info" },
  { label: "✅ Thành công", value: "success" },
  { label: "⚠️ Cảnh báo", value: "warning" },
  { label: "❌ Lỗi", value: "error" },
];

export default function AdminNotificationForm({ onSuccess, refetchCampaigns }) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [targetType, setTargetType] = useState("ALL");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const { users, loading: usersLoading, setSearchText } = useUsersForNotification();
  const { createCampaign, creating } = useCreateCampaign(refetchCampaigns);
  const { saveDraft, saving } = useSaveDraft(refetchCampaigns);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchText(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, setSearchText]);

  const handleSubmit = async (values) => {
    try {
      const variables = {
        title: values.title,
        message: values.message,
        category: values.category || "info",
        link: values.link || "",
        targetType: targetType,
        userIds: targetType === "SELECTED" ? selectedUsers.map((u) => u.value) : [],
        saveAsDraft: false,
      };

      await createCampaign({ variables });
      messageApi.success("Đã gửi thông báo thành công!");
      form.resetFields();
      setSelectedUsers([]);
      setSearchValue("");
      if (onSuccess) onSuccess();
    } catch (err) {
      messageApi.error(err.message || "Gửi thông báo thất bại");
    }
  };

  const handleSaveDraft = async (values) => {
    try {
      const variables = {
        title: values.title,
        message: values.message,
        category: values.category || "info",
        link: values.link || "",
        targetType: targetType,
        userIds: targetType === "SELECTED" ? selectedUsers.map((u) => u.value) : [],
      };

      await saveDraft({ variables });
      messageApi.success("Đã lưu nháp thành công!");
      form.resetFields();
      setSelectedUsers([]);
      setSearchValue("");
      if (onSuccess) onSuccess();
    } catch (err) {
      messageApi.error(err.message || "Lưu nháp thất bại");
    }
  };

  const userOptions = users.map((u) => ({
    label: `${u.username}${u.email ? ` (${u.email})` : ""}${u.firstName ? ` - ${u.firstName} ${u.lastName || ""}` : ""}`,
    value: u.id,
  }));

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 800 }}
      >
        {/* Title */}
        <Form.Item
          name="title"
          label={<Text style={{ color: "#fff" }}>Tiêu đề *</Text>}
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input
            placeholder="Nhập tiêu đề thông báo"
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              borderRadius: 10,
            }}
          />
        </Form.Item>

        {/* Message */}
        <Form.Item
          name="message"
          label={<Text style={{ color: "#fff" }}>Nội dung *</Text>}
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <TextArea
            rows={4}
            placeholder="Nhập nội dung thông báo"
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              borderRadius: 10,
            }}
          />
        </Form.Item>

        {/* Category */}
        <Form.Item
          name="category"
          label={<Text style={{ color: "#fff" }}>Loại thông báo</Text>}
          initialValue="info"
        >
          <Select
            options={categoryOptions}
            style={{
              width: 250,
              background: "#111827",
              borderRadius: 10,
            }}
            popupStyle={{ background: "#111827" }}
          />
        </Form.Item>

        {/* Target Type */}
        <Form.Item label={<Text style={{ color: "#fff" }}>Người nhận</Text>}>
          <Radio.Group
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              if (e.target.value === "ALL") {
                setSelectedUsers([]);
              }
            }}
            style={{ color: "#fff" }}
          >
            <Radio value="ALL" style={{ color: "#fff" }}>
              Gửi cho tất cả User
            </Radio>
            <Radio value="SELECTED" style={{ color: "#fff" }}>
              Chọn User cụ thể
            </Radio>
          </Radio.Group>
        </Form.Item>

        {/* User Select (only when SELECTED) */}
        {targetType === "SELECTED" && (
          <Form.Item
            label={<Text style={{ color: "#fff" }}>Chọn User</Text>}
            required
            rules={[{ required: true, message: "Vui lòng chọn ít nhất một User" }]}
          >
            <Select
              mode="multiple"
              placeholder="Tìm kiếm và chọn User..."
              value={selectedUsers}
              onChange={setSelectedUsers}
              onSearch={setSearchValue}
              options={userOptions}
              loading={usersLoading}
              filterOption={false}
              style={{
                width: "100%",
                background: "#111827",
                borderRadius: 10,
              }}
              popupStyle={{ background: "#111827" }}
              notFoundContent={usersLoading ? "Đang tìm..." : "Không tìm thấy User"}
            />
          </Form.Item>
        )}

        {/* Link */}
        <Form.Item
          name="link"
          label={<Text style={{ color: "#fff" }}>Link điều hướng (không bắt buộc)</Text>}
        >
          <Input
            placeholder="Ví dụ: /dashboard, /transactions, /savings"
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              borderRadius: 10,
            }}
          />
        </Form.Item>

        {/* Buttons */}
        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={creating}
              style={{
                background: "#22c55e",
                borderColor: "#22c55e",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Gửi
            </Button>
            <Button
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => {
                form.validateFields().then((values) => {
                  handleSaveDraft(values);
                });
              }}
              style={{
                borderRadius: 10,
                borderColor: "rgba(255,255,255,0.2)",
                color: "#94a3b8",
                background: "transparent",
              }}
            >
              Lưu nháp
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </>
  );
}