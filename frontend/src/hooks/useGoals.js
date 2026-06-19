import { useEffect, useState } from "react";
import { goalService } from "../services/goalService.js";

export function useGoals() {
  const [goals, setGoals] = useState([]);
  const refresh = () => setGoals(goalService.list());

  useEffect(() => {
    refresh();
    window.addEventListener("finance-db-change", refresh);
    return () => window.removeEventListener("finance-db-change", refresh);
  }, []);

  return {
    goals,
    refresh,
    createGoal: goalService.create,
    updateGoal: goalService.update,
    deleteGoal: goalService.remove,
    contributeGoal: goalService.contribute.bind(goalService),
    withdrawGoal: goalService.withdraw.bind(goalService),
  };
}
