import { useState, useEffect } from "react";
import { Card, Button, Modal, Form, Input, InputNumber, DatePicker, Progress, Row, Col, Space, message, Spin } from "antd";
import { PlusOutlined, DollarOutlined, DeleteOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { goalService } from "../services/goalService.js";
import dayjs from "dayjs";

export default function Goals() {
  const [messageApi, contextHolder] = message.useMessage();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [action, setAction] = useState("deposit");
  const [addForm] = Form.useForm();
  const [actionForm] = Form.useForm();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const response = await goalService.getAll();
      setGoals(response.data);
    } catch (error) {
      messageApi.error("Tải mục tiêu thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    try {
      const values = await addForm.validateFields();
      await goalService.create({
        name: values.name,
        target_amount: values.target_amount,
        deadline: values.deadline ? values.deadline.format("YYYY-MM-DD") : null,
        icon: values.icon,
      });
      messageApi.success("Đã tạo mục tiêu");
      setIsAddModalOpen(false);
      addForm.resetFields();
      loadGoals();
    } catch (error) {
      if (error.errorFields) return;
      messageApi.error(error.response?.data?.message || "Tạo thất bại");
    }
  };

  const handleDeleteGoal = (id) => {
    Modal.confirm({
      title: "Xóa mục tiêu?",
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await goalService.delete(id);
          messageApi.success("Đã xóa mục tiêu");
          loadGoals();
        } catch (error) {
          messageApi.error("Xóa thất bại");
        }
      },
    });
  };

  const openActionModal = (goal, type) => {
    setSelectedGoal(goal);
    setAction(type);
    actionForm.resetFields();
    setIsActionModalOpen(true);
  };

  const handleAction = async () => {
    try {
      const values = await actionForm.validateFields();
      if (action === "deposit") {
        await goalService.deposit(selectedGoal.id, values.amount);
        messageApi.success("Đã nạp tiền vào mục tiêu");
      } else {
        await goalService.withdraw(selectedGoal.id, values.amount);
        messageApi.success("Đã rút tiền từ mục tiêu");
      }
      setIsActionModalOpen(false);
      setSelectedGoal(null);
      loadGoals();
    } catch (error) {
      if (error.errorFields) return;
      messageApi.error(error.response?.data?.message || "Thực hiện thất bại");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", background: "#0F172A", minHeight: "100vh" }}>
      {contextHolder}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#fff", margin: 0 }}>Mục Tiêu Tiết Kiệm</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
          Tạo Mục Tiêu
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {goals.map((goal) => {
          const percentage = goal.progressPercent || 0;
          return (
            <Col key={goal.id} xs={24} sm={12} lg={8}>
              <Card hoverable className="goal-card">
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ color: "#fff", marginBottom: 8 }}>{goal.name}</h3>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8" }}>
                      <span>Mục tiêu:</span>
                      <span style={{ fontWeight: "bold", color: "#fff" }}>
                        {parseFloat(goal.target_amount).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Đã có:</span>
                      <span style={{ fontWeight: "bold", color: "#22C55E" }}>
                        {parseFloat(goal.current_amount).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8" }}>
                      <span>Còn lại:</span>
                      <span style={{ fontWeight: "bold", color: "#fff" }}>
                        {(parseFloat(goal.target_amount) - parseFloat(goal.current_amount)).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </Space>
                </div>

                <Progress
                  percent={Math.round(percentage)}
                  status={percentage >= 100 ? "success" : "active"}
                  strokeColor={percentage >= 100 ? "#22C55E" : "#22C55E"}
                  trailColor="#334155"
                  style={{ marginBottom: 16 }}
                />

                <div style={{ marginBottom: 16, fontSize: 12, color: "#94A3B8" }}>
                  {goal.daysLeft !== null ? (
                    goal.daysLeft > 0 ? (
                      <span>Hết hạn trong {goal.daysLeft} ngày</span>
                    ) : (
                      <span style={{ color: "#EF4444" }}>Đã quá hạn</span>
                    )
                  ) : (
                    <span>Không có hạn</span>
                  )}
                </div>

                <Space style={{ width: "100%" }}>
                  <Button type="primary" block size="small" icon={<DollarOutlined />}
                    onClick={() => openActionModal(goal, "deposit")}>
                    Nạp Tiền
                  </Button>
                  <Button block size="small" icon={<MinusCircleOutlined />}
                    onClick={() => openActionModal(goal, "withdraw")}
                    disabled={parseFloat(goal.current_amount) <= 0}>
                    Rút
                  </Button>
                  <Button danger block size="small" icon={<DeleteOutlined />}
                    onClick={() => handleDeleteGoal(goal.id)}>
                    Xóa
                  </Button>
                </Space>
              </Card>
            </Col>
          );
        })}
        {!loading && goals.length === 0 && (
          <Col span={24}>
            <Card style={{ background: "#1E293B", borderColor: "#334155" }}>
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
                Chưa có mục tiêu tiết kiệm nào. Hãy tạo mục tiêu mới!
              </div>
            </Card>
          </Col>
        )}
      </Row>

      <Modal title="Tạo Mục Tiêu" open={isAddModalOpen}
        onOk={handleAddGoal} onCancel={() => { setIsAddModalOpen(false); addForm.resetFields(); }}
        okText="Lưu" cancelText="Hủy">
        <Form form={addForm} layout="vertical">
          <Form.Item label="Tên Mục Tiêu" name="name" rules={[{ required: true, message: "Nhập tên mục tiêu" }]}>
            <Input placeholder="VD: Mua xe, Du lịch..." />
          </Form.Item>
          <Form.Item label="Số Tiền Mục Tiêu" name="target_amount"
            rules={[{ required: true, message: "Nhập số tiền" }]}>
            <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
          </Form.Item>
          <Form.Item label="Ngày Hoàn Thành" name="deadline">
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`${action === "deposit" ? "Nạp" : "Rút"} Tiền: ${selectedGoal?.name}`}
        open={isActionModalOpen}
        onOk={handleAction}
        onCancel={() => { setIsActionModalOpen(false); setSelectedGoal(null); }}
        okText="Xác nhận" cancelText="Hủy">
        <Form form={actionForm} layout="vertical">
          <Form.Item label="Số Tiền" name="amount" rules={[{ required: true, message: "Nhập số tiền" }]}>
            <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}