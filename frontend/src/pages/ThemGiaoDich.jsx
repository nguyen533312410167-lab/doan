import { useState, useEffect } from "react";
import { Button, DatePicker, Form, Input, InputNumber, Select, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { transactionService } from "../services/transactionService.js";
import { categoryService } from "../services/categoryService.js";
import dayjs from "dayjs";

const { Title } = Typography;
const { TextArea } = Input;

export default function AddTransactionPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Load categories error:", error);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await transactionService.create({
        type: values.type,
        amount: values.amount,
        category_id: values.category_id || null,
        description: values.note || "",
        transaction_date: values.date.format("YYYY-MM-DD"),
      });
      messageApi.success("Đã thêm giao dịch thành công!");
      form.resetFields();
    } catch (error) {
      messageApi.error(error.response?.data?.message || "Thêm giao dịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    form.resetFields();
    navigate("/transactions");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020617 0%, #031B10 30%, #052E16 60%, #04180D 100%)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "24px",
    }}>
      {contextHolder}
      <div style={{
        width: "100%",
        maxWidth: "650px",
        background: "rgba(8,22,15,0.95)",
        border: "1px solid #1F5132",
        borderRadius: "16px",
        padding: "32px",
      }}>
        <Title level={2} style={{ color: "#FFFFFF", textAlign: "center", marginBottom: "24px" }}>
          Thêm giao dịch
        </Title>

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off"
          initialValues={{ date: dayjs() }}>
          <Form.Item
            label={<span style={{ color: "#FFFFFF" }}>Loại giao dịch</span>}
            name="type"
            rules={[{ required: true, message: "Vui lòng chọn loại giao dịch" }]}
          >
            <Select
              placeholder="Chọn loại giao dịch"
              options={[
                { value: "income", label: "Thu nhập" },
                { value: "expense", label: "Chi tiêu" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: "#FFFFFF" }}>Số tiền</span>}
            name="amount"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} placeholder="Nhập số tiền" />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: "#FFFFFF" }}>Danh mục</span>}
            name="category_id"
          >
            <Select
              placeholder="Chọn danh mục"
              allowClear
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: "#FFFFFF" }}>Ngày</span>}
            name="date"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: "#FFFFFF" }}>Ghi chú</span>}
            name="note"
          >
            <TextArea rows={4} placeholder="Nhập ghi chú..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <Button type="primary" htmlType="submit" loading={loading}
                style={{ flex: 1, background: "#22C55E", borderColor: "#22C55E" }}>
                Lưu
              </Button>
              <Button danger style={{ flex: 1 }} onClick={onCancel}>
                Hủy
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}