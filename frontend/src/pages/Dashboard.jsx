import {
  Row,
  Col,
  Statistic,
  Card,
  Table,
  DatePicker,
  message,
  Button,
  ConfigProvider,
  theme,
  InputNumber,
  Alert
} from "antd";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import "antd/dist/reset.css";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isIncome = (type) => {
  if (typeof type === "string") return type.toLowerCase() === "income";
  if (type && typeof type === "object") {
    return type.name?.toLowerCase?.() === "income" || type.value?.toLowerCase?.() === "income";
  }
  return false;
};

const safeNum = (v) => {
  const n = Number(v);
  return isNaN(n) || !isFinite(n) ? 0 : n;
};

const computeStats = (txs) => {
  const income = txs
    .filter((t) => isIncome(t.type))
    .reduce((s, t) => s + safeNum(t.amount), 0);

  const expense = txs
    .filter((t) => t.type === "expense" || t.type === "EXPENSE")
    .reduce((s, t) => s + safeNum(t.amount), 0);

  // Net saving = sum of deposits - sum of withdrawals - sum of close
  const netSaving = txs
    .filter((t) => t.type === "saving" || t.type === "SAVING")
    .reduce((net, t) => {
      const amount = safeNum(t.amount);
      const action = (t.action || "").toLowerCase();
      if (action === "deposit") return net + amount;
      if (action === "withdraw") return net - amount;
      if (action === "close") return net - amount;
      return net + amount;
    }, 0);

  return {
    income,
    expense,
    saving: netSaving,
    balance: income - expense - netSaving,
  };
};

