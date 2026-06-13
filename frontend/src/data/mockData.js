const STORAGE_KEY = "demo_transactions";

export const categories = [
  { label: "Ăn uống", value: "eating" },
  { label: "Giao thông", value: "transport" },
  { label: "Giải trí", value: "entertainment" },
  { label: "Điện/Nước", value: "utilities" },
  { label: "Khác", value: "other" },
];

export const categoryMap = Object.fromEntries(categories.map((c) => [c.value, c.label]));

const initialTransactions = [
  {
    key: 1,
    date: "2024-06-10",
    category: "eating",
    note: "Ăn trưa",
    type: "expense",
    amount: 150000,
  },
  {
    key: 2,
    date: "2024-06-11",
    category: "transport",
    note: "Xăng xe",
    type: "expense",
    amount: 300000,
  },
  {
    key: 3,
    date: "2024-06-12",
    category: "other",
    note: "Lương tháng",
    type: "income",
    amount: 15000000,
  },
  // demo entertainment transaction so charts show it
  {
    key: 4,
    date: "2024-06-13",
    category: "entertainment",
    note: "Xem phim",
    type: "expense",
    amount: 3000000,
  },
];

export function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTransactions(initialTransactions);
      return initialTransactions.slice();
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load transactions", e);
    return initialTransactions.slice();
  }
}

export function saveTransactions(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // dispatch event so other parts of the app can refresh
    window.dispatchEvent(new CustomEvent("transactions_updated"));
  } catch (e) {
    console.error("Failed to save transactions", e);
  }
}

export default {
  loadTransactions,
  saveTransactions,
  categories,
  categoryMap,
};
