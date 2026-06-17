import { Row, Col, Statistic, Alert, Card, Space, Form, InputNumber, Table, Divider, DatePicker, message, Button } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { CATEGORIES } from "../graphql/transactions.js";
import { useQuery } from "@apollo/client";

const API_URL = "http://localhost:8000/graphql/";

async function graphqlRequest(query, variables = {}) {
  const token = localStorage.getItem("account_admin_token");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export default function Dashboard() {
  const [messageApi, contextHolder] = message.useMessage();
  const currentMonth = dayjs();
  const currentYear = currentMonth.year();
  const currentMonthNum = currentMonth.month() + 1;

  const [incomeInput, setIncomeInput] = useState(null);
  const [historyMonth, setHistoryMonth] = useState(dayjs());
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: catData } = useQuery(CATEGORIES);
  const categories = catData?.categories || [];

  const mergedCategoryMap = {};
  categories.forEach(c => {
    mergedCategoryMap[c.name] = c.nameVi || c.name;
  });

  // Load transactions directly via fetch - no Apollo cache
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await graphqlRequest(
        `query T($year: Int!) { transactions(year: $year) { id type amount date categoryName } }`,
        { year: currentYear }
      );
      if (result.data?.transactions) {
        setTransactions(result.data.transactions);
      }
    } catch (e) {
      console.error("Load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const currentMonthTxns = transactions.filter((t) => {
    const d = dayjs(t.date);
    return d.month() + 1 === currentMonthNum && d.year() === currentYear;
  });

  const computeStats = (txs) => {
    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
    return { income, expense, balance: income - expense };
  };

  const stats = computeStats(currentMonthTxns);

  const buildExpenseByCategory = (txs) => {
    const map = {};
    txs.filter((t) => t.type === "expense").forEach((t) => {
      const catName = t.categoryName || mergedCategoryMap[t.category?.name] || "Khác";
      map[catName] = (map[catName] || 0) + parseFloat(t.amount);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(map).map(([key, value]) => ({ name: key, value, percentage: (value / total) * 100 }));
  };

  const expenseByCategory = buildExpenseByCategory(currentMonthTxns);

  const singleMonthData = (() => {
    const key = historyMonth.format("YYYY-MM");
    const txMonth = transactions.filter((t) => dayjs(t.date).format("YYYY-MM") === key);
    const income = txMonth.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
    const expense = txMonth.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
    return { key, month: historyMonth.format("MM/YYYY"), income, expense, balance: income - expense };
  })();

  const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d"];

  const alerts = [];
  if (stats.expense > stats.income) {
    alerts.push({ type: "error", message: "⚠️ Chi tiêu vượt quá thu nhập! Hãy kiểm soát chi tiêu của bạn." });
  }
  const eatingCategory = expenseByCategory.find((c) => c.name === "Ăn uống");
  if (eatingCategory && eatingCategory.percentage > 40) {
    alerts.push({ type: "warning", message: "⚠️ Chi phí ăn uống chiếm trên 40% tổng chi tiêu." });
  }
  const entertainmentCategory = expenseByCategory.find((c) => c.name === "Giải trí");
  if (entertainmentCategory && entertainmentCategory.percentage > 25) {
    alerts.push({ type: "warning", message: "⚠️ Chi phí giải trí chiếm trên 25% tổng chi tiêu." });
  }
  const savingsPercentage = stats.income > 0 ? (stats.balance / stats.income) * 100 : 0;
  if (savingsPercentage < 10) {
    alerts.push({ type: "warning", message: "⚠️ Tiền tiết kiệm chưa đạt 10% thu nhập." });
  }
  if (alerts.length === 0) {
    alerts.push({ type: "success", message: "Tình hình tài chính của bạn đang ổn định!" });
  }

  const handleSaveIncome = async () => {
    if (!incomeInput || incomeInput <= 0) {
      messageApi.warning("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    setSaving(true);
    try {
      const result = await graphqlRequest(
        `mutation M($transactionType: String!, $amount: String!, $date: String!) {
          createTransaction(transactionType: $transactionType, amount: $amount, date: $date) {
            transaction { id type amount date }
          }
        }`,
        {
          transactionType: "income",
          amount: String(incomeInput),
          date: currentMonth.format("YYYY-MM-DD"),
        }
      );

      if (result.errors) {
        messageApi.error(result.errors[0].message || "Lưu thất bại");
      } else {
        setIncomeInput(null);
        messageApi.success("Đã lưu thu nhập vào database!");
        // Reload transactions fresh from server
        await loadTransactions();
      }
    } catch (err) {
      messageApi.error(err.message || "Lưu thất bại");
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1>Dashboard</h1>
      {contextHolder}

      <Card style={{ marginBottom: 16 }}>
        <Space wrap align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <h3>Thêm Thu Nhập</h3>
            <Form layout="inline" onFinish={() => {}}>
              <Form.Item label={`Tháng ${currentMonth.format("MM/YYYY")}`} style={{ marginBottom: 0 }}>
                <InputNumber
                  value={incomeInput}
                  placeholder="Nhập số tiền"
                  onChange={(value) => setIncomeInput(value)}
                  min={0}
                  style={{ width: 200 }}
                />
              </Form.Item>
              <Button
                type="primary"
                onClick={handleSaveIncome}
                loading={saving}
                style={{ background: "#22C55E", borderColor: "#22C55E" }}
              >
                Lưu thu nhập
              </Button>
            </Form>
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Tổng Thu Nhập" value={stats.income} prefix={<DollarOutlined />}
              valueStyle={{ color: "#52c41a" }} loading={loading}
              formatter={(value) => `${value.toLocaleString("vi-VN")} ₫`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Tổng Chi Tiêu" value={stats.expense} prefix={<DollarOutlined />}
              valueStyle={{ color: "#f5222d" }} loading={loading}
              formatter={(value) => `${value.toLocaleString("vi-VN")} ₫`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Số Dư Hiện Tại" value={stats.balance} prefix={<DollarOutlined />}
              valueStyle={{ color: stats.balance >= 0 ? "#1890ff" : "#f5222d" }} loading={loading}
              formatter={(value) => `${value.toLocaleString("vi-VN")} ₫`} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: "24px" }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <h3>Trợ Lý Tài Chính</h3>
          {alerts.map((alert, index) => (
            <Alert key={index} message={alert.message} type={alert.type} showIcon style={{ marginBottom: "8px" }} />
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <h3>Phân bổ Chi Tiêu Theo Danh Mục</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80} fill="#8884d8" dataKey="value">
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
              <BarChart data={[
                { name: "Thu nhập", income: stats.income, expense: 0 },
                { name: "Chi tiêu", income: 0, expense: stats.expense },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Lịch sử Thu Nhập / Chi Tiêu</h3>
          <DatePicker picker="month" value={historyMonth}
            onChange={(date) => date && setHistoryMonth(date)}
            format="MM/YYYY" allowClear={false} style={{ width: 140 }} />
        </div>
        <Table dataSource={[singleMonthData]} pagination={false} columns={[
          { title: "Tháng", dataIndex: "month", key: "month" },
          { title: "Thu nhập", dataIndex: "income", key: "income", render: (v) => `${v.toLocaleString("vi-VN")} ₫` },
          { title: "Chi tiêu", dataIndex: "expense", key: "expense", render: (v) => `${v.toLocaleString("vi-VN")} ₫` },
          { title: "Chênh lệch", key: "balance", render: (_, r) => `${(r.income - r.expense).toLocaleString("vi-VN")} ₫` },
        ]} />
      </Card>
    </div>
  );
}