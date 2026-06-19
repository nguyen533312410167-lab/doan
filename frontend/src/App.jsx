import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Goals from "./pages/Goals.jsx";
import CaiDatPage from "./pages/CaiDatPage.jsx";
import ThongBaoPage from "./pages/ThongBaoPage.jsx";
import ThemGiaoDich from "./pages/ThemGiaoDich.jsx";
import AccountsPage from "./pages/AccountsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProtectedLayout from "./layouts/ProtectedLayout.jsx";
import { isAuthenticated } from "./lib/auth.js";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/them-giao-dich" element={<ThemGiaoDich />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/thongbao" element={<ThongBaoPage />} />
        <Route path="/caidat" element={<CaiDatPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}