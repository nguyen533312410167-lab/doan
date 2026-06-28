import { Table, Tag, Button, Space, Modal, Typography, message, Tooltip, Empty } from "antd";
import { EyeOutlined, ReloadOutlined, DeleteOutlined, BellOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";
import { useDeleteCampaign, useResendCampaign } from "../hooks/useAdminNotifications.js";

const { Text, Paragraph } = Typography;

const categoryColors = {
  success: "green",
  info: "blue",
  warning: "orange",
  error: "red",
};

const statusColors = {
  draft: "default",
  sent: "green",
};

const statusLabels = {
  draft: "Bản nháp",
  sent: "Đã gửi",
};

export default function NotificationCampaignTable({ campaigns, loading, refetch }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [detailModal, setDetailModal] = useState(null);
  const { deleteCampaign, deleting } = useDeleteCampaign(refetch);
  const { resendCampaign, resending } = useResendCampaign(refetch);

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xóa lịch sử gửi?",
      content: `Bạn có chắc muốn xóa chiến dịch "${record.title}"?`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteCampaign({ variables: { id: record.id } });
          messageApi.success("Đã xóa chiến dịch");
        } catch (err) {
          messageApi.error(err.message || "Xóa thất bại");
        }
      },
    });
  };

  const handleResend = async (record) => {
    try {
      await resendCampaign({ variables: { id: record.id } });
      messageApi.success("Đã gửi lại thông báo thành công!");
    } catch (err) {
      messageApi.error(err.message || "Gửi lại thất bại");
    }
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title) => (
        <Text strong style={{ color: "#fff" }}>
          {title}
        </Text>
      ),
    },
    {
      title: "Loại",
      dataIndex: "category",
      key: "category",
      width: 100,
      render: (cat) => (
        <Tag color={categoryColors[cat] || "default"}>{cat}</Tag>
      ),
    },
    {
      title: "Người gửi",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 120,
      render: (createdBy) => (
        <Text style={{ color: "#94a3b8" }}>
          {createdBy?.username || "N/A"}
        </Text>
      ),
    },
    {
      title: "Gửi cho",
      dataIndex: "targetDisplay",
      key: "targetDisplay",
      width: 150,
      render: (display) => (
        <Text style={{ color: "#94a3b8" }}>{display}</Text>
      ),
    },
    {
      title: "Ngày gửi",
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
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status] || "default"}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailModal(record)}
              style={{ color: "#22c55e" }}
            />
          </Tooltip>
          <Tooltip title="Gửi lại">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              loading={resending}
              onClick={() => handleResend(record)}
              style={{ color: "#3b82f6" }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleting}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={campaigns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{
          emptyText: (
            <Empty
              image={<BellOutlined style={{ fontSize: 48, color: "#333" }} />}
              description={<Text style={{ color: "#94a3b8" }}>Chưa có lịch sử gửi thông báo</Text>}
            />
          ),
        }}
      />

      {/* Detail Modal */}
      <Modal
        title={
          <Text strong style={{ color: "#fff", fontSize: 16 }}>
            Chi tiết thông báo
          </Text>
        }
        open={!!detailModal}
        onCancel={() => setDetailModal(null)}
        footer={null}
        width={600}
        style={{ background: "#0b1220" }}
        styles={{
          content: {
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.1)",
          },
          header: {
            background: "#0b1220",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          },
        }}
      >
        {detailModal && (
          <div style={{ color: "#fff" }}>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: "#94a3b8", display: "block", fontSize: 12 }}>TIÊU ĐỀ</Text>
              <Text strong style={{ color: "#fff", fontSize: 16 }}>{detailModal.title}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: "#94a3b8", display: "block", fontSize: 12 }}>NỘI DUNG</Text>
              <Paragraph style={{ color: "#cbd5e1", margin: 0 }}>{detailModal.message}</Paragraph>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: "#94a3b8", display: "block", fontSize: 12 }}>LOẠI</Text>
              <Tag color={categoryColors[detailModal.category] || "default"}>
                {detailModal.category}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: "#94a3b8", display: "block", fontSize: 12 }}>NGƯỜI GỬI</Text>
              <Text style={{ color: "#cbd5e1" }}>{detailModal.createdBy?.username || "N/A"}</Text>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: "#94a3b8", display: "block", fontSize: 12 }}>GỬI CHO</Text>
              <Text style={{ color: "#cbd5e1" }}>{detailModal.targetDisplay}</Text>
            </div>
            {detailModal.link && (
              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: "#94a3b8", display: "block", fontSize: 12 }}>LINK ĐIỀU HƯỚNG</Text>
                <Text style={{ color: "#22c55e" }}>{detailModal.link}</Text>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: "#94a3b8", display: "block", fontSize: 12 }}>TRẠNG THÁI</Text>
              <Tag color={statusColors[detailModal.status] || "default"}>
                {statusLabels[detailModal.status] || detailModal.status}
              </Tag>
            </div>
            <div>
              <Text style={{ color: "#94a3b8", display: "block", fontSize: 12 }}>NGÀY GỬI</Text>
              <Text style={{ color: "#cbd5e1" }}>
                {dayjs(detailModal.createdAt).format("DD/MM/YYYY HH:mm:ss")}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}