import { useState, useEffect } from "react";
import { Switch, Select, Flex, Typography, Card, message, Spin } from "antd";
import { BellOutlined, DollarCircleOutlined } from "@ant-design/icons";
import { settingsService } from "../services/settingsService.js";

const { Title, Text } = Typography;

const MoonIcon = () => (
  <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.15)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
    🌙
  </div>
);

const NotificationIcon = () => (
  <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.15)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
    <BellOutlined />
  </div>
);

const CurrencyIcon = () => (
  <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.15)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
    <DollarCircleOutlined />
  </div>
);

const CaiDatPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsService.get();
      setSettings(response.data);
    } catch (error) {
      console.error("Load settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const response = await settingsService.update({ [key]: value });
      setSettings(response.data);
      messageApi.success("Đã cập nhật");
    } catch (error) {
      messageApi.error("Cập nhật thất bại");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="cai-dat-container">
      {contextHolder}
      <div className="cai-dat-wrapper">
        <Title level={5} style={{ color: "#9ca3af", fontWeight: "normal", marginBottom: "20px", fontSize: "15px" }}>
          Tùy chọn hệ thống
        </Title>

        <Flex vertical gap={14}>
          <Card className="setting-row-card" styles={{ body: { padding: "16px 20px" } }}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={18}>
                <MoonIcon />
                <Flex vertical gap={2}>
                  <Text strong style={{ color: "#fff", fontSize: "15px" }}>Chế độ tối</Text>
                  <Text style={{ color: "#9ca3af", fontSize: "13px" }}>Bật hoặc tắt chế độ tối của giao diện.</Text>
                </Flex>
              </Flex>
              <Flex align="center" gap={10}>
                <Switch checked={settings?.dark_mode ?? true}
                  onChange={(checked) => updateSetting("dark_mode", checked)}
                  className="custom-switch" />
                <Text style={{ color: "#9ca3af", fontSize: "14px", minWidth: "24px" }}>
                  {settings?.dark_mode ? "Bật" : "Tắt"}
                </Text>
              </Flex>
            </Flex>
          </Card>

          <Card className="setting-row-card" styles={{ body: { padding: "16px 20px" } }}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={18}>
                <NotificationIcon />
                <Flex vertical gap={2}>
                  <Text strong style={{ color: "#fff", fontSize: "15px" }}>Thông báo</Text>
                  <Text style={{ color: "#9ca3af", fontSize: "13px" }}>Bật hoặc tắt thông báo hệ thống.</Text>
                </Flex>
              </Flex>
              <Flex align="center" gap={10}>
                <Switch checked={settings?.notification_enabled ?? true}
                  onChange={(checked) => updateSetting("notification_enabled", checked)}
                  className="custom-switch" />
                <Text style={{ color: "#9ca3af", fontSize: "14px", minWidth: "24px" }}>
                  {settings?.notification_enabled ? "Bật" : "Tắt"}
                </Text>
              </Flex>
            </Flex>
          </Card>

          <Card className="setting-row-card" styles={{ body: { padding: "16px 20px" } }}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={18}>
                <CurrencyIcon />
                <Flex vertical gap={2}>
                  <Text strong style={{ color: "#fff", fontSize: "15px" }}>Đơn vị tiền tệ</Text>
                  <Text style={{ color: "#9ca3af", fontSize: "13px" }}>Chọn đơn vị tiền tệ mặc định sử dụng trong ứng dụng.</Text>
                </Flex>
              </Flex>
              <Select value={settings?.currency || "VND"}
                onChange={(value) => updateSetting("currency", value)}
                className="custom-select"
                options={[
                  { value: "VND", label: "VNĐ" },
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                ]}
              />
            </Flex>
          </Card>
        </Flex>
      </div>

      <style>{`
        .cai-dat-container {
          background-color: #030712;
          min-height: 100vh;
          padding: 32px 24px;
        }
        .cai-dat-wrapper {
          max-width: 1200px;
          margin: 0 auto;
        }
        .setting-row-card {
          background-color: #090f1a !important;
          border: 1px solid #111a2e !important;
          border-radius: 12px !important;
        }
        .custom-switch.ant-switch {
          background-color: #1f2937 !important;
        }
        .custom-switch.ant-switch-checked {
          background-color: #22c55e !important;
        }
        .custom-select.ant-select {
          width: 320px !important;
          height: 42px !important;
        }
        .custom-select .ant-select-selector {
          background-color: #090f1a !important;
          border: 1px solid #1f2937 !important;
          border-radius: 8px !important;
          color: #fff !important;
          height: 42px !important;
          padding: 4px 16px !important;
        }
      `}</style>
    </div>
  );
};

export default CaiDatPage;