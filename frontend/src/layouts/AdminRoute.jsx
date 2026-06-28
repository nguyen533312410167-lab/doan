import { Navigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { ME_QUERY } from "../graphql/account.js";
import { isAuthenticated } from "../lib/auth.js";

export default function AdminRoute({ children }) {
  const { data, loading } = useQuery(ME_QUERY, {
    skip: !isAuthenticated(),
    errorPolicy: "ignore",
  });

  if (loading) {
    return null; // Will show loading state from parent
  }

  const isStaff = data?.me?.isStaff || false;

  if (!isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}