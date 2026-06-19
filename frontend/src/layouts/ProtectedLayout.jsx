import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../lib/auth.js";
import LayoutMaster from "./LayoutMaster.jsx";

export default function ProtectedLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <LayoutMaster>
      <Outlet />
    </LayoutMaster>
  );
}