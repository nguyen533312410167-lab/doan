import { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, DatePicker, Space, Row, Col, Card, message, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { transactionService } from "../services/transactionService.js";
import { categoryService } from "../services/categoryService.js";
import dayjs from "dayjs";

export default function Transactions() {
  const [messageApi, contextHolder] = message.useMessage();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    loadCategories();
    loadTransactions();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Load categories error:", error);
    }
  };

  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit };
      if (searchText) params.search = searchText;
      if (filterType) params.type = filterType;
      const response = await transactionService.getAll(params);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      messageApi.error("Tải giao dịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ transaction_date: dayjs() });
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      type: record.type,
      amount: parseFloat(record.amount),
      category_id: record.category_id || undefined,
      description: record.description || "",
      transaction_date: dayjs(record.transaction_date),
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
        try {
          await transactionService.delete(id);
          messageApi.success("Đã xóa giao dịch");
          loadTransactions(pagination.page);
        } catch (error) {
          messageApi.error("Xóa thất bại");
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        type: values.type,
        amount: values.amount,
        category_id: values.category_id || null,
        description: values.description || "",
        transaction_date: values.transaction_date.format("YYYY-MM-DD"),
      };

      if (editingId) {
        await transactionService.update(editingId, data);
        messageApi.success("Đã cập nhật giao dịch");
      } else {
        await transactionService.create(data);
        messageApi.success("Đã thêm giao dịch");
      }

      setIsModalOpen(false);
      form.resetFields();
      loadTransactions(pagination.page);
    } catch (error) {
      if (error.errorFields) return;
      messageApi.error(error.response?.data?.message || "Lưu thất bại");
    }
  };

  const handleTableChange = (pag) => {
    loadTransactions(pag.current);
  };

  const columns = [
    { title: "Ngày", dataIndex: "transaction_date", key: "transaction_date", width: 120,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    { title: "Danh Mục", dataIndex: ["category", "name"], key: "category", render: (name) => name || "Khác" },
    { title: "Mô tả", dataIndex: "description", key: "description", ellipsis: true },
    { title: "Loại", dataIndex: "type", key: "type", width: 100,
      render: (type) => (
        <Tag color={type === "income" ? "green" : "red"}>
          {type === "income" ? "Thu nhập" : "Chi tiêu"}
        </Tag>
      ),
    },
    { title: "Số Tiền", dataIndex: "amount", key: "amount", width: 150,
      render: (amount, record) => (
        <span style={{ color: record.type === "income" ? "#22C55E" : "#EF4444", fontWeight: 600 }}>
          {record.type === "income" ? "+" : "-"}{parseFloat(amount).toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    { title: "Hành Động", key: "action", width: 150,
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <h1 style={{ color: "#fff", marginBottom: 24 }}>Quản Lý Giao Dịch</h1>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="Tìm kiếm..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={() => loadTransactions(1)}
              enterButton
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              value={filterType}
              onChange={(value) => { setFilterType(value); loadTransactions(1); }}
              style={{ width: "100%" }}
              placeholder="Lọc loại"
              allowClear
              options={[
                { label: "Thu nhập", value: "income" },
                { label: "Chi tiêu", value: "expense" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={{ span: 4, offset: 10 }} style={{ textAlign: "right" }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm Giao Dịch
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} giao dịch`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 768 }}
        />
      </Card>

      <Modal
        title={editingId ? "Sửa Giao Dịch" : "Thêm Giao Dịch"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        destroyOnClose
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Loại" name="type" rules={[{ required: true, message: "Chọn loại" }]}>
            <Select options={[
              { label: "Thu nhập", value: "income" },
              { label: "Chi tiêu", value: "expense" },
            ]} />
          </Form.Item>

          <Form.Item label="Số Tiền" name="amount" rules={[{ required: true, message: "Nhập số tiền" }]}>
            <Input type="number" placeholder="0" min={0} />
          </Form.Item>

          <Form.Item label="Danh Mục" name="category_id">
            <Select
              placeholder="Chọn danh mục"
              allowClear
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Form.Item label="Ngày" name="transaction_date" rules={[{ required: true, message: "Chọn ngày" }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea placeholder="Mô tả giao dịch" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}