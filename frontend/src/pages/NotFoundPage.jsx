import { Result, Button } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0F172A",
        padding: "24px",
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="Trang bạn tìm kiếm không tồn tại."
        extra={
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate("/", { replace: true })}
          >
            Quay về trang chủ
          </Button>
        }
      />
    </div>
  );
}
