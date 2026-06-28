import { Button, Card, Col, ConfigProvider, DatePicker, Form, Input, InputNumber, Modal, Progress, Row, Space, Tag, Typography, message, theme } from "antd";
import { PlusOutlined, DollarOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, ExportOutlined } from "@ant-design/icons";
import { useState, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { SAVING_GOALS, CREATE_SAVING_GOAL, DELETE_SAVING_GOAL, DEPOSIT_TO_GOAL, WITHDRAW_FROM_GOAL } from "../graphql/goals.js";
import { useNotificationRefresh } from "../contexts/NotificationContext.jsx";

const { Text } = Typography;
const { TextArea } = Input;

export default function Goals() {
  const [messageApi, contextHolder] = message.useMessage();
  const { refreshNotifications } = useNotificationRefresh();

  const { data: goalsData, loading, refetch } = useQuery(SAVING_GOALS, {
    fetchPolicy: "network-only",
  });
  const goals = goalsData?.savingGoals || [];

  const [createGoal] = useMutation(CREATE_SAVING_GOAL, {
    onCompleted: () => { refetch(); refreshNotifications(); messageApi.success("Đã tạo mục tiêu mới!"); },
    onError: (err) => messageApi.error(err.message),
  });

  const [deleteGoal, { loading: deleteLoading }] = useMutation(DELETE_SAVING_GOAL, {
    onCompleted: (data) => {
      refetch();
      refreshNotifications();
      const txn = data.deleteSavingGoal.transaction;
      if (txn) {
        messageApi.success(
          `Đã tất toán ${parseFloat(txn.amount).toLocaleString("vi-VN")}₫ và xóa mục tiêu!`
        );
      } else {
        messageApi.success("Đã xóa mục tiêu!");
      }
    },
    onError: (err) => messageApi.error(err.message),
  });

  const [depositToGoal, { loading: depositLoading }] = useMutation(DEPOSIT_TO_GOAL, {
    onCompleted: (data) => {
      refetch();
      refreshNotifications();
      const goal = data.depositToGoal.savingGoal;
      if (goal.isCompleted) {
        messageApi.success(`🎉 Chúc mừng! Mục tiêu "${goal.name}" đã hoàn thành!`);
      } else {
        messageApi.success("Nạp tiền thành công!");
      }
      setIsDepositModalOpen(false);
      setSelectedGoal(null);
      depositForm.resetFields();
    },
    onError: (err) => messageApi.error(err.message),
  });

  const [withdrawFromGoal, { loading: withdrawLoading }] = useMutation(WITHDRAW_FROM_GOAL, {
    onCompleted: (data) => {
      refetch();
      refreshNotifications();
      const txn = data.withdrawFromGoal.transaction;
      messageApi.success(
        `Đã rút ${parseFloat(txn.amount).toLocaleString("vi-VN")}₫ thành công!`
      );
      setIsWithdrawModalOpen(false);
      setSelectedGoal(null);
      withdrawForm.resetFields();
    },
    onError: (err) => messageApi.error(err.message),
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [addForm] = Form.useForm();
  const [depositForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // Guard ref to prevent double-submission of deposit/withdraw
  const isSubmittingRef = useRef(false);

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
    }
  };

  const handleDeleteGoal = (goal) => {
    const remaining = parseFloat(goal.currentAmount);
    let message = "Bạn có chắc muốn xóa mục tiêu này?";
    if (remaining > 0) {
      message = `Mục tiêu còn ${remaining.toLocaleString("vi-VN")}₫. Hệ thống sẽ tự động tất toán (chuyển thành thu nhập) trước khi xóa. Tiếp tục?`;
    }
    Modal.confirm({
      title: "Tất toán / Xóa mục tiêu",
      content: message,
      okText: "Xác nhận",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        await deleteGoal({ variables: { id: goal.id } });
      },
    });
  };

  const openDepositModal = (goal) => {
    setSelectedGoal(goal);
    depositForm.resetFields();
    setIsDepositModalOpen(true);
  };

  const openWithdrawModal = (goal) => {
    setSelectedGoal(goal);
    withdrawForm.resetFields();
    setIsWithdrawModalOpen(true);
  };

  const handleDeposit = async () => {
  if (depositSubmitting) return;

  try {
    const values = await depositForm.validateFields();

    setDepositSubmitting(true);

    await depositToGoal({
      variables: {
        goalId: selectedGoal.id,
        amount: String(values.amount),
      },
    });

  } catch (error) {
    if (error.errorFields) return;
  } finally {
    setDepositSubmitting(false);
  }
};

  const handleWithdraw = async () => {
    // Prevent double-submission: if already submitting, ignore the click
    if (isSubmittingRef.current) return;
    try {
      const values = await withdrawForm.validateFields();
      isSubmittingRef.current = true;
      await withdrawFromGoal({
        variables: {
          goalId: selectedGoal.id,
          amount: String(values.amount),
          date: values.date ? values.date.format("YYYY-MM-DD") : undefined,
          note: values.note || "",
        },
      });
    } catch (error) {
      if (error.errorFields) return;
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString("vi-VN") + " ₫";
  };

  const getDaysLeftText = (daysLeft) => {
    if (daysLeft > 0) return `Còn ${daysLeft} ngày`;
    if (daysLeft === 0) return "Hết hạn hôm nay";
    return `Quá hạn ${Math.abs(daysLeft)} ngày`;
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#22c55e",
          borderRadius: 12,
        },
        components: {
          Card: { colorBgContainer: "#0b1220" },
          Modal: { contentBg: "#0b1220", headerBg: "#111827", titleColor: "#ffffff" },
          Form: { labelColor: "#94a3b8" },
          Input: { colorBgContainer: "#111827", colorText: "#ffffff", colorBorder: "rgba(255,255,255,0.12)" },
          InputNumber: { colorBgContainer: "#111827", colorText: "#ffffff", colorBorder: "rgba(255,255,255,0.12)" },
          Select: { colorBgContainer: "#111827", colorText: "#ffffff", colorBorder: "rgba(255,255,255,0.12)" },
          DatePicker: { colorBgContainer: "#111827", colorText: "#ffffff", colorBorder: "rgba(255,255,255,0.12)" },
        },
      }}
    >
      <div style={{ padding: "24px", background: "#0b0f14", minHeight: "100vh", color: "#fff" }}>
        {contextHolder}

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 700, margin: 0 }}>
            Mục Tiêu Tiết Kiệm
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: "#22c55e", borderColor: "#22c55e" }}
          >
            Tạo Mục Tiêu
          </Button>
        </div>

        {/* Goals Grid */}
        <Row gutter={[16, 16]}>
          {loading ? (
            <Col span={24}><Card loading style={{ background: "#0b1220" }} /></Col>
          ) : goals.length === 0 ? (
            <Col span={24}>
              <Card
                style={{
                  background: "#0b1220",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.06)",
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                <Text style={{ color: "#94a3b8", fontSize: 16 }}>
                  Chưa có mục tiêu tiết kiệm nào. Hãy tạo mục tiêu mới!
                </Text>
              </Card>
            </Col>
          ) : (
            goals.map((goal) => {
              const percentage = goal.progressPercent || 0;
              const isCompleted = goal.isCompleted;
              const isOverdue = goal.daysLeft < 0 && !isCompleted;

              return (
                <Col key={goal.id} xs={24} sm={12} lg={8}>
                  <Card
                    hoverable
                    style={{
                      background: "#0b1220",
                      borderRadius: 16,
                      border: `1px solid ${
                        isCompleted
                          ? "rgba(82,196,26,0.3)"
                          : isOverdue
                          ? "rgba(245,34,45,0.3)"
                          : "rgba(255,255,255,0.06)"
                      }`,
                      borderTop: `4px solid ${
                        isCompleted ? "#52c41a" : isOverdue ? "#f5222d" : "#22c55e"
                      }`,
                    }}
                  >
                    {/* Goal Name & Status */}
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <h3 style={{ margin: 0, color: "#fff", fontSize: 18 }}>{goal.name}</h3>
                        {isCompleted && (
                          <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>
                            Hoàn thành
                          </Tag>
                        )}
                      </div>
                      {goal.note && (
                        <Text style={{ color: "#94a3b8", fontSize: 13 }}>{goal.note}</Text>
                      )}
                    </div>

                    {/* Amount Details */}
                    <Space direction="vertical" style={{ width: "100%", marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text style={{ color: "#94a3b8" }}>Mục tiêu:</Text>
                        <Text strong style={{ color: "#fff" }}>{formatCurrency(goal.targetAmount)}</Text>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text style={{ color: "#94a3b8" }}>Đã tiết kiệm:</Text>
                        <Text strong style={{ color: isCompleted ? "#52c41a" : "#22c55e" }}>
                          {formatCurrency(goal.currentAmount)}
                        </Text>
                      </div>
                      {!isCompleted && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <Text style={{ color: "#94a3b8" }}>Cần thêm:</Text>
                          <Text strong style={{ color: "#f5222d" }}>
                            {formatCurrency(
                              parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)
                            )}
                          </Text>
                        </div>
                      )}
                    </Space>

                    {/* Progress Bar */}
                    <Progress
                      percent={Math.round(percentage)}
                      status={isCompleted ? "success" : isOverdue ? "exception" : "active"}
                      strokeColor={isCompleted ? "#52c41a" : isOverdue ? "#f5222d" : "#22c55e"}
                      trailColor="rgba(255,255,255,0.06)"
                      style={{ marginBottom: "12px" }}
                    />

                    {/* Days Left */}
                    <div style={{ marginBottom: "16px", fontSize: "13px" }}>
                      {isCompleted ? (
                        <Text style={{ color: "#52c41a" }}>
                          <CheckCircleOutlined /> Đã hoàn thành mục tiêu
                        </Text>
                      ) : (
                        <Text style={{ color: isOverdue ? "#f5222d" : "#94a3b8" }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {getDaysLeftText(goal.daysLeft)}
                        </Text>
                      )}
                    </div>

                    {/* Actions */}
                    <Space style={{ width: "100%" }}>
                      <Button
                        type="primary"
                        block
                        icon={<DollarOutlined />}
                        onClick={() => openDepositModal(goal)}
                        disabled={isCompleted}
                        style={{
                          background: isCompleted ? "#555" : "#22c55e",
                          borderColor: isCompleted ? "#555" : "#22c55e",
                        }}
                      >
                        {isCompleted ? "Đã hoàn thành" : "Nạp Tiền"}
                      </Button>
                      <Button
                        block
                        icon={<ExportOutlined />}
                        onClick={() => openWithdrawModal(goal)}
                        disabled={isCompleted || parseFloat(goal.currentAmount) <= 0}
                        style={{
                          color: isCompleted || parseFloat(goal.currentAmount) <= 0 ? "#555" : "#faad14",
                          borderColor: isCompleted || parseFloat(goal.currentAmount) <= 0 ? "#333" : "#faad14",
                        }}
                      >
                        Rút Tiền
                      </Button>
                      <Button
                        danger
                        block
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteGoal(goal)}
                        loading={deleteLoading}
                      >
                        Tất toán / Xóa
                      </Button>
                    </Space>
                  </Card>
                </Col>
              );
            })
          )}
        </Row>

        {/* Add Goal Modal */}
        <Modal
          title={<span style={{ color: "#fff" }}>Tạo Mục Tiêu Tiết Kiệm</span>}
          open={isAddModalOpen}
          onOk={handleAddGoal}
          onCancel={() => setIsAddModalOpen(false)}
          okButtonProps={{ style: { background: "#22c55e", borderColor: "#22c55e" } }}
          destroyOnClose
          style={{ top: 20 }}
        >
          <Form form={addForm} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              label={<span style={{ color: "#fff" }}>Tên mục tiêu</span>}
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên mục tiêu" }]}
            >
              <Input placeholder="VD: Mua xe máy, Du lịch Nhật Bản..." />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: "#fff" }}>Số tiền mục tiêu</span>}
              name="targetAmount"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền mục tiêu" },
                { type: "number", min: 1, message: "Số tiền phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                placeholder="Nhập số tiền mục tiêu"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/,/g, "")}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: "#fff" }}>Ngày hoàn thành dự kiến</span>}
              name="dueDate"
              rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label={<span style={{ color: "#fff" }}>Mô tả / Ghi chú</span>}
              name="note"
            >
              <Input placeholder="Ghi chú (không bắt buộc)" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Deposit Modal */}
        <Modal
          title={
            <span style={{ color: "#fff" }}>
              Nạp tiền vào: <strong>{selectedGoal?.name}</strong>
            </span>
          }
          open={isDepositModalOpen}
          onOk={() => {
    if (!depositSubmitting) {
        handleDeposit();
    }
}}
          onCancel={() => {
            setIsDepositModalOpen(false);
            setSelectedGoal(null);
          }}
          confirmLoading={depositLoading || depositSubmitting}
          okButtonProps={{
  loading: depositLoading || depositSubmitting,
  disabled: depositLoading || depositSubmitting,
  style: {
    background: "#22c55e",
    borderColor: "#22c55e",
  },
}}
          destroyOnClose
          style={{ top: 20 }}
        >
          <Form form={depositForm} layout="vertical" style={{ marginTop: 16 }}>
            {selectedGoal && (
              <div
                style={{
                  background: "rgba(34,197,94,0.08)",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: "16px",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8" }}>Mục tiêu:</span>
                  <span style={{ color: "#fff", fontWeight: "bold" }}>
                    {formatCurrency(selectedGoal.targetAmount)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8" }}>Đã tiết kiệm:</span>
                  <span style={{ color: "#22c55e", fontWeight: "bold" }}>
                    {formatCurrency(selectedGoal.currentAmount)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Còn thiếu:</span>
                  <span style={{ color: "#f5222d", fontWeight: "bold" }}>
                    {formatCurrency(
                      parseFloat(selectedGoal.targetAmount) - parseFloat(selectedGoal.currentAmount)
                    )}
                  </span>
                </div>
              </div>
            )}

            <Form.Item
              label={<span style={{ color: "#fff" }}>Số tiền muốn nạp</span>}
              name="amount"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền" },
                { type: "number", min: 1, message: "Số tiền phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                placeholder="Nhập số tiền"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/,/g, "")}
              />
            </Form.Item>

            <div
              style={{
                background: "rgba(245,34,45,0.06)",
                borderRadius: 8,
                padding: "12px",
                border: "1px solid rgba(245,34,45,0.15)",
              }}
            >
              <span style={{ color: "#94a3b8", fontSize: 13 }}>
                💡 Khi nạp tiền, hệ thống sẽ tự động tạo một giao dịch chi tiêu và xuất hiện trong Quản lý giao dịch & Dashboard.
              </span>
            </div>
          </Form>
        </Modal>

        {/* Withdraw Modal */}
        <Modal
          title={
            <span style={{ color: "#fff" }}>
              Rút tiền từ: <strong>{selectedGoal?.name}</strong>
            </span>
          }
          open={isWithdrawModalOpen}
          onOk={handleWithdraw}
          onCancel={() => {
            setIsWithdrawModalOpen(false);
            setSelectedGoal(null);
          }}
          confirmLoading={withdrawLoading}
          okButtonProps={{ style: { background: "#faad14", borderColor: "#faad14" } }}
          destroyOnClose
          style={{ top: 20 }}
        >
          <Form form={withdrawForm} layout="vertical" style={{ marginTop: 16 }}>
            {selectedGoal && (
              <div
                style={{
                  background: "rgba(250,173,20,0.08)",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: "16px",
                  border: "1px solid rgba(250,173,20,0.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8" }}>Mục tiêu:</span>
                  <span style={{ color: "#fff", fontWeight: "bold" }}>
                    {formatCurrency(selectedGoal.targetAmount)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8" }}>Đang có:</span>
                  <span style={{ color: "#22c55e", fontWeight: "bold" }}>
                    {formatCurrency(selectedGoal.currentAmount)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Có thể rút tối đa:</span>
                  <span style={{ color: "#faad14", fontWeight: "bold" }}>
                    {formatCurrency(selectedGoal.currentAmount)}
                  </span>
                </div>
              </div>
            )}

            <Form.Item
              label={<span style={{ color: "#fff" }}>Số tiền muốn rút</span>}
              name="amount"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền" },
                { type: "number", min: 1, message: "Số tiền phải lớn hơn 0" },
                {
                  validator: (_, value) => {
                    if (selectedGoal && value > parseFloat(selectedGoal.currentAmount)) {
                      return Promise.reject(
                        new Error(
                          `Số tiền rút không được lớn hơn số dư (${formatCurrency(selectedGoal.currentAmount)})`
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={selectedGoal ? parseFloat(selectedGoal.currentAmount) : undefined}
                placeholder="Nhập số tiền muốn rút"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/,/g, "")}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: "#fff" }}>Ngày rút</span>}
              name="date"
            >
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                defaultValue={dayjs()}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: "#fff" }}>Ghi chú</span>}
              name="note"
            >
              <TextArea rows={2} placeholder="Lý do rút tiền (không bắt buộc)" />
            </Form.Item>

            <div
              style={{
                background: "rgba(250,173,20,0.06)",
                borderRadius: 8,
                padding: "12px",
                border: "1px solid rgba(250,173,20,0.15)",
              }}
            >
              <span style={{ color: "#94a3b8", fontSize: 13 }}>
                💡 Khi rút tiền, hệ thống sẽ tự động tạo một giao dịch thu nhập (INCOME) và giảm số dư tiết kiệm trên Dashboard.
              </span>
            </div>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}