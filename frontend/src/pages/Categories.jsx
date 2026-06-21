import { useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Space, Card } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";

const GET_CATEGORIES = gql`
  query GetCategories {
    categoriesAll {
      id
      name
      type
      createdAt
    }
  }
`;

const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $type: String!) {
    createCategory(name: $name, type: $type) {
      category {
        id
        name
        type
      }
    }
  }
`;

const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $name: String, $type: String) {
    updateCategory(id: $id, name: $name, type: $type) {
      category {
        id
        name
        type
      }
    }
  }
`;

const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id) {
      ok
    }
  }
`;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  const { loading, refetch } = useQuery(GET_CATEGORIES, {
    onCompleted: (data) => {
      setCategories(data.categoriesAll || []);
    },
    onError: (error) => {
      message.error("Không thể tải danh sách danh mục");
      console.error("Query error:", error);
    },
  });

  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory({ variables: { id } });
      message.success("Xóa danh mục thành công");
      refetch();
    } catch (error) {
      message.error("Không thể xóa danh mục");
      console.error("Delete error:", error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingCategory) {
        await updateCategory({
          variables: {
            id: editingCategory.id,
            ...values,
          },
        });
        message.success("Cập nhật danh mục thành công");
      } else {
        await createCategory({
          variables: values,
        });
        message.success("Thêm danh mục thành công");
      }
      setModalVisible(false);
      form.resetFields();
      refetch();
    } catch (error) {
      message.error(error.message || "Có lỗi xảy ra");
      console.error("Submit error:", error);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "Income", value: "income" },
        { text: "Expense", value: "expense" },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => (
        <Tag color={type === "income" ? "green" : "red"}>
          {type === "income" ? "Income" : "Expense"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : "-"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
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
          <Popconfirm
            title="Bạn có chắc muốn xóa danh mục này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ margin: 0, color: "#fff", fontSize: "28px", fontWeight: 700 }}>
          Quản Lý Danh Mục
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          + Add Category
        </Button>
      </div>

      <Card
        style={{
          background: "#0b1220",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={categories}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{
            emptyText: "Chưa có danh mục nào",
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? "Sửa Danh Mục" : "Thêm Danh Mục"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: "expense" }}
        >
          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên danh mục" },
              { whitespace: true, message: "Tên không được chỉ có khoảng trắng" },
            ]}
          >
            <Input placeholder="Ví dụ: Ăn uống" />
          </Form.Item>

          <Form.Item
            label="Loại"
            name="type"
            rules={[{ required: true, message: "Vui lòng chọn loại danh mục" }]}
          >
            <Select placeholder="Chọn loại">
              <Select.Option value="income">Income</Select.Option>
              <Select.Option value="expense">Expense</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingCategory ? "Cập nhật" : "Thêm mới"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}