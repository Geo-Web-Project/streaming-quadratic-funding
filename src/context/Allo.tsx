import { useEffect, useState, createContext, useContext } from "react";
import { useNetwork, usePublicClient } from "wagmi";
import { optimismGoerli } from "wagmi/chains";
import { SQFSuperFluidStrategy } from "@allo-team/allo-v2-sdk/";
import { recipientIds } from "../lib/recipientIds";
import { SQF_STRATEGY_ADDRESS, ALLO_POOL_ID } from "../lib/constants";

export type Recipient = {
  useRegistryAnchor: boolean;
  recipientAddress: string;
  requestedAmount: string;
  superApp: string;
  recipientStatus: Status;
  metadata: Metadata;
};

export type Metadata = {
  protocol: bigint;
  pointer: string;
};

export enum Status {
  None,
  Pending,
  Accepted,
  Rejected,
  Appealed,
  InReview,
  Canceled,
}

export const AlloContext = createContext<{
  alloStrategy: SQFSuperFluidStrategy;
  recipients?: Recipient[];
} | null>(null);

export function useAlloContext() {
  const context = useContext(AlloContext);

  if (!context) {
    throw Error("Allo context was not found");
  }

  return context;
}

export function AlloContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [recipients, setRecipients] = useState<Recipient[]>();

  const { chain } = useNetwork();
  const publicClient = usePublicClient();

  const alloStrategy = new SQFSuperFluidStrategy({
    chain: chain?.id ?? optimismGoerli.id,
    rpc: publicClient.chain.rpcUrls.default.http[0],
    address: SQF_STRATEGY_ADDRESS,
    poolId: ALLO_POOL_ID,
  });

  useEffect(() => {
    (async () => {
      const recipients = [];

      for (const recipientId of recipientIds) {
        const recipient = await alloStrategy.getRecipient(recipientId);

        recipients.push(recipient as Recipient);
      }

      setRecipients(recipients);
    })();
  }, []);

  return (
    <AlloContext.Provider value={{ alloStrategy, recipients }}>
      {children}
    </AlloContext.Provider>
  );
}
