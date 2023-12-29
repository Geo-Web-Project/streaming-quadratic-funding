import { useState, useEffect } from "react";

export default function useTransactionsQueue() {
  const [transactionError, setTransactionError] = useState("");
  const [areTransactionsLoading, setAreTransactionsLoading] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [completedTransactions, setCompletedTransactions] = useState(0);

  const executeTransactions = async (transactions: (() => Promise<void>)[]) => {
    setAreTransactionsLoading(true);
    setTotalTransactions(transactions.length);

    try {
      for (const transaction of transactions) {
        await transaction();

        setCompletedTransactions((prev) => prev++);
      }
    } catch (err: any) {
      console.error(err);
      setTransactionError(err.message);
    }

    setAreTransactionsLoading(false);
  };

  return {
    areTransactionsLoading,
    completedTransactions,
    totalTransactions,
    transactionError,
    executeTransactions,
  };
}
