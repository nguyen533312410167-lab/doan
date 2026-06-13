import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, Row, Col, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import mockData, { categories } from "../data/mockData";

const categoryMap = mockData.categoryMap;

export default function Transactions() {
  const [transactions, setTransactions] = useState(mockData.loadTransactions());

  useEffect(() => {
    const onUpdate = () => setTransactions(mockData.loadTransactions());
    window.addEventListener("transactions_updated", onUpdate);
    return () => window.removeEventListener("transactions_updated", onUpdate);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form] = Form.useForm();
  const [filterType, setFilterType] = useState("all");
  const [searchText, setSearchText] = useState("");

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (key) => {
    setTransactions(transactions.filter((t) => t.key !== key));
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingKey !== null) {
        const updated = transactions.map((t) =>
          t.key === editingKey
            ? {
                ...t,
                ...values,
                date: values.date.format("YYYY-MM-DD"),
                key: editingKey,
              }
            : t
        );
        setTransactions(updated);
        mockData.saveTransactions(updated);
      } else {
        const nextKey = Math.max(0, ...transactions.map((t) => t.key)) + 1;
        const created = {
          ...values,
          date: values.date.format("YYYY-MM-DD"),
          key: nextKey,
        };
        const updated = [...transactions, created];
        setTransactions(updated);
        mockData.saveTransactions(updated);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const typeMatch =
      filterType === "all" || t.type === filterType;
    const searchMatch =
      t.note.toLowerCase().includes(searchText.toLowerCase()) ||
      categoryMap[t.category]?.toLowerCase().includes(searchText.toLowerCase());
    return typeMatch && searchMatch;
  });

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
      dataIndex: "category",
      key: "category",
      render: (category) => categoryMap[category] || category,
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
      render: (type) => (type === "income" ? "Thu nhập" : "Chi tiêu"),
      filters: [
        { text: "Thu nhập", value: "income" },
        { text: "Chi tiêu", value: "expense" },
      ],
    },
    {
      title: "Số Tiền",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => a.amount - b.amount,
      render: (amount, record) => (
        <span style={{ color: record.type === "income" ? "#52c41a" : "#f5222d" }}>
          {record.type === "income" ? "+" : "-"}{amount.toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h1>Quản Lý Giao Dịch</h1>

      <Card style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="Tìm kiếm ghi chú hoặc danh mục"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm Giao Dịch
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredTransactions}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 768 }}
        />
      </Card>

      <Modal
        title={editingKey !== null ? "Sửa Giao Dịch" : "Thêm Giao Dịch"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Loại Giao Dịch"
            name="type"
            rules={[{ required: true, message: "Chọn loại giao dịch" }]}
          >
            <Select
              options={[
                { label: "Thu nhập", value: "income" },
                { label: "Chi tiêu", value: "expense" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Số Tiền"
            name="amount"
            rules={[{ required: true, message: "Nhập số tiền" }]}
          >
            <Input type="number" placeholder="0" min={0} />
          </Form.Item>

          <Form.Item
            label="Danh Mục"
            name="category"
            rules={[{ required: true, message: "Chọn danh mục" }]}
          >
            <Select options={categories} />
          </Form.Item>

          <Form.Item
            label="Ngày"
            name="date"
            rules={[{ required: true, message: "Chọn ngày" }]}
          >
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Ghi Chú"
            name="note"
            rules={[{ required: true, message: "Nhập ghi chú" }]}
          >
            <Input placeholder="Ghi chú về giao dịch" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
