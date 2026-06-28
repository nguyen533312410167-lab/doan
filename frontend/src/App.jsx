import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import AccountsPage from "./pages/AccountsPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Goals from "./pages/Goals.jsx";
import ThemGiaoDich from "./pages/ThemGiaoDich.jsx";
import Categories from "./pages/Categories.jsx";
import AdminNotifications from "./pages/AdminNotifications.jsx";
import ProtectedLayout from "./layouts/ProtectedLayout.jsx";
import AdminRoute from "./layouts/AdminRoute.jsx";
import { isAuthenticated } from "./lib/auth.js";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedLayout>
            <Transactions />
          </ProtectedLayout>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedLayout>
            <Goals />
          </ProtectedLayout>
        }
      />
      <Route
        path="/them-giao-dich"
        element={
          <ProtectedLayout>
            <ThemGiaoDich />
          </ProtectedLayout>
        }
      />
      <Route
        path="/accounts"
        element={
          <ProtectedLayout>
            <AccountsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedLayout>
            <Categories />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin-notifications"
        element={
          <ProtectedLayout>
            <AdminRoute>
              <AdminNotifications />
            </AdminRoute>
          </ProtectedLayout>
        }
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

