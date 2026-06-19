import { useEffect, useState } from "react";
import { dashboardService } from "../services/dashboardService.js";

export function useDashboard() {
  const [dashboard, setDashboard] = useState(() => dashboardService.overview());
  const refresh = () => setDashboard(dashboardService.overview());

  useEffect(() => {
    window.addEventListener("finance-db-change", refresh);
    return () => window.removeEventListener("finance-db-change", refresh);
  }, []);

  return { dashboard, refresh };
}
