import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Goals from "./pages/Goals.jsx";
import ProtectedLayout from "./layouts/ProtectedLayout.jsx";
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
        path="/" 
        element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} 
      />
    </Routes>
  );
}

