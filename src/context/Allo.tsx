import { useEffect, useState, createContext, useContext } from "react";
import { Address } from "viem";
import { useNetwork, usePublicClient } from "wagmi";
import { optimismGoerli } from "wagmi/chains";
import { SQFSuperFluidStrategy } from "@allo-team/allo-v2-sdk/";
import { recipientIds } from "../lib/recipientIds";
import { sqfStrategyAbi } from "../lib/abi/sqfStrategy";
import { SQF_STRATEGY_ADDRESS, ALLO_POOL_ID } from "../lib/constants";

export type Recipient = {
  useRegistryAnchor: boolean;
  recipientAddress: Address;
  requestedAmount: string;
  superApp: Address;
  id: string;
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
      const res = await publicClient.multicall({
        contracts: recipientIds.map((recipientId) => {
          return {
            address: SQF_STRATEGY_ADDRESS,
            abi: sqfStrategyAbi,
            functionName: "getRecipient",
            args: [recipientId],
          };
        }),
      });

      if (res.every((elem) => elem.status === "success")) {
        const recipients = res.map((elem) => elem.result);

        setRecipients(recipients as Recipient[]);
      } else {
        throw Error("Recipients not found");
      }
    })();
  }, []);

  return (
    <AlloContext.Provider value={{ alloStrategy, recipients }}>
      {children}
    </AlloContext.Provider>
  );
}
