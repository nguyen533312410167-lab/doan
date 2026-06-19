import dayjs from "dayjs";

export const demoUser = {
  id: "user_admin",
  fullname: "Admin Finance",
  email: "admin@finance.local",
  username: "admin",
  password: "123456789",
  avatar: "",
  role: "admin",
  joinedAt: "2026-01-01",
};

export const seedCategories = [
  { id: "cat_food", name: "Ăn uống", type: "expense", icon: "Coffee", color: "#F97316" },
  { id: "cat_transport", name: "Di chuyển", type: "expense", icon: "Car", color: "#38BDF8" },
  { id: "cat_entertainment", name: "Giải trí", type: "expense", icon: "Gamepad2", color: "#A855F7" },
  { id: "cat_shopping", name: "Mua sắm", type: "expense", icon: "ShoppingBag", color: "#EF4444" },
  { id: "cat_health", name: "Sức khỏe", type: "expense", icon: "HeartPulse", color: "#EC4899" },
  { id: "cat_bills", name: "Hóa đơn", type: "expense", icon: "Receipt", color: "#F59E0B" },
  { id: "cat_salary", name: "Lương", type: "income", icon: "Briefcase", color: "#22C55E" },
  { id: "cat_business", name: "Kinh doanh", type: "income", icon: "Building2", color: "#4ADE80" },
  { id: "cat_freelance", name: "Freelance", type: "income", icon: "Laptop", color: "#14B8A6" },
  { id: "cat_parttime", name: "Làm thêm", type: "income", icon: "Clock", color: "#84CC16" },
  { id: "cat_family", name: "Hỗ trợ gia đình", type: "income", icon: "Users", color: "#10B981" },
];

export const seedTransactions = [
  { id: "txn_1", type: "income", amount: 22000000, categoryId: "cat_salary", description: "Lương tháng", transactionDate: dayjs().subtract(22, "day").format("YYYY-MM-DD") },
  { id: "txn_2", type: "expense", amount: 1850000, categoryId: "cat_food", description: "Ăn uống trong tuần", transactionDate: dayjs().subtract(18, "day").format("YYYY-MM-DD") },
  { id: "txn_3", type: "expense", amount: 720000, categoryId: "cat_transport", description: "Xăng xe và gửi xe", transactionDate: dayjs().subtract(13, "day").format("YYYY-MM-DD") },
  { id: "txn_4", type: "income", amount: 5500000, categoryId: "cat_freelance", description: "Dự án freelance", transactionDate: dayjs().subtract(9, "day").format("YYYY-MM-DD") },
  { id: "txn_5", type: "expense", amount: 2400000, categoryId: "cat_shopping", description: "Mua đồ gia dụng", transactionDate: dayjs().subtract(6, "day").format("YYYY-MM-DD") },
  { id: "txn_6", type: "expense", amount: 1250000, categoryId: "cat_bills", description: "Điện nước internet", transactionDate: dayjs().subtract(3, "day").format("YYYY-MM-DD") },
];

export const seedGoals = [
  { id: "goal_1", name: "Quỹ khẩn cấp", targetAmount: 50000000, currentAmount: 18000000, deadline: dayjs().add(8, "month").format("YYYY-MM-DD"), icon: "Shield" },
  { id: "goal_2", name: "Mua laptop", targetAmount: 30000000, currentAmount: 12500000, deadline: dayjs().add(4, "month").format("YYYY-MM-DD"), icon: "Laptop" },
];

export const seedSettings = {
  darkMode: true,
  notificationEnabled: true,
  currency: "VND",
};