const buildExpenseByCategory = (txs, mergedCategoryMap) => {
  const map = {};
  txs.filter((t) => t.type === "expense" || t.type === "EXPENSE").forEach((t) => {
    const catName = t.categoryName || mergedCategoryMap[t.category?.name] || "Khác";
    map[catName] = (map[catName] || 0) + safeNum(t.amount);
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(map).map(([key, value]) => ({ name: key, value, percentage: (value / total) * 100 }));
};

const formatCurrency = (v) => `${safeNum(v).toLocaleString("vi-VN")} ₫`;

const COLORS = ["#22c55e", "#16a34a", "#84cc16", "#f59e0b"];

// ─── Shared card props (DRY) ──────────────────────────────────────────────────
const cardProps = {
  bordered: false,
  style: {
    background: "#0b1220",
    borderRadius: 20,
    height: "100%",
  },
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  
  const { messageApi, contextHolder } = message.useMessage();
  const { token: darkToken } = theme.useToken();

  const now = dayjs();
  const currentYear = now.year();
  const currentMonthNum = now.month() + 1;

  const [incomeInput, setIncomeInput] = useState(null);
  const [historyMonth, setHistoryMonth] = useState(now);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: catData } = useQuery(CATEGORIES);
  const categories = catData?.categories || [];
  const mergedCategoryMap = {};
  categories.forEach((c) => {
    mergedCategoryMap[c.name] = c.nameVi || c.name;
  });

  // Load transactions directly via fetch - no Apollo cache
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await graphqlRequest(
        `query T($year: Int!) { transactions(year: $year) { id type action amount date categoryName } }`,
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

  // Current-month stats
  const currentMonthTxns = transactions.filter((t) => {
    const d = dayjs(t.date);
    return d.month() + 1 === currentMonthNum && d.year() === currentYear;
  });

  const stats = computeStats(currentMonthTxns);

  const expenseByCategory = buildExpenseByCategory(currentMonthTxns, mergedCategoryMap);
  const savingsPercentage = stats.income > 0 ? (stats.balance / stats.income) * 100 : 0;
  const savingsAmount = stats.saving;

  // History-month bar-chart data
  const singleMonthData = (() => {
    const key = historyMonth.format("YYYY-MM");
    const txMonth = transactions.filter((t) => dayjs(t.date).format("YYYY-MM") === key);
    const { income, expense } = computeStats(txMonth);
    // Tính tiết kiệm: dùng action (deposit = +, withdraw = -, close = -)
    const savings = txMonth
      .filter((t) => (t.type || "").toLowerCase() === "saving")
      .reduce((net, t) => {
        const amount = safeNum(t.amount);
        const action = (t.action || "").toLowerCase();
        if (action === "deposit") return net + amount;
        if (action === "withdraw") return net - amount;
        if (action === "close") return net - amount;
        return net + amount;
      }, 0);
    return { key, month: historyMonth.format("MM/YYYY"), income, expense, savings };
  })();

  // Alerts
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
  if (savingsPercentage < 10) {
    alerts.push({ type: "warning", message: "⚠️ Tiền tiết kiệm chưa đạt 10% thu nhập." });
  }
  if (alerts.length === 0) {
    alerts.push({ type: "success", message: "Tình hình tài chính của bạn đang ổn định!" });
  }

  // Mutation
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
          date: now.format("YYYY-MM-DD"),
        }
      );
      if (result.errors) {
        messageApi.error(result.errors[0].message || "Lưu thất bại");
      } else {
        setIncomeInput(null);
        messageApi.success("Đã lưu thu nhập vào database!");
        await loadTransactions();
      }
    } catch (err) {
      messageApi.error(err.message || "Lưu thất bại");
    }
    setSaving(false);
  };

  // Table columns (shared style)
  const tableDarkStyle = {
    background: "#0b1220",
    color: "#ffffff",
    borderColor: "rgba(255,255,255,0.08)",
  };

  // Recent-transactions columns
  const recentColumns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (v) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Danh mục",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: "Loại",
      key: "type",
      render: (_, record) => {
        const t = (record.type || "").toLowerCase();
        if (t === "income") return "Thu nhập";
        if (t === "expense") return "Chi tiêu";
        if (t === "saving") return "Tiết kiệm";
        return record.type;
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount, record) => {
        const value = safeNum(amount);
        const t = (record.type || "").toLowerCase();
        let color = "#ef4444";
        let prefix = "-";
        if (t === "income") { color = "#22c55e"; prefix = "+"; }
        else if (t === "saving") { color = "#1890ff"; prefix = ""; }
        return (
          <span style={{ color, fontWeight: 700, fontSize: 15 }}>
            {prefix}{formatCurrency(value)}
          </span>
        );
      },
    },
  ];

  // History columns (+balance + savings)
  const historyColumns = [
    { title: "Tháng", dataIndex: "month" },
    {
      title: "Thu nhập",
      dataIndex: "income",
      render: (v) => <span style={{ color: "#22c55e", fontWeight: 600 }}>{formatCurrency(v)}</span>,
    },
    {
      title: "Chi tiêu",
      dataIndex: "expense",
      render: (v) => <span style={{ color: "#ef4444", fontWeight: 600 }}>{formatCurrency(v)}</span>,
    },
    {
      title: "Tiết kiệm",
      dataIndex: "savings",
      render: (v) => {
        const val = safeNum(v);
        return (
          <span style={{ color: val >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
            {val >= 0 ? "+" : ""}
            {formatCurrency(val)}
          </span>
        );
      },
    },
    {
      title: "Số dư",
      key: "balance",
      render: (_, row) => {
        const bal = safeNum(row.income) - safeNum(row.expense) - safeNum(row.savings);
        return (
          <span style={{ color: bal >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
            {bal >= 0 ? "+" : ""}
            {formatCurrency(bal)}
          </span>
        );
      },
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#3b82f6",
          borderRadius: 12,
        },
        components: {
          Table: {
            headerBg: "#111827",
            headerColor: "#ffffff",
            rowHoverBg: "#111827",
            bodyBg: "#0b1220",
            colorText: "#ffffff",
            borderColor: "rgba(255,255,255,0.08)",
          },
          DatePicker: {
            colorBgContainer: "#0b1220",
            colorText: "#ffffff",
            colorBorder: "rgba(255,255,255,0.12)",
          },
          Card: {
            colorBgContainer: "#0b1220",
          },
        },
      }}
    >
      {contextHolder}

      <div
        style={{
          padding: "24px",
          background: "#0b0f14",
          minHeight: "100vh",
          color: "#fff",
        }}
      >
        {/* ─── HEADER ─── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#fff",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              Dashboard Tài Chính
            </h2>
            <div
              style={{
                color: "#94a3b8",
                fontSize: 14,
                marginTop: 4,
              }}
            >
              Quản lý tài chính cá nhân
            </div>
          </div>
        </div>

        {/* ─── ADD INCOME CARD ─── */}
        <Card
          style={{
            marginBottom: 20,
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h3 style={{ color: "#fff", margin: 0 }}>Nhập thu nhập tháng này</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <InputNumber
                min={0}
                step={100000}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v.replace(/,/g, "")}
                value={incomeInput}
                onChange={setIncomeInput}
                placeholder="Ví dụ: 5.000.000"
                style={{
                  width: 200,
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  borderRadius: 8,
                }}
              />
              <Button
                type="primary"
                loading={saving}
                onClick={handleSaveIncome}
                style={{ borderRadius: 8 }}
              >
                Lưu thu nhập
              </Button>
            </div>
          </div>
        </Card>
        {/* ─── ALERTS ─── */}
        {alerts.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {alerts.map((a, i) => (
              <Col xs={24} key={i}>
                <Alert
                  type={a.type}
                  showIcon
                  message={a.message}
                  style={{ borderRadius: 12 }}
                />
              </Col>
            ))}
          </Row>
        )}

         

        {/* ─── STATS CARDS ─── */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
  <Col xs={24} sm={12} lg={6}>
    <Card {...cardProps}>
      <Statistic
        title={<span style={{ color: "#94a3b8" }}>Thu nhập</span>}
        value={stats.income}
        valueStyle={{ color: "#22c55e", fontWeight: 700 }}
        formatter={(v) => formatCurrency(v)}
      />
    </Card>
  </Col>

  <Col xs={24} sm={12} lg={6}>
    <Card {...cardProps}>
      <Statistic
        title={<span style={{ color: "#94a3b8" }}>Chi tiêu</span>}
        value={stats.expense}
        valueStyle={{ color: "#ef4444", fontWeight: 700 }}
        formatter={(v) => formatCurrency(v)}
      />
    </Card>
  </Col>

  <Col xs={24} sm={12} lg={6}>
    <Card {...cardProps}>
      <Statistic
        title={<span style={{ color: "#94a3b8" }}>Số dư</span>}
        value={stats.balance}
        valueStyle={{ color: "#3b82f6", fontWeight: 700 }}
        formatter={(v) => formatCurrency(v)}
      />
    </Card>
  </Col>

  <Col xs={24} sm={12} lg={6}>
    <Card {...cardProps}>
      <Statistic
        title={<span style={{ color: "#94a3b8" }}>Tiết kiệm</span>}
        value={savingsAmount}
        valueStyle={{
          color: savingsAmount > 0 ? "#22c55e" : "#ef4444",
          fontWeight: 700,
        }}
        formatter={(v) => formatCurrency(v)}
      />
    </Card>
  </Col>
</Row>

        {/* ─── CHARTS ─── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                background: "#0b1220",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)",
                height: "100%",
              }}
            >
              <h3 style={{ color: "#fff", marginTop: 0, marginBottom: 16 }}>
                Chi tiêu theo danh mục
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, percentage }) =>
                      `${name}: ${percentage.toFixed(0)}%`
                    }
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              style={{
                background: "#0b1220",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)",
                height: "100%",
              }}
            >
              <h3 style={{ color: "#fff", marginTop: 0, marginBottom: 16 }}>
                Thu & Chi
              </h3>
              <ResponsiveContainer width="100%" height={280}>
  <BarChart
    data={[
      { name: "Thu", value: stats.income },
      { name: "Chi", value: stats.expense },
    ]}
    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

    <XAxis
      dataKey="name"
      tick={{ fill: "#94a3b8", fontSize: 16, fontWeight: 700 }}
      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
    />

    <YAxis
      tick={{ fill: "#94a3b8", fontSize: 12 }}
      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
      tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
    />

    <Tooltip
      formatter={(v) => formatCurrency(v)}
      contentStyle={{
        background: "#1e293b",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        color: "#fff",
      }}
    />

    <Bar dataKey="value" fill="transparent" stroke="#22c55e" strokeWidth={0} radius={[6, 6, 0, 0]}>
      <Cell fill="#22c55e" stroke="#22c55e" />
      <Cell fill="#ef4444" stroke="#ef4444" />
    </Bar>
  </BarChart>
</ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        

        {/* ─── RECENT TRANSACTIONS (top 5) ─── */}
        <Card
          style={{
            marginTop: 16,
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3 style={{ color: "#fff", margin: 0 }}>Giao dịch gần đây</h3>
          </div>

          <Table
            rowKey="id"
            pagination={false}
            size="small"
            loading={loading}
            dataSource={[...transactions]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5)}
            columns={recentColumns}
          />
        </Card>

        {/* ─── MONTHLY HISTORY ─── */}
        <Card
          style={{
            marginTop: 16,
            background: "#0b1220",
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h3 style={{ color: "#fff", margin: 0 }}>Lịch sử theo tháng</h3>
            <DatePicker
              picker="month"
              value={historyMonth}
              onChange={(d) => d && setHistoryMonth(d)}
              format="MM/YYYY"
            />
          </div>

          <Table
            dataSource={[singleMonthData]}
            pagination={false}
            size="small"
            style={{ marginTop: 10 }}
            columns={historyColumns}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}