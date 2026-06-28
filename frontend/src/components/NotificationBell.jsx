import { Badge, Dropdown, List, Typography, Button, Space, Tag } from "antd";
import { BellOutlined, CheckOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import useNotifications from "../hooks/useNotifications.js";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text, Paragraph } = Typography;

const categoryColors = {
  success: "green",
  info: "blue",
  warning: "orange",
  error: "red",
};

const categoryIcons = {
  success: "✅",
  info: "ℹ️",
  warning: "⚠️",
  error: "❌",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(5);

  const handleItemClick = (item) => {
    if (!item.isRead) {
      markRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const notificationItems = [
    ...notifications.map((n) => ({
      key: n.id,
      label: (
        <div
          onClick={() => handleItemClick(n)}
          style={{
            padding: "8px 4px",
            cursor: "pointer",
            background: n.isRead ? "transparent" : "rgba(34,197,94,0.05)",
            borderRadius: 8,
            marginBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{categoryIcons[n.category] || "ℹ️"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ fontSize: 13, color: "#fff" }}>
                  {n.title}
                </Text>
                {!n.isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
              <Paragraph
                ellipsis={{ rows: 2 }}
                style={{ fontSize: 12, color: "#94a3b8", margin: 0, marginTop: 2 }}
              >
                {n.message}
              </Paragraph>
              <Text style={{ fontSize: 11, color: "#64748b" }}>
                {dayjs(n.createdAt).fromNow()}
              </Text>
            </div>
          </div>
        </div>
      ),
    })),
    {
      key: "actions",
      type: "divider",
    },
    {
      key: "markAllRead",
      label: (
        <Button
          type="text"
          size="small"
          icon={<CheckOutlined />}
          onClick={markAllRead}
          block
          style={{ color: "#22c55e", textAlign: "left", padding: "4px 8px" }}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      ),
    },
    {
      key: "viewAll",
      label: (
        <Button
          type="text"
          size="small"
          icon={<RightOutlined />}
          onClick={() => navigate("/notifications")}
          block
          style={{ color: "#94a3b8", textAlign: "left", padding: "4px 8px" }}
        >
          Xem tất cả
        </Button>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items: notificationItems }}
      trigger={["click"]}
      placement="bottomRight"
      overlayStyle={{
        width: 380,
        maxHeight: 480,
        overflow: "auto",
      }}
      dropdownRender={(menu) => (
        <div
          style={{
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text strong style={{ color: "#fff", fontSize: 14 }}>
              Thông báo
            </Text>
            {unreadCount > 0 && (
              <Tag color="green" style={{ borderRadius: 12 }}>
                {unreadCount} chưa đọc
              </Tag>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" }}>
                <BellOutlined style={{ fontSize: 32, color: "#333", marginBottom: 8 }} />
                <Text style={{ color: "#94a3b8", display: "block" }}>Chưa có thông báo</Text>
              </div>
            ) : (
              <List
                dataSource={notifications}
                renderItem={(item) => (
                  <div
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      background: item.isRead ? "transparent" : "rgba(34,197,94,0.05)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = item.isRead ? "transparent" : "rgba(34,197,94,0.05)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>
                        {categoryIcons[item.category] || "ℹ️"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Text strong style={{ fontSize: 13, color: "#fff" }}>
                            {item.title}
                          </Text>
                          {!item.isRead && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#22c55e",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ fontSize: 12, color: "#94a3b8", margin: 0, marginTop: 2 }}
                        >
                          {item.message}
                        </Paragraph>
                        <Text style={{ fontSize: 11, color: "#64748b" }}>
                          {dayjs(item.createdAt).fromNow()}
                        </Text>
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
          {notifications.length > 0 && (
            <div
              style={{
                padding: "8px 16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: 8,
              }}
            >
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={markAllRead}
                style={{ color: "#22c55e", flex: 1 }}
              >
                Đánh dấu đã đọc
              </Button>
              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                onClick={() => navigate("/notifications")}
                style={{ color: "#94a3b8", flex: 1 }}
              >
                Xem tất cả
              </Button>
            </div>
          )}
        </div>
      )}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]} style={{ boxShadow: "none" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(34,197,94,0.25)",
            cursor: "pointer",
          }}
        >
          🔔
        </div>
      </Badge>
    </Dropdown>
  );
}