import { useState } from "react";

export default function useTransactionsQueue() {
  const [transactionError, setTransactionError] = useState("");
  const [areTransactionsLoading, setAreTransactionsLoading] = useState(false);
  const [completedTransactions, setCompletedTransactions] = useState(0);

  const executeTransactions = async (transactions: (() => Promise<void>)[]) => {
    setAreTransactionsLoading(true);
    setTransactionError("");

    try {
      for (const transaction of transactions) {
        await transaction();

        setCompletedTransactions((prev) => prev++);
      }
    } catch (err: any) {
      setTransactionError(err.message);
      setAreTransactionsLoading(false);

      throw Error(err);
    }

    setAreTransactionsLoading(false);
  };

  return {
    areTransactionsLoading,
    completedTransactions,
    transactionError,
    executeTransactions,
  };
}
