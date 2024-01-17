import { useState } from "react";
import {
  useAccount,
  useContractRead,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import { Address } from "viem";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import RecipientDetails from "./RecipientDetails";
import EditStream from "./EditStream";
import CloseIcon from "../assets/close.svg";
import useAllo from "../hooks/allo";
import {
  TransactionPanelState,
  AllocationData,
  MatchingData,
} from "./StreamingQuadraticFunding";
import { passportDecoderConfig } from "../lib/passportDecoderConfig";

export type FundGranteeProps = {
  setTransactionPanelState: React.Dispatch<
    React.SetStateAction<TransactionPanelState>
  >;
  userAllocationData: AllocationData[];
  directAllocationData: AllocationData[];
  matchingData: MatchingData;
  granteeIndex: number;
  name: string;
  image: string;
  website: string;
  social: string;
  description: JSX.Element;
  granteeAddress: Address;
  recipientId: Address;
};

export default function FundGrantee(props: FundGranteeProps) {
  const {
    recipientId,
    granteeAddress,
    name,
    setTransactionPanelState,
  } = props;

  const [flowRateToReceiver, setFlowRateToReceiver] = useState("");
  const [newFlowRate, setNewFlowRate] = useState("");

  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { alloStrategy } = useAllo();
  const { data: passportScore, refetch: refetchPassportScore } =
    useContractRead({
      abi: passportDecoderConfig.abi,
      address: passportDecoderConfig.addresses["84531"] as Address,
      functionName: "getScore",
      args: [address as Address],
      chainId: 84531,
      watch: false,
    });

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
    <Stack
      direction="vertical"
      gap={2}
      className="position-relative h-100 bg-dark border-top border-secondary px-3"
    >
      <Stack
        direction="horizontal"
        className="justify-content-between align-items-center py-2 text-white"
      >
        <Card.Text className="fs-3 pe-0 m-0">Fund Grantee</Card.Text>
        <Button
          variant="transparent"
          className="position-absolute end-0 px-2 me-1 py-0"
          onClick={() =>
            setTransactionPanelState({
              show: false,
              isMatchingPool: false,
              granteeIndex: null,
            })
          }
        >
          <Image src={CloseIcon} alt="close" width={28} />
        </Button>
      </Stack>
      <Stack
        direction="vertical"
        gap={4}
        className="flex-grow-0 rounded-4 text-white pb-3"
      >
        <RecipientDetails flowRateToReceiver={flowRateToReceiver} {...props} />
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
            passportScore && passportScore > 30000
              ? fundWithAllo
              : fundWithAllo,
          ]}
          {...props}
        />
      </Stack>
    </Stack>
  );
}
