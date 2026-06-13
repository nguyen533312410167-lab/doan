import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../lib/auth.js";
import LayoutMaster from "./LayoutMaster.jsx";

export default function ProtectedLayout({ children }) {
  return isAuthenticated() ? (
    <LayoutMaster>{children}</LayoutMaster>
  ) : (
    <Navigate to="/login" replace />
  );
}
