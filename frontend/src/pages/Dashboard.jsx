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
  <div
    style={{
      padding: "24px",
      background: "#05070d",
      minHeight: "100vh",
      color: "#fff",
    }}
  >
    {contextHolder}

    {/* HEADER CARD */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}
    >
      <div>
        <h2 style={{ margin: 0, color: "#fff" }}>Tổng quan</h2>
        <div style={{ color: "#94a3b8", fontSize: 13 }}>
          Quản lý tài chính cá nhân
        </div>
      </div>
    </div>

    {/* TOP STATS */}
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card
          style={{
            background: "linear-gradient(135deg,#0b1220,#0a1a12)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: 16,
          }}
        >
          <div style={{ color: "#94a3b8", marginBottom: 8 }}>
            Tổng số dư hiện tại
          </div>

          <div style={{ fontSize: 32, fontWeight: 700, color: "#22c55e" }}>
            {(stats.balance || 0).toLocaleString("vi-VN")} ₫
          </div>

          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
            so với tháng trước
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          style={{
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
        >
          <Statistic
            title={<span style={{ color: "#94a3b8" }}>Thu nhập</span>}
            value={stats.income}
            valueStyle={{ color: "#22c55e" }}
            formatter={(v) => `${v.toLocaleString("vi-VN")} ₫`}
          />
          <Statistic
            title={<span style={{ color: "#94a3b8" }}>Chi tiêu</span>}
            value={stats.expense}
            valueStyle={{ color: "#ef4444" }}
            formatter={(v) => `${v.toLocaleString("vi-VN")} ₫`}
          />
        </Card>
      </Col>
    </Row>

    {/* ALERTS */}
    <Card
      style={{
        marginTop: 16,
        background: "#0b1220",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
      }}
    >
      <h3 style={{ color: "#fff" }}>Trợ lý tài chính</h3>

      {alerts.map((a, i) => (
        <Alert
          key={i}
          message={a.message}
          type={a.type}
          showIcon
          style={{
            marginBottom: 8,
            background: "rgba(255,255,255,0.02)",
            border: "none",
          }}
        />
      ))}
    </Card>

    {/* CHART ROW */}
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} lg={12}>
        <Card
          style={{
            background: "#0b1220",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h3 style={{ color: "#fff" }}>Chi tiêu theo danh mục</h3>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percentage }) =>
                  `${name}: ${percentage.toFixed(0)}%`
                }
              >
                {expenseByCategory.map((_, i) => (
                  <Cell
                    key={i}
                    fill={["#22c55e", "#16a34a", "#84cc16", "#f59e0b"][i % 4]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card
          style={{
            background: "#0b1220",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h3 style={{ color: "#fff" }}>Thu & Chi</h3>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[
                { name: "Thu", value: stats.income },
                { name: "Chi", value: stats.expense },
              ]}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>

    {/* TABLE */}
    <Card
      style={{
        marginTop: 16,
        background: "#0b1220",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 style={{ color: "#fff" }}>Lịch sử theo tháng</h3>

        <DatePicker
          picker="month"
          value={historyMonth}
          onChange={(d) => d && setHistoryMonth(d)}
        />
      </div>

      <Table
        dataSource={[singleMonthData]}
        pagination={false}
        style={{ marginTop: 10 }}
        columns={[
          { title: "Tháng", dataIndex: "month" },
          {
            title: "Thu nhập",
            dataIndex: "income",
            render: (v) => `${v.toLocaleString("vi-VN")} ₫`,
          },
          {
            title: "Chi tiêu",
            dataIndex: "expense",
            render: (v) => `${v.toLocaleString("vi-VN")} ₫`,
          },
        ]}
      />
    </Card>
  </div>
);
}