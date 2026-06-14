import { Row, Col, Statistic, Alert, Card, Space, Form, InputNumber, Button, Table, Divider } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import mockData, { categoryMap } from "../data/mockData";

export default function Dashboard() {
  // Load transactions from shared mockData (localStorage)
  const [transactions, setTransactions] = useState(mockData.loadTransactions());

  const [incomeInput, setIncomeInput] = useState(0);
  const [historyRange, setHistoryRange] = useState(6);

  const computeStats = (txs, incomeOverride = null) => {
    const income = incomeOverride !== null ? incomeOverride : txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
    };
  };

  const [stats, setStats] = useState(computeStats(transactions));

  const buildExpenseByCategory = (txs) => {
    const map = {};
    txs.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(map).map(([key, value]) => ({ name: categoryMap[key] || key, value, percentage: (value / total) * 100 }));
  };

  const expenseByCategory = buildExpenseByCategory(transactions);

  const buildMonthlyHistory = (txs, months = 6) => {
    const end = dayjs();
    const start = end.subtract(months - 1, "month");
    const monthly = {};

    for (let i = 0; i < months; i += 1) {
      const month = start.add(i, "month");
      const key = month.format("YYYY-MM");
      monthly[key] = { month: month.format("MM/YYYY"), income: 0, expense: 0 };
    }

    txs.forEach((t) => {
      const key = dayjs(t.date).format("YYYY-MM");
      if (monthly[key]) {
        monthly[key][t.type] += t.amount;
      }
    });

    return Object.values(monthly);
  };

  const [monthlyHistory, setMonthlyHistory] = useState(buildMonthlyHistory(transactions, historyRange));

  const incomeVsExpense = monthlyHistory;
  const incomeHistoryTableData = monthlyHistory.map((item, index) => ({ key: index, ...item }));

  useEffect(() => {
    const onUpdate = () => {
      const tx = mockData.loadTransactions();
      setTransactions(tx);
      setStats(computeStats(tx, incomeInput || null));
      setMonthlyHistory(buildMonthlyHistory(tx, historyRange));
    };
    window.addEventListener("transactions_updated", onUpdate);
    return () => window.removeEventListener("transactions_updated", onUpdate);
  }, [incomeInput, historyRange]);

  useEffect(() => {
    setStats(computeStats(transactions, incomeInput || null));
    setMonthlyHistory(buildMonthlyHistory(transactions, historyRange));
  }, [transactions, incomeInput, historyRange]);

  const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d"];

  // Alerts logic
  const alerts = [];

  // Luật 1: Nếu chi tiêu > thu nhập
  if (stats.expense > stats.income) {
    alerts.push({
      type: "error",
      message: "⚠️ Chi tiêu vượt quá thu nhập! Hãy kiểm soát chi tiêu của bạn.",
    });
  }

  // Luật 2: Nếu chi phí ăn uống > 40%
  if (expenseByCategory[0] && expenseByCategory[0].percentage > 40) {
    alerts.push({
      type: "warning",
      message:
        "⚠️ Chi phí ăn uống chiếm trên 40% tổng chi tiêu. Xem xét giảm chi tiêu hàng ngày.",
    });
  }

  // Luật 3: Nếu chi phí giải trí > 25%
  if (expenseByCategory[1] && expenseByCategory[1].percentage > 25) {
    alerts.push({
      type: "warning",
      message:
        "⚠️ Chi phí giải trí chiếm trên 25% tổng chi tiêu. Cân nhắc giảm chi tiêu.",
    });
  }

  // Luật 4: Nếu tổng tiền tiết kiệm < 10% thu nhập
  const savingsPercentage = (stats.balance / stats.income) * 100;
  if (savingsPercentage < 10) {
    alerts.push({
      type: "warning",
      message:
        "⚠️ Tiền tiết kiệm chưa đạt 10% thu nhập. Hãy tăng mục tiêu tiết kiệm.",
    });
  }

  // Luật 5: Nếu mục tiêu tiết kiệm hoàn thành
  // (Placeholder - logic thực tế từ Goals)
  const goalCompleted = false;
  if (goalCompleted) {
    alerts.push({
      type: "success",
      message: "🎉 Chúc mừng! Bạn đã hoàn thành mục tiêu tiết kiệm.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "success",
      message: " Tình hình tài chính của bạn đang ổn định!",
    });
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>Dashboard</h1>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <h3>Nhập thu nhập dùng cho so sánh</h3>
            <Form layout="inline" onFinish={() => {}}>
              <Form.Item label="Thu nhập tháng" style={{ marginBottom: 0 }}>
                <InputNumber
                  value={incomeInput}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                  parser={(value) => Number(value?.replace(/\./g, "") || 0)}
                  onChange={(value) => setIncomeInput(value || 0)}
                  min={0}
                  style={{ width: 200 }}
                />
              </Form.Item>
              <Form.Item label="Số tháng lịch sử" style={{ marginBottom: 0 }}>
                <InputNumber
                  min={3}
                  max={12}
                  value={historyRange}
                  onChange={(value) => setHistoryRange(value || 6)}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" onClick={() => {
                  setStats(computeStats(transactions, incomeInput || null));
                  setMonthlyHistory(buildMonthlyHistory(transactions, historyRange));
                }}>
                  Cập nhật
                </Button>
              </Form.Item>
            </Form>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, color: "#888" }}>Lưu ý: nhập thu nhập để so sánh</div>
          </div>
        </Space>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng Thu Nhập"
              value={stats.income}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#52c41a" }}
              formatter={(value) => `${value.toLocaleString("vi-VN")} ₫`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Tổng Chi Tiêu"
              value={stats.expense}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#f5222d" }}
              formatter={(value) => `${value.toLocaleString("vi-VN")} ₫`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Số Dư Hiện Tại"
              value={stats.balance}
              prefix={<DollarOutlined />}
              valueStyle={{
                color: stats.balance >= 0 ? "#1890ff" : "#f5222d",
              }}
              formatter={(value) => `${value.toLocaleString("vi-VN")} ₫`}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      <Card style={{ marginBottom: "24px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <h3>Trợ Lý Tài Chính</h3>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              message={alert.message}
              type={alert.type}
              showIcon
              style={{ marginBottom: "8px" }}
            />
          ))}
        </Space>
      </Card>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <h3>Phân bổ Chi Tiêu Theo Danh Mục</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString("vi-VN")} ₫`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card>
            <h3>So Sánh Thu Nhập và Chi Tiêu</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString("vi-VN")} ₫`} />
                <Legend />
                <Bar dataKey="income" fill="#52c41a" name="Thu nhập" />
                <Bar dataKey="expense" fill="#f5222d" name="Chi tiêu" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card style={{ marginTop: 24 }}>
        <h3>Lịch sử Thu Nhập / Chi Tiêu ({historyRange} tháng)</h3>
        <Table
          dataSource={incomeHistoryTableData}
          pagination={false}
          columns={[
            { title: "Tháng", dataIndex: "month", key: "month" },
            {
              title: "Thu nhập",
              dataIndex: "income",
              key: "income",
              render: (value) => `${value.toLocaleString("vi-VN")} ₫`,
            },
            {
              title: "Chi tiêu",
              dataIndex: "expense",
              key: "expense",
              render: (value) => `${value.toLocaleString("vi-VN")} ₫`,
            },
            {
              title: "Chênh lệch",
              key: "balance",
              render: (_, record) => `${(record.income - record.expense).toLocaleString("vi-VN")} ₫`,
            },
          ]}
        />
      </Card>
    </div>
  );
}
