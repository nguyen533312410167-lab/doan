import { useEffect, useState } from "react";
import { transactionService } from "../services/transactionService.js";

export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([]);
  const refresh = () => setTransactions(transactionService.list(filters));

  useEffect(() => {
    refresh();
    window.addEventListener("finance-db-change", refresh);
    return () => window.removeEventListener("finance-db-change", refresh);
  }, [JSON.stringify(filters)]);

  return {
    transactions,
    refresh,
    createTransaction: transactionService.create,
    updateTransaction: transactionService.update,
    deleteTransaction: transactionService.remove,
  };
}
