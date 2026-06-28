import { Button, DatePicker, Form, Input, InputNumber, Select, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, CREATE_TRANSACTION } from "../graphql/transactions.js";
import { useNotificationRefresh } from "../contexts/NotificationContext.jsx";

const { Title } = Typography;
const { TextArea } = Input;

export default function AddTransactionPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState(null);

  const { data: catData } = useQuery(CATEGORIES);
  const categories = catData?.categories || [];

  const categoryOptions = useMemo(() => {
    if (!selectedType) return [];
    return categories
      .filter((c) => c.type === selectedType)
      .map((c) => ({ value: c.id, label: c.nameVi || c.name }));
  }, [categories, selectedType]);

  const { refreshNotifications } = useNotificationRefresh();

  const [createTxn, { loading }] = useMutation(CREATE_TRANSACTION, {
    onCompleted: () => {
      messageApi.success("Đã thêm giao dịch thành công!");
      form.resetFields();
      setSelectedType(null);
      refreshNotifications();
    },
    onError: (err) => {
      messageApi.error(err.message || "Thêm giao dịch thất bại");
    },
  });

  const onFinish = async (values) => {
    try {
      await createTxn({
        variables: {
          transactionType: values.type,
          amount: String(values.amount),
          date: values.date.format("YYYY-MM-DD"),
          categoryId: values.categoryId || undefined,
          note: values.note || "",
        },
      });
    } catch (e) {
      // Error handled by onError callback
    }
  };

  const onCancel = () => {
    form.resetFields();
    setSelectedType(null);
    navigate("/transactions");
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    form.setFieldsValue({ categoryId: undefined });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #020617 0%, #031B10 30%, #052E16 60%, #04180D 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      {contextHolder}
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "rgba(8,22,15,0.95)",
          border: "1px solid #1F5132",
          borderRadius: "16px",
          padding: "32px",
        }}
      >
        <Title
          level={2}
          style={{
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          Thêm giao dịch
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label={<span style={{ color: "#FFFFFF" }}>Loại giao dịch</span>}
            name="type"
            rules={[{ required: true, message: "Vui lòng chọn loại giao dịch" }]}
          >
            <Select
              placeholder="Chọn loại giao dịch"
              onChange={handleTypeChange}
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
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Nhập số tiền"
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ color: "#FFFFFF" }}>Danh mục</span>}
            name="categoryId"
          >
            <Select
              placeholder={selectedType ? "Chọn danh mục" : "Chọn loại giao dịch trước"}
              allowClear
              options={categoryOptions}
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
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ flex: 1, background: "#22C55E", borderColor: "#22C55E" }}
              >
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