import { useState } from "react";
import { useAccount } from "wagmi";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import RecipientDetails from "./RecipientDetails";
import EditStream from "./EditStream";
import SQFIcon from "../assets/sqf.png";
import CloseIcon from "../assets/close.svg";
import useSuperfluid from "../hooks/superfluid";
import { TransactionPanelState } from "./StreamingQuadraticFunding";
import { MATCHING_POOL_ADDRESS } from "../lib/constants";

interface FundMatchingPoolProps {
  setTransactionPanelState: React.Dispatch<
    React.SetStateAction<TransactionPanelState>
  >;
}

export default function FundMatchingPool(props: FundMatchingPoolProps) {
  const { setTransactionPanelState } = props;

  const [flowRateToReceiver, setFlowRateToReceiver] = useState("");
  const [newFlowRate, setNewFlowRate] = useState("");

  const { address } = useAccount();
  const { gdaDistributeFlow } = useSuperfluid("ETHx", address);

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
        <Card.Text className="fs-3 m-0">Fund Matching Pool</Card.Text>
        <Button
          variant="transparent"
          className="position-absolute end-0 px-2 py-0"
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
        className="rounded-4 text-white pb-3 flex-grow-0"
      >
        <RecipientDetails
          name="Matching Stream"
          image={SQFIcon}
          website="https://geoweb.network"
          social="https://twitter.com/thegeoweb"
          flowRateToReceiver={flowRateToReceiver}
          isMatchingPool={true}
          description={
            <>
              100% of Geo Web PCO land market revenue is allocated through
              streaming quadratic funding. You can help fund more public goods
              by opening a direct stream to the matching pool OR by claiming a
              parcel at{" "}
              <Card.Link
                href="https://geoweb.land"
                target="_blank"
                rel="noreferrer"
                className="text-decoration-none"
              >
                https://geoweb.land
              </Card.Link>
            </>
          }
          {...props}
        />
        <EditStream
          granteeName="GDA Matching Pool"
          receiver={MATCHING_POOL_ADDRESS}
          flowRateToReceiver={flowRateToReceiver}
          setFlowRateToReceiver={setFlowRateToReceiver}
          newFlowRate={newFlowRate}
          setNewFlowRate={setNewFlowRate}
          isFundingMatchingPool={true}
          transactionsToQueue={[async () => gdaDistributeFlow(newFlowRate)]}
        />
      </Stack>
    </Stack>
  );
}
