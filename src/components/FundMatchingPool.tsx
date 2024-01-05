import { useState } from "react";
import { useAccount } from "wagmi";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import GranteeDetails from "./GranteeDetails";
import EditStream from "./EditStream";
import SQFIcon from "../assets/sqf.png";
import useSuperfluid from "../hooks/superfluid";
import { MATCHING_POOL_ADDRESS } from "../lib/constants";

interface FundMatchingPoolProps {
  setShowTransactionPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FundMatchingPool(props: FundMatchingPoolProps) {
  const { setShowTransactionPanel } = props;

  const [flowRateToReceiver, setFlowRateToReceiver] = useState("");
  const [newFlowRate, setNewFlowRate] = useState("");

  const { address } = useAccount();
  const { createFlow, updateFlow } = useSuperfluid("ETHx", address);

  return (
    <Stack
      direction="vertical"
      className="bg-blue mt-3 rounded-4 text-white pb-3"
    >
      <GranteeDetails
        header="Fund Matching Stream"
        name="Matching Stream"
        image={SQFIcon}
        website="https://geoweb.network"
        social="https://twitter.com/thegeoweb"
        flowRateToReceiver={flowRateToReceiver}
        setShowTransactionPanel={setShowTransactionPanel}
        description={
          <>
            100% of Geo Web PCO land market revenue is allocated through
            streaming quadratic funding. You can help fund more public goods by
            opening a direct stream to the matching pool OR by claiming a parcel
            at{" "}
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
      />
      <EditStream
        flowRateToReceiver={flowRateToReceiver}
        setFlowRateToReceiver={setFlowRateToReceiver}
        newFlowRate={newFlowRate}
        setNewFlowRate={setNewFlowRate}
        transactionsToQueue={[
          BigInt(flowRateToReceiver) !== BigInt(0)
            ? () =>
                updateFlow(
                  address ?? "",
                  MATCHING_POOL_ADDRESS,
                  newFlowRate.toString()
                )
            : () =>
                createFlow(
                  address ?? "",
                  MATCHING_POOL_ADDRESS,
                  newFlowRate.toString()
                ),
        ]}
      />
    </Stack>
  );
}
