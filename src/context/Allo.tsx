import { useEffect, useState, createContext, useContext } from "react";
import { Address } from "viem";
import { useNetwork, usePublicClient } from "wagmi";
import { optimismGoerli } from "wagmi/chains";
import { SQFSuperFluidStrategy } from "@allo-team/allo-v2-sdk/";
import { recipientIds } from "../lib/recipientIds";
import { sqfStrategyAbi } from "../lib/abi/sqfStrategy";
import { getGatewayUrl } from "../lib/utils";
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

type RecipientsDetails = {
  name: string;
  description: string;
  image: string;
  website: string;
  social: string;
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
  recipientsDetails?: RecipientsDetails[];
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
  const [recipientsDetails, setRecipientsDetails] =
    useState<RecipientsDetails[]>();

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

      if (res.every((elem) => elem.status !== "success")) {
        throw Error("Recipients not found");
      }

      const recipients = res.map((elem) => elem.result);
      const recipientsDetails = [];
      const emptyRecipientDetails = {
        name: "",
        description: "",
        image: "",
        website: "",
        social: "",
      };

      for (const recipient of recipients) {
        const pointer = recipient?.metadata?.pointer;

        if (pointer) {
          try {
            const detailsRes = await fetch(getGatewayUrl(pointer));
            const { name, description, image, website, social } =
              await detailsRes.json();

            recipientsDetails.push({
              name,
              description,
              image: getGatewayUrl(image),
              website,
              social,
            });
          } catch (err) {
            recipientsDetails.push(emptyRecipientDetails);
            console.error(err);
          }
        } else {
          recipientsDetails.push(emptyRecipientDetails);
        }
      }

      setRecipients(recipients as Recipient[]);
      setRecipientsDetails(recipientsDetails);
    })();
  }, []);

  return (
    <AlloContext.Provider
      value={{ alloStrategy, recipients, recipientsDetails }}
    >
      {children}
    </AlloContext.Provider>
  );
}
