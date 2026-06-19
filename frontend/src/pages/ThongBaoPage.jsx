import { useState, useEffect } from "react";
import { List, Badge, Pagination, Avatar, Flex, Typography, Tag, Button, Spin } from "antd";
import { BellOutlined, FileDoneOutlined, UserOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { notificationService } from "../services/notificationService.js";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const getIcon = (type) => {
  const iconStyle = { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 };
  if (type === "income" || type === "deposit" || type === "goal_deposit") {
    return <div style={{ ...iconStyle, backgroundColor: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.2)", color: "#22c55e" }}>↓</div>;
  }
  if (type === "expense" || type === "withdraw" || type === "goal_withdraw") {
    return <div style={{ ...iconStyle, backgroundColor: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)", color: "#ef4444" }}>↑</div>;
  }
  return <div style={{ ...iconStyle, backgroundColor: "rgba(37, 99, 235, 0.1)", border: "1px solid rgba(37, 99, 235, 0.2)", color: "#3b82f6" }}>→</div>;
};

const FilterTag = ({ label, count, active, onClick }) => (
  <Tag
    onClick={onClick}
    style={{
      backgroundColor: active ? "rgba(34, 197, 94, 0.15)" : "#111827",
      border: active ? "1px solid #22c55e" : "1px solid #1f2937",
      borderRadius: "8px",
      padding: "6px 16px",
      marginRight: 0,
      cursor: "pointer",
      transition: "all 0.2s",
    }}
  >
    <Flex align="center" gap={8}>
      <span style={{ color: active ? "#22c55e" : "#9ca3af", fontSize: "13px", fontWeight: active ? "500" : "normal" }}>
        {label}
      </span>
      {count !== undefined && (
        <span style={{ backgroundColor: active ? "#22c55e" : "#1f2937", color: active ? "#000" : "#9ca3af", fontSize: "11px", padding: "1px 6px", borderRadius: "10px", fontWeight: "bold" }}>
          {count}
        </span>
      )}
    </Flex>
  </Tag>
);

const ThongBaoPage = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadNotifications();
  }, [activeFilter, page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (activeFilter !== "all") params.type = activeFilter;
      const response = await notificationService.getAll(params);
      setNotifications(response.data.notifications);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error("Mark all read error:", error);
    }
  };

  return (
    <div className="thong-bao-container">
      <Flex justify="space-between" align="flex-start" style={{ marginBottom: "24px" }}>
        <div>
          <Title level={2} style={{ color: "#fff", margin: 0, fontSize: "24px", fontWeight: 600 }}>Thông báo</Title>
          <Text style={{ color: "#9ca3af", fontSize: "14px" }}>Cập nhật các hoạt động tài chính của bạn.</Text>
        </div>
        <Flex align="center" gap={16}>
          <Badge dot color="#22c55e" offset={[-2, 2]}>
            <BellOutlined style={{ color: "#9ca3af", fontSize: "20px", cursor: "pointer" }} />
          </Badge>
        </Flex>
      </Flex>

      <Flex align="center" justify="space-between" style={{ marginBottom: "20px" }}>
        <Flex gap={10}>
          <FilterTag label="Tất cả" count={total} active={activeFilter === "all"} onClick={() => { setActiveFilter("all"); setPage(1); }} />
          <FilterTag label="Thu nhập" active={activeFilter === "income"} onClick={() => { setActiveFilter("income"); setPage(1); }} />
          <FilterTag label="Chi tiêu" active={activeFilter === "expense"} onClick={() => { setActiveFilter("expense"); setPage(1); }} />
          <FilterTag label="Mục tiêu" active={activeFilter === "goal"} onClick={() => { setActiveFilter("goal"); setPage(1); }} />
        </Flex>
        <Button type="text" icon={<FileDoneOutlined style={{ fontSize: "14px" }} />}
          onClick={handleMarkAllAsRead} className="btn-mark-all">
          Đánh dấu đã đọc tất cả
        </Button>
      </Flex>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}><Spin size="large" /></div>
      ) : (
        <List
          dataSource={notifications}
          split={false}
          renderItem={(item) => (
            <div className={`notification-card ${item.is_read ? "read" : "unread"}`}>
              <Flex align="center" justify="space-between" style={{ width: "100%" }}>
                <Flex align="center" gap={16} style={{ flex: 1 }}>
                  <div>{getIcon(item.type)}</div>
                  <Flex vertical gap={2}>
                    <Text strong style={{ color: "#fff", fontSize: "14px" }}>{item.title}</Text>
                    <Text style={{ color: "#9ca3af", fontSize: "13px" }}>{item.message}</Text>
                  </Flex>
                </Flex>
                <Flex align="center" gap={12}>
                  <Text style={{ color: "#6b7280", fontSize: "13px" }}>
                    {dayjs(item.created_at).format("DD/MM/YYYY HH:mm")}
                  </Text>
                  <Badge dot color={item.is_read ? "#374151" : "#22c55e"} style={{ scale: "1.2" }} />
                </Flex>
              </Flex>
            </div>
          )}
        />
      )}

      <Flex justify="center" style={{ marginTop: "24px" }}>
        <Pagination
          total={total}
          pageSize={10}
          current={page}
          onChange={setPage}
          showSizeChanger={false}
          className="custom-pagination"
          itemRender={(page, type, originalElement) => {
            if (type === "prev") return <Button type="text" className="pag-btn"><LeftOutlined /></Button>;
            if (type === "next") return <Button type="text" className="pag-btn"><RightOutlined /></Button>;
            return originalElement;
          }}
        />
      </Flex>
    </div>
  );
};

export default ThongBaoPage;