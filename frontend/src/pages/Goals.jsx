import { Card, Button, Modal, Form, Input, DatePicker, Progress, Row, Col, Space, message } from "antd";
import { PlusOutlined, DollarOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { SAVING_GOALS, CREATE_SAVING_GOAL, UPDATE_SAVING_GOAL, DELETE_SAVING_GOAL } from "../graphql/goals.js";

export default function Goals() {
  const [messageApi, contextHolder] = message.useMessage();

  const { data: goalsData, loading, refetch } = useQuery(SAVING_GOALS, {
    fetchPolicy: "network-only",
  });
  const goals = goalsData?.savingGoals || [];

  const [createGoal] = useMutation(CREATE_SAVING_GOAL, {
    onCompleted: () => { refetch(); messageApi.success("Đã tạo mục tiêu"); },
    onError: (err) => messageApi.error(err.message),
  });
  const [updateGoal] = useMutation(UPDATE_SAVING_GOAL, {
    onCompleted: () => { refetch(); messageApi.success("Đã nạp tiền"); },
    onError: (err) => messageApi.error(err.message),
  });
  const [deleteGoal] = useMutation(DELETE_SAVING_GOAL, {
    onCompleted: () => { refetch(); messageApi.success("Đã xóa mục tiêu"); },
    onError: (err) => messageApi.error(err.message),
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [addForm] = Form.useForm();
  const [contributeForm] = Form.useForm();

  const handleAddGoal = async () => {
    try {
      const values = await addForm.validateFields();
      await createGoal({
        variables: {
          name: values.name,
          targetAmount: String(values.targetAmount),
          dueDate: values.dueDate.format("YYYY-MM-DD"),
          note: values.note || "",
        },
      });
      setIsAddModalOpen(false);
      addForm.resetFields();
    } catch (error) {
      if (error.errorFields) return;
      console.error("Validation failed:", error);
    }
  };

  const handleContributeGoal = async () => {
    try {
      const values = await contributeForm.validateFields();
      const newAmount = Math.min(
        parseFloat(selectedGoal.targetAmount),
        parseFloat(selectedGoal.currentAmount) + parseInt(values.amount)
      );
      await updateGoal({
        variables: {
          id: selectedGoal.id,
          currentAmount: String(newAmount),
        },
      });
      setIsContributeModalOpen(false);
      setSelectedGoal(null);
      contributeForm.resetFields();
    } catch (error) {
      if (error.errorFields) return;
      console.error("Validation failed:", error);
    }
  };

  const handleDeleteGoal = (id) => {
    Modal.confirm({
      title: "Xóa mục tiêu?",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        await deleteGoal({ variables: { id } });
      },
    });
  };

  const openContributeModal = (goal) => {
    setSelectedGoal(goal);
    contributeForm.resetFields();
    setIsContributeModalOpen(true);
  };

  return (
    <div style={{ padding: "24px" }}>
      {contextHolder}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>Mục Tiêu Tiết Kiệm</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
          Tạo Mục Tiêu
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {goals.map((goal) => {
          const percentage = goal.progressPercent || 0;
          const daysLeft = goal.daysLeft;

          return (
            <Col key={goal.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                style={{
                  borderTop: percentage >= 100 ? "4px solid #52c41a" : "4px solid #1890ff",
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ marginBottom: "8px" }}>{goal.name}</h3>
                  <Space direction="vertical" style={{ width: "100%", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Mục tiêu:</span>
                      <span style={{ fontWeight: "bold" }}>
                        {parseFloat(goal.targetAmount).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Đã có:</span>
                      <span style={{ fontWeight: "bold", color: "#52c41a" }}>
                        {parseFloat(goal.currentAmount).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Còn lại:</span>
                      <span style={{ fontWeight: "bold" }}>
                        {(parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </Space>
                </div>

                <Progress
                  percent={Math.round(percentage)}
                  status={percentage >= 100 ? "success" : "active"}
                  strokeColor={percentage >= 100 ? "#52c41a" : "#1890ff"}
                  style={{ marginBottom: "16px" }}
                />

                <div style={{ marginBottom: "16px", fontSize: "12px", color: "#999" }}>
                  {daysLeft > 0 ? (
                    <span>Hết hạn trong {daysLeft} ngày</span>
                  ) : (
                    <span style={{ color: "#f5222d" }}>Đã quá hạn</span>
                  )}
                </div>

                <Space style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    block
                    size="small"
                    icon={<DollarOutlined />}
                    onClick={() => openContributeModal(goal)}
                  >
                    Nạp Tiền
                  </Button>
                  <Button
                    danger
                    block
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    Xóa
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
        {!loading && goals.length === 0 && (
          <Col span={24}>
            <Card>
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                Chưa có mục tiêu tiết kiệm nào. Hãy tạo mục tiêu mới!
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Add Goal Modal */}
      <Modal
        title="Tạo Mục Tiêu Tiết Kiệm"
        open={isAddModalOpen}
        onOk={handleAddGoal}
        onCancel={() => setIsAddModalOpen(false)}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item label="Tên Mục Tiêu" name="name" rules={[{ required: true, message: "Nhập tên mục tiêu" }]}>
            <Input placeholder="VD: Tiết kiệm mua xe" />
          </Form.Item>
          <Form.Item label="Số Tiền Mục Tiêu" name="targetAmount" rules={[{ required: true, message: "Nhập số tiền mục tiêu" }]}>
            <Input type="number" placeholder="0" min={0} />
          </Form.Item>
          <Form.Item label="Ngày Hoàn Thành" name="dueDate" rules={[{ required: true, message: "Chọn ngày hoàn thành" }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input placeholder="Ghi chú (không bắt buộc)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        title={`Nạp Tiền vào: ${selectedGoal?.name}`}
        open={isContributeModalOpen}
        onOk={handleContributeGoal}
        onCancel={() => {
          setIsContributeModalOpen(false);
          setSelectedGoal(null);
        }}
      >
        <Form form={contributeForm} layout="vertical">
          <Form.Item label="Số Tiền Nạp" name="amount" rules={[{ required: true, message: "Nhập số tiền" }]}>
            <Input type="number" placeholder="0" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}