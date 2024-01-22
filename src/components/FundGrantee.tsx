import { useState, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Address } from "viem";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Offcanvas from "react-bootstrap/Offcanvas";
import RecipientDetails from "./RecipientDetails";
import EditStream from "./EditStream";
import CloseIcon from "../assets/close.svg";
import useAllo from "../hooks/allo";
import useSuperfluid from "../hooks/superfluid";
import {
  TransactionPanelState,
  AllocationData,
  MatchingData,
} from "./StreamingQuadraticFunding";
import { USDCX_ADDRESS } from "../lib/constants";

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
  const { recipientId, granteeAddress, name, setTransactionPanelState } = props;

  const [flowRateToReceiver, setFlowRateToReceiver] = useState("");
  const [newFlowRate, setNewFlowRate] = useState("");

  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { alloStrategy } = useAllo();
  const { superToken, getFlow } = useSuperfluid(USDCX_ADDRESS, address);

  const updateFlowRateToReceiver = useCallback(async () => {
    if (!address || !superToken) {
      return "0";
    }

    const { flowRate: flowRateToReceiver } = await getFlow(
      superToken,
      address,
      granteeAddress
    );

    setFlowRateToReceiver(flowRateToReceiver);

    return flowRateToReceiver ?? "0";
  }, [address, granteeAddress, superToken, getFlow]);

  const allocate = async () => {
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

  const closeOffcanvas = () =>
    setTransactionPanelState({
      show: false,
      isMatchingPool: false,
      granteeIndex: null,
    });

  return (
    <Offcanvas
      show
      scroll
      onHide={closeOffcanvas}
      placement="end"
      backdrop={false}
      className="w-25 bg-dark px-3 overflow-auto border-0 border-top border-secondary"
      style={{ top: 62 }}
    >
      <Stack
        direction="horizontal"
        className="justify-content-between align-items-center py-2 text-white"
      >
        <Card.Text className="fs-3 pe-0 m-0">Fund Grantee</Card.Text>
        <Button
          variant="transparent"
          className="position-absolute end-0 px-2 me-1 py-0"
          onClick={closeOffcanvas}
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
          updateFlowRateToReceiver={updateFlowRateToReceiver}
          newFlowRate={newFlowRate}
          setNewFlowRate={setNewFlowRate}
          isFundingMatchingPool={false}
          transactionsToQueue={[allocate]}
          {...props}
        />
      </Stack>
    </Offcanvas>
  );
}
