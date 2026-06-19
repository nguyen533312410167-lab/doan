import { useState, useEffect } from "react";
import { Layout, Row, Col, Card, Typography, Button, Spin, Modal, Form, InputNumber, Input, Select, message } from "antd";
import { WalletOutlined, ArrowUpOutlined, ArrowDownOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { dashboardService } from "../services/dashboardService.js";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = ["#22C55E", "#A3E635", "#F59E0B", "#8B5CF6", "#38BDF8", "#EF4444", "#EC4899"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDepositOpen, setIsDepositOpen] = useState(false); // Trạng thái đóng/mở Modal
  const [depositLoading, setDepositLoading] = useState(false); // Hiệu ứng chờ khi nạp tiền
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await dashboardService.get();
      setData(response.data);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ LOGIC NẠP TIỀN QUY ĐỔI CLIENT/API MOCK ---
  const handleDepositSubmit = async (values) => {
    try {
      setDepositLoading(true);
      
      // Giả lập gửi dữ liệu lên Server trong 800ms
      await new Promise((resolve) => setTimeout(resolve, 800));

      const depositAmount = parseFloat(values.amount);

      // Cập nhật State cục bộ để giao diện đổi số ngay lập tức
      setData((prevData) => {
        if (!prevData) return prevData;

        // 1. Tạo bản ghi giao dịch mới chèn lên đầu danh sách gần đây
        const newTransaction = {
          id: `txn_deposit_${Date.now()}`,
          type: "income",
          amount: depositAmount,
          description: values.description || "Nạp tiền vào tài khoản",
          category: { name: "Nạp tiền", color: "#22C55E" },
        };

        // 2. Tính toán lại số dư mới dựa trên số vừa nạp
        return {
          ...prevData,
          currentBalance: (prevData.currentBalance || 0) + depositAmount,
          totalIncome: (prevData.totalIncome || 0) + depositAmount,
          monthIncome: (prevData.monthIncome || 0) + depositAmount,
          recentTransactions: [newTransaction, ...(prevData.recentTransactions || [])],
        };
      });

      message.success(`Nạp thành công ${depositAmount.toLocaleString("vi-VN")} ₫ vào ví!`);
      setIsDepositOpen(false); // Đóng hộp thoại nạp tiền
      form.resetFields(); // Xóa sạch dữ liệu đã gõ trong Form
    } catch (error) {
      message.error("Nạp tiền thất bại, vui lòng thử lại.");
    } finally {
      setDepositLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const pieData = data?.expenseByCategory?.map((item) => ({
    name: item.category?.name || "Khác",
    value: parseFloat(item.total),
    color: item.category?.color || "#94A3B8",
  })) || [];

  const barData = data?.monthlyData || [];
  const lineData = barData.map((item) => ({ month: item.month, value: item.income - item.expense }));

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString("vi-VN") + " ₫";
  };

  return (
    <Layout className="dashboard-page">
      <Content>
        <div className="dashboard-header" style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <Title level={2} className="welcome" style={{ margin: 0 }}>
              Xin chào, {user?.fullname || "User"} 👋
            </Title>
            <Text className="sub">Tổng quan tài chính của bạn hôm nay</Text>
          </div>
          
          {/* NÚT KÍCH HOẠT NẠP TIỀN NHANH */}
          <Button 
            type="primary" 
            icon={<PlusCircleOutlined />} 
            size="large"
            onClick={() => setIsDepositOpen(true)}
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 8, fontWeight: 600 }}
          >
            Nạp tiền nhanh
          </Button>
        </div>

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card className="balance-card">
              <Text>Tổng số dư hiện tại</Text>
              <h1>{formatCurrency(data?.currentBalance)}</h1>
              <div className="balance-growth">
                Thu nhập: {formatCurrency(data?.totalIncome)} | Chi tiêu: {formatCurrency(data?.totalExpense)}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card className="stat-card">
                  <WalletOutlined />
                  <p>Thu nhập tháng</p>
                  <h3>{formatCurrency(data?.monthIncome)}</h3>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="stat-card red">
                  <ArrowDownOutlined />
                  <p>Chi tiêu tháng</p>
                  <h3>{formatCurrency(data?.monthExpense)}</h3>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="stat-card">
                  <ArrowUpOutlined />
                  <p>Tiết kiệm</p>
                  <h3>{formatCurrency(data?.monthIncome - data?.monthExpense)}</h3>
                </Card>
              </Col>
            </Row>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="Chi tiêu theo danh mục" className="dark-card">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={80} outerRadius={120}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0" }}>Chưa có dữ liệu</div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title="Thu nhập & Chi tiêu theo tháng" className="dark-card">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData}>
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="income" fill="#22C55E" name="Thu nhập" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#EF4444" name="Chi tiêu" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Xu hướng tài chính" className="dark-card">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={4} dot={{ fill: "#22C55E" }} name="Số dư" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Giao dịch gần đây" className="dark-card">
              {data?.recentTransactions?.length > 0 ? (
                data.recentTransactions.map((txn) => (
                  <div key={txn.id} className="transaction-item" style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1e293b" }}>
                    <span>{txn.category?.name || "Khác"} {txn.description ? `(${txn.description})` : ''}</span>
                    <span className={txn.type === "income" ? "income" : "expense"} style={{ color: txn.type === "income" ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                      {txn.type === "income" ? "+" : "-"}
                      {parseFloat(txn.amount).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "#94A3B8", padding: "20px 0" }}>Chưa có giao dịch nào</div>
              )}
            </Card>
          </Col>
        </Row>

        {/* --- MODAL POPUP DIỄN RA QUY TRÌNH NẠP TIỀN --- */}
        <Modal
          title={<span style={{ color: '#fff', fontSize: 18 }}>Nạp tiền vào tài khoản</span>}
          open={isDepositOpen}
          onCancel={() => { setIsDepositOpen(false); form.resetFields(); }}
          footer={null}
          centered
          destroyOnClose
          className="deposit-modal"
          styles={{ mask: { backdropFilter: 'blur(4px)' } }}
        >
          <Form form={form} layout="vertical" onFinish={handleDepositSubmit} style={{ marginTop: 20 }}>
            <Form.Item
              name="amount"
              label={<span style={{ color: '#94a3b8' }}>Số tiền nạp (VND)</span>}
              rules={[{ required: true, message: "Vui lòng nhập số tiền muốn nạp" }]}
            >
              <InputNumber
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                style={{ width: "100%", height: 45, lineHeight: "45px", borderRadius: 8 }}
                placeholder="Ví dụ: 500,000"
                min={1000}
              />
            </Form.Item>

            <Form.Item
              name="account"
              label={<span style={{ color: '#94a3b8' }}>Tài khoản nhận tiền</span>}
              initialValue="Ví chính"
            >
              <Select style={{ height: 45 }} dropdownStyle={{ background: '#1e293b' }}>
                <Option value="Ví chính">Ví chính</Option>
                <Option value="Tài khoản tiết kiệm">Tài khoản tiết kiệm</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label={<span style={{ color: '#94a3b8' }}>Ghi chú / Nội dung nạp</span>}
            >
              <Input placeholder="Nạp tiền tiêu tháng, quỹ đen..." style={{ height: 42, borderRadius: 8 }} />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "end", gap: 12, marginTop: 24 }}>
              <Button onClick={() => { setIsDepositOpen(false); form.resetFields(); }} style={{ borderRadius: 6 }}>
                Hủy bỏ
              </Button>
              <Button type="primary" htmlType="submit" loading={depositLoading} style={{ backgroundColor: "#22c55e", borderColor: "#22c55e", borderRadius: 6 }}>
                Xác nhận nạp
              </Button>
            </div>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}