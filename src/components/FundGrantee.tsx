import { useState } from "react";
import {
  useAccount,
  useContractRead,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import { Address } from "viem";
import Stack from "react-bootstrap/Stack";
import RecipientDetails from "./RecipientDetails";
import EditStream from "./EditStream";
import useSuperfluid from "../hooks/superfluid";
import useAllo from "../hooks/allo";
import { TransactionPanelState } from "./StreamingQuadraticFunding";
import { passportDecoderConfig } from "../lib/passportDecoderConfig";

interface FundGranteeProps {
  setTransactionPanelState: React.Dispatch<
    React.SetStateAction<TransactionPanelState>
  >;
  name: string;
  image: string;
  website: string;
  social: string;
  description: JSX.Element;
  granteeAddress: string;
  recipientId: Address;
}

export default function FundGrantee(props: FundGranteeProps) {
  const { recipientId, granteeAddress, name } = props;

  const [flowRateToReceiver, setFlowRateToReceiver] = useState("");
  const [newFlowRate, setNewFlowRate] = useState("");

  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { alloStrategy } = useAllo();
  const { createFlow, updateFlow } = useSuperfluid("ETHx", address);
  const { data: passportScore, refetch: refetchPassportScore } =
    useContractRead({
      abi: passportDecoderConfig.abi,
      address: passportDecoderConfig.addresses["84531"] as Address,
      functionName: "getScore",
      args: [address as Address],
      //args: ["0xed6a062fBe2993bE323Af118F79E9B213c81F4f2" as Address],
      chainId: 84531,
      watch: false,
    });

  const fundDirectly =
    BigInt(flowRateToReceiver) !== BigInt(0)
      ? () => updateFlow(address ?? "", granteeAddress, newFlowRate.toString())
      : () => createFlow(address ?? "", granteeAddress, newFlowRate.toString());

  const fundWithAllo = async () => {
    if (!walletClient) {
      return;
    }
    const allocationData = alloStrategy.getAllocationData(
      recipientId,
      BigInt(newFlowRate)
    );
    const hash = await walletClient.sendTransaction({
      account: walletClient.account,
      data: allocationData.data,
      to: allocationData.to as Address,
      value: BigInt(allocationData.value),
    });

    await publicClient.waitForTransactionReceipt({
      hash,
    });
  };

  return (
    <div className="h-100 bg-dark border-top border-secondary px-4">
      <Stack
        direction="vertical"
        className="bg-blue mt-3 rounded-4 text-white pb-3"
      >
        <RecipientDetails
          header="Fund Grantee"
          flowRateToReceiver={flowRateToReceiver}
          isMatchingPool={false}
          {...props}
        />
        <EditStream
          receiver={granteeAddress}
          granteeName={name}
          flowRateToReceiver={flowRateToReceiver}
          setFlowRateToReceiver={setFlowRateToReceiver}
          newFlowRate={newFlowRate}
          setNewFlowRate={setNewFlowRate}
          isFundingMatchingPool={false}
          passportScore={passportScore ? Number(passportScore) / 10000 : null}
          refetchPassportScore={() => {
            refetchPassportScore({ throwOnError: false });
          }}
          transactionsToQueue={[
            passportScore && passportScore > 3000 ? fundWithAllo : fundDirectly,
          ]}
        />
      </Stack>
    </div>
  );
}
