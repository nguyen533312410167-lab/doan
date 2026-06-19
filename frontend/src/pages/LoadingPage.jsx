import { Spin, Layout } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

export default function LoadingPage() {
  return (
    <Layout
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0F172A",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 48, color: "#22C55E" }} spin />}
          size="large"
        />
        <p style={{ color: "#94A3B8", marginTop: "16px", fontSize: "14px" }}>
          Đang tải ứng dụng...
        </p>
      </div>
    </Layout>
  );
}
