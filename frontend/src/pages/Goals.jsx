import { Card, Button, Modal, Form, Input, DatePicker, Progress, Row, Col, Space, Statistic, Tooltip } from "antd";
import { PlusOutlined, DollarOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";

export default function Goals() {
  const [goals, setGoals] = useState([
    {
      key: 1,
      name: "Tiết kiệm mua xe",
      targetAmount: 50000000,
      currentAmount: 20000000,
      dueDate: "2024-12-31",
    },
    {
      key: 2,
      name: "Du lịch nước ngoài",
      targetAmount: 30000000,
      currentAmount: 15000000,
      dueDate: "2024-11-30",
    },
    {
      key: 3,
      name: "Quỹ khẩn cấp",
      targetAmount: 10000000,
      currentAmount: 8000000,
      dueDate: "2024-09-30",
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [addForm] = Form.useForm();
  const [contributeForm] = Form.useForm();

  const handleAddGoal = async () => {
    try {
      const values = await addForm.validateFields();
      const newGoal = {
        key: Math.max(0, ...goals.map((g) => g.key)) + 1,
        name: values.name,
        targetAmount: parseInt(values.targetAmount),
        currentAmount: 0,
        dueDate: values.dueDate.format("YYYY-MM-DD"),
      };
      setGoals([...goals, newGoal]);
      setIsAddModalOpen(false);
      addForm.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleContributeGoal = async () => {
    try {
      const values = await contributeForm.validateFields();
      setGoals(
        goals.map((g) =>
          g.key === selectedGoal.key
            ? {
                ...g,
                currentAmount: Math.min(
                  g.targetAmount,
                  g.currentAmount + parseInt(values.amount)
                ),
              }
            : g
        )
      );
      setIsContributeModalOpen(false);
      setSelectedGoal(null);
      contributeForm.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleDeleteGoal = (key) => {
    setGoals(goals.filter((g) => g.key !== key));
  };

  const openContributeModal = (goal) => {
    setSelectedGoal(goal);
    contributeForm.resetFields();
    setIsContributeModalOpen(true);
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>Mục Tiêu Tiết Kiệm</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
          Tạo Mục Tiêu
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {goals.map((goal) => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100;
          const daysLeft = dayjs(goal.dueDate).diff(dayjs(), "day");

          return (
            <Col key={goal.key} xs={24} sm={12} lg={8}>
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
                        {goal.targetAmount.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Đã có:</span>
                      <span style={{ fontWeight: "bold", color: "#52c41a" }}>
                        {goal.currentAmount.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Còn lại:</span>
                      <span style={{ fontWeight: "bold" }}>
                        {(goal.targetAmount - goal.currentAmount).toLocaleString("vi-VN")} ₫
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
                    onClick={() => handleDeleteGoal(goal.key)}
                  >
                    Xóa
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Add Goal Modal */}
      <Modal
        title="Tạo Mục Tiêu Tiết Kiệm"
        open={isAddModalOpen}
        onOk={handleAddGoal}
        onCancel={() => setIsAddModalOpen(false)}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            label="Tên Mục Tiêu"
            name="name"
            rules={[{ required: true, message: "Nhập tên mục tiêu" }]}
          >
            <Input placeholder="VD: Tiết kiệm mua xe" />
          </Form.Item>

          <Form.Item
            label="Số Tiền Mục Tiêu"
            name="targetAmount"
            rules={[{ required: true, message: "Nhập số tiền mục tiêu" }]}
          >
            <Input type="number" placeholder="0" min={0} />
          </Form.Item>

          <Form.Item
            label="Ngày Hoàn Thành"
            name="dueDate"
            rules={[{ required: true, message: "Chọn ngày hoàn thành" }]}
          >
            <DatePicker format="DD/MM/YYYY" />
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
          <Form.Item
            label="Số Tiền Nạp"
            name="amount"
            rules={[{ required: true, message: "Nhập số tiền" }]}
          >
            <Input type="number" placeholder="0" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
