import { Button, Card, ConfigProvider, DatePicker, Empty, Input, Modal, Select, Space, Table, Tag, Typography, message, theme } from "antd";
import { CheckOutlined, DeleteOutlined, BellOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { NOTIFICATIONS, MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ, DELETE_NOTIFICATION, DELETE_ALL_NOTIFICATIONS } from "../graphql/notifications.js";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text, Title } = Typography;
const { Search } = Input;

const categoryIcons = {
  success: "✅",
  info: "ℹ️",
  warning: "⚠️",
  error: "❌",
};

const categoryColors = {
  success: "green",
  info: "blue",
  warning: "orange",
  error: "red",
};

export default function NotificationsPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [filterType, setFilterType] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterRead, setFilterRead] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, loading, refetch } = useQuery(NOTIFICATIONS, {
    variables: {
      type: filterType || undefined,
      category: filterCategory || undefined,
      isRead: filterRead,
      search: searchText || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    },
    fetchPolicy: "network-only",
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadNotificationCount || 0;

  const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
    onCompleted: () => { refetch(); messageApi.success("Đã đánh dấu đã đọc"); },
    onError: (err) => messageApi.error(err.message),
  });

  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    onCompleted: () => { refetch(); messageApi.success("Đã đánh dấu tất cả đã đọc"); },
    onError: (err) => messageApi.error(err.message),
  });

  const [deleteNotification] = useMutation(DELETE_NOTIFICATION, {
    onCompleted: () => { refetch(); messageApi.success("Đã xóa thông báo"); },
    onError: (err) => messageApi.error(err.message),
  });

  const [deleteAll] = useMutation(DELETE_ALL_NOTIFICATIONS, {
    onCompleted: () => { refetch(); messageApi.success("Đã xóa tất cả thông báo"); },
    onError: (err) => messageApi.error(err.message),
  });

  const handleDeleteAll = () => {
    Modal.confirm({
      title: "Xóa tất cả thông báo?",
      content: "Hành động này không thể hoàn tác.",
      okText: "Xóa tất cả",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => deleteAll(),
    });
  };

  const columns = [
    {
      title: "",
      key: "icon",
      width: 50,
      render: (_, record) => (
        <span style={{ fontSize: 20 }}>{categoryIcons[record.category] || "ℹ️"}</span>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (title, record) => (
        <div>
          <Text strong style={{ color: "#fff" }}>
            {title}
          </Text>
          {!record.isRead && (
            <Tag color="green" style={{ marginLeft: 8, fontSize: 10, borderRadius: 8 }}>
              Mới
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (msg) => <Text style={{ color: "#94a3b8" }}>{msg}</Text>,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => (
        <Tag color={type === "admin" ? "purple" : "default"}>
          {type === "admin" ? "Admin" : "Hệ thống"}
        </Tag>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "category",
      key: "category",
      width: 100,
      render: (cat) => (
        <Tag color={categoryColors[cat] || "default"}>
          {cat}
        </Tag>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => (
        <Text style={{ color: "#64748b", fontSize: 12 }}>
          {dayjs(date).format("DD/MM/YYYY HH:mm")}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          {!record.isRead && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => markRead({ variables: { id: record.id } })}
              style={{ color: "#22c55e" }}
            />
          )}
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteNotification({ variables: { id: record.id } })}
          />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: "#22c55e", borderRadius: 12 },
        components: {
          Table: {
            headerBg: "#111827",
            headerColor: "#ffffff",
            rowHoverBg: "#111827",
            bodyBg: "#0b1220",
            colorText: "#ffffff",
            borderColor: "rgba(255,255,255,0.08)",
          },
          Card: { colorBgContainer: "#0b1220" },
          Input: { colorBgContainer: "#111827", colorText: "#ffffff", colorBorder: "rgba(255,255,255,0.12)" },
          Select: { colorBgContainer: "#111827", colorText: "#ffffff", colorBorder: "rgba(255,255,255,0.12)" },
        },
      }}
    >
      <div style={{ padding: "24px", background: "#0b0f14", minHeight: "100vh", color: "#fff" }}>
        {contextHolder}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ color: "#fff", margin: 0, fontSize: 28 }}>
              Thông báo
            </Title>
            <Text style={{ color: "#94a3b8", marginTop: 4, display: "block" }}>
              {unreadCount} thông báo chưa đọc
            </Text>
          </div>
          <Space>
            <Button icon={<CheckOutlined />} onClick={markAllRead} style={{ color: "#22c55e" }}>
              Đánh dấu đã đọc
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteAll}>
              Xóa tất cả
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <Card
          style={{
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 16,
          }}
        >
          <Space wrap style={{ width: "100%" }}>
            <Search
              placeholder="Tìm kiếm thông báo..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={() => { setPage(1); refetch(); }}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Loại"
              value={filterType}
              onChange={(v) => { setFilterType(v); setPage(1); }}
              allowClear
              style={{ width: 140 }}
              options={[
                { label: "Hệ thống", value: "system" },
                { label: "Admin", value: "admin" },
              ]}
            />
            <Select
              placeholder="Phân loại"
              value={filterCategory}
              onChange={(v) => { setFilterCategory(v); setPage(1); }}
              allowClear
              style={{ width: 140 }}
              options={[
                { label: "Thành công", value: "success" },
                { label: "Thông tin", value: "info" },
                { label: "Cảnh báo", value: "warning" },
                { label: "Lỗi", value: "error" },
              ]}
            />
            <Select
              placeholder="Trạng thái"
              value={filterRead}
              onChange={(v) => { setFilterRead(v); setPage(1); }}
              allowClear
              style={{ width: 160 }}
              options={[
                { label: "Chưa đọc", value: false },
                { label: "Đã đọc", value: true },
              ]}
            />
          </Space>
        </Card>

        {/* Table */}
        <Card
          style={{
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={notifications}
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              onChange: setPage,
              showSizeChanger: false,
              style: { color: "#fff" },
            }}
            locale={{
              emptyText: (
                <Empty
                  image={<BellOutlined style={{ fontSize: 48, color: "#333" }} />}
                  description={<Text style={{ color: "#94a3b8" }}>Chưa có thông báo</Text>}
                />
              ),
            }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}