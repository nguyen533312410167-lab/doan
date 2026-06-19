import { useState, useEffect } from "react";
import { Layout, Row, Col, Card, Typography, Avatar, Button, Spin } from "antd";
import { BellOutlined, WalletOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { dashboardService } from "../services/dashboardService.js";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const { Content } = Layout;
const { Title, Text } = Typography;

const COLORS = ["#22C55E", "#A3E635", "#F59E0B", "#8B5CF6", "#38BDF8", "#EF4444", "#EC4899"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
        <div className="dashboard-header">
          <div>
            <Title level={2} className="welcome">
              Xin chào, {user?.fullname || "User"} 👋
            </Title>
            <Text className="sub">Tổng quan tài chính của bạn hôm nay</Text>
          </div>
          <div className="header-actions">
            <Button shape="circle" icon={<BellOutlined />} onClick={() => navigate("/thongbao")} />
            <Avatar size={48}>{user?.fullname?.[0] || "U"}</Avatar>
          </div>
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
                  <div key={txn.id} className="transaction-item">
                    <span>{txn.category?.name || "Khác"}</span>
                    <span className={txn.type === "income" ? "income" : "expense"}>
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
      </Content>
    </Layout>
  );
}