import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, Row, Col, Card, message, ConfigProvider, theme } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { TRANSACTIONS, CATEGORIES, CREATE_TRANSACTION, UPDATE_TRANSACTION, DELETE_TRANSACTION } from "../graphql/transactions.js";
import { useNotificationRefresh } from "../contexts/NotificationContext.jsx";

export default function Transactions() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [filterType, setFilterType] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState(null);

  const { data: catData } = useQuery(CATEGORIES);
  const categories = catData?.categories || [];
  console.log("Categories:", categories);

  const categoryOptions = useMemo(() => {
  if (!selectedType) return [];

  return categories
    .filter(
      (c) =>
        c.type?.toLowerCase() ===
        selectedType?.toLowerCase()
    )
    .map((c) => ({
      value: c.id,
      label: c.nameVi || c.name,
    }));
}, [categories, selectedType]);

  const { data: txnData, loading, refetch } = useQuery(TRANSACTIONS, {
    variables: { search: searchText || undefined },
    fetchPolicy: "network-only",
  });
  const transactions = txnData?.transactions || [];

  const { refreshNotifications } = useNotificationRefresh();

  const [createTxn] = useMutation(CREATE_TRANSACTION, {
    onCompleted: () => { refetch(); refreshNotifications(); messageApi.success("Đã thêm giao dịch"); },
    onError: (err) => messageApi.error(err.message),
  });
  const [updateTxn] = useMutation(UPDATE_TRANSACTION, {
    onCompleted: () => { refetch(); refreshNotifications(); messageApi.success("Đã cập nhật giao dịch"); },
    onError: (err) => messageApi.error(err.message),
  });
  const [deleteTxn] = useMutation(DELETE_TRANSACTION, {
    onCompleted: () => { refetch(); refreshNotifications(); messageApi.success("Đã xóa giao dịch"); },
    onError: (err) => messageApi.error(err.message),
  });

  const handleAdd = () => {
    setEditingId(null);
    setSelectedType(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setSelectedType(record.type);
    form.setFieldsValue({
      type: record.type,
      amount: parseFloat(record.amount),
      categoryId: record.category?.id || undefined,
      note: record.note,
      date: dayjs(record.date),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Xóa giao dịch?",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        await deleteTxn({ variables: { id } });
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const variables = {
        transactionType: values.type,
        amount: String(values.amount),
        date: values.date.format("YYYY-MM-DD"),
        categoryId: values.categoryId || undefined,
        note: values.note || "",
      };
      if (editingId !== null) {
        await updateTxn({ variables: { id: editingId, ...variables } });
      } else {
        await createTxn({ variables });
      }
      setIsModalOpen(false);
      form.resetFields();
      setSelectedType(null);
    } catch (error) {
      if (error.errorFields) return;
      console.error("Save failed:", error);
    }
  };

 const handleTypeChange = (value) => {
  console.log("Selected Type:", value);

  setSelectedType(value);

  form.setFieldsValue({
    categoryId: undefined,
  });
};

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedType(null);
  };

  const filteredTransactions = searchText
    ? transactions.filter((t) => {
        const text = searchText.toLowerCase();
        return (
          (t.note || "").toLowerCase().includes(text) ||
          (t.categoryName || "").toLowerCase().includes(text)
        );
      })
    : transactions;

  const displayTransactions =
    filterType === "all"
      ? filteredTransactions
      : filteredTransactions.filter(
          (t) => t.type?.toLowerCase() === filterType.toLowerCase()
        );

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Danh Mục",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (name) => name || "Khác",
    },
    {
      title: "Ghi Chú",
      dataIndex: "note",
      key: "note",
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) =>
        ["income", "INCOME"].includes(type) ? "Thu nhập" : "Chi tiêu",
      filters: [
        { text: "Thu nhập", value: "income" },
        { text: "Chi tiêu", value: "expense" },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: "Số Tiền",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
      render: (amount, record) => (
        <span
          style={{
            color: ["income", "INCOME"].includes(record.type)
              ? "#52c41a"
              : "#f5222d",
          }}
        >
          {["income", "INCOME"].includes(record.type) ? "+" : "-"}
          {parseFloat(amount).toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>Xóa</Button>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#3b82f6",
          borderRadius: 12,
        },
        components: {
          Table: {
            headerBg: "#111827",
            headerColor: "#ffffff",
            rowHoverBg: "#111827",
            bodyBg: "#0b1220",
            colorText: "#ffffff",
            borderColor: "rgba(255,255,255,0.08)",
          },
          Card: {
            colorBgContainer: "#0b1220",
          },
          Modal: {
            contentBg: "#0b1220",
            headerBg: "#111827",
            titleColor: "#ffffff",
          },
          Form: {
            labelColor: "#94a3b8",
          },
          Input: {
            colorBgContainer: "#111827",
            colorText: "#ffffff",
            colorBorder: "rgba(255,255,255,0.12)",
          },
          Select: {
            colorBgContainer: "#111827",
            colorText: "#ffffff",
            colorBorder: "rgba(255,255,255,0.12)",
          },
          DatePicker: {
            colorBgContainer: "#111827",
            colorText: "#ffffff",
            colorBorder: "rgba(255,255,255,0.12)",
          },
        },
      }}
    >
      <div style={{ padding: "24px", background: "#0b0f14", minHeight: "100vh", color: "#fff" }}>
        {contextHolder}
        <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 700, marginBottom: "24px" }}>Quản Lý Giao Dịch</h1>

        <Card
          style={{
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: "16px",
          }}
        >
          <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
            <Col xs={24} sm={12} md={6}>
              <Input.Search
                placeholder="Tìm kiếm ghi chú hoặc danh mục"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={() => refetch()}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={filterType}
                onChange={setFilterType}
                style={{ width: "100%" }}
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Thu nhập", value: "income" },
                  { label: "Chi tiêu", value: "expense" },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={12} style={{ textAlign: "right" }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Thêm Giao Dịch</Button>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={displayTransactions}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 768 }}
          />
        </Card>

        <Modal
          style={{ top: 20 }}
          title={editingId !== null ? "Sửa Giao Dịch" : "Thêm Giao Dịch"}
          open={isModalOpen}
          onOk={handleSave}
          onCancel={handleCancel}
          destroyOnClose
          cancelButtonProps={{
            style: {
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.12)",
            },
          }}
          okButtonProps={{ style: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" } }}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Loại Giao Dịch" name="type" rules={[{ required: true, message: "Chọn loại giao dịch" }]}>
              <Select
                placeholder="Chọn loại giao dịch"
                onChange={handleTypeChange}
                options={[
                  { label: "Thu nhập", value: "income" },
                  { label: "Chi tiêu", value: "expense" },
                ]}
              />
            </Form.Item>

            <Form.Item label="Số Tiền" name="amount" rules={[{ required: true, message: "Nhập số tiền" }]}>
              <Input type="number" placeholder="0" min={0} />
            </Form.Item>

            <Form.Item label="Danh Mục" name="categoryId">
              <Select
                placeholder={selectedType ? "Chọn danh mục" : "Chọn loại giao dịch trước"}
                allowClear
                options={categoryOptions}
              />
            </Form.Item>

            <Form.Item label="Ngày" name="date" rules={[{ required: true, message: "Chọn ngày" }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Ghi Chú" name="note">
              <Input placeholder="Ghi chú về giao dịch" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}