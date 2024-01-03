import { useState, useEffect } from "react";
import { parseEther, formatEther } from "viem";
import { useAccount, useNetwork, useBalance } from "wagmi";
import Accordion from "react-bootstrap/Accordion";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import ConnectWallet from "./ConnectWallet";
import XLogo from "../assets/x-logo.svg";
import WebIcon from "../assets/web.svg";
import CloseIcon from "../assets/close.svg";
import OpLogo from "../assets/op-logo.svg";
import ETHLogo from "../assets/eth-white.svg";
import DoneIcon from "../assets/done.svg";
import ArrowDownIcon from "../assets/arrow-down.svg";
import ArrowForwardIcon from "../assets/arrow-forward.svg";
import CopyIcon from "../assets/copy-light.svg";
import SQFIcon from "../assets/sqf.png";
import CopyTooltip from "./CopyTooltip";
import useSuperfluid from "../hooks/superfluid";
import useSuperTokenBalance from "../hooks/superTokenBalance";
import useTransactionsQueue from "../hooks/transactionsQueue";
import { isNumber, fromTimeUnitsToSeconds, truncateStr } from "../lib/utils";
import { MATCHING_POOL_ADDRESS } from "../lib/constants";

interface FundProps {
  setShowTransactionPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

enum Step {
  SELECT_AMOUNT = "Edit stream",
  WRAP = "Wrap to Super Token",
  REVIEW = "Review the transaction(s)",
  SUCCESS = "Success!",
}

enum TimeInterval {
  DAY = "/day",
  WEEK = "/week",
  MONTH = "/month",
  YEAR = "/year",
}

const unitOfTime = {
  [TimeInterval.DAY]: "days",
  [TimeInterval.WEEK]: "weeks",
  [TimeInterval.MONTH]: "months",
  [TimeInterval.YEAR]: "years",
};

export default function Fund(props: FundProps) {
  const { setShowTransactionPanel } = props;

  const [wrapAmount, setWrapAmount] = useState<string | null>(null);
  const [step, setStep] = useState(Step.SELECT_AMOUNT);
  const [amountPerTimeInterval, setAmountPerTimeInterval] = useState("");
  const [flowRateToReceiver, setFlowRateToReceiver] = useState("");
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(
    TimeInterval.MONTH
  );

  const { chain } = useNetwork();
  const { address } = useAccount();
  const {
    superToken,
    startingSuperTokenBalance,
    accountFlowRate,
    getFlow,
    wrap,
    createFlow,
    updateFlow,
  } = useSuperfluid("ETHx", address);
  const { data: ethBalance } = useBalance({
    address,
    cacheTime: 10000,
    staleTime: 10000,
  });
  const superTokenBalance = useSuperTokenBalance(
    BigInt(startingSuperTokenBalance.availableBalance ?? 0),
    startingSuperTokenBalance.timestamp ?? 0,
    BigInt(accountFlowRate)
  );
  const {
    areTransactionsLoading,
    completedTransactions,
    transactionError,
    executeTransactions,
  } = useTransactionsQueue();

  const totalTransactions = Number(wrapAmount) > 0 ? 2 : 1;

  useEffect(() => {
    (async () => {
      if (!address || !superToken) {
        return;
      }

      const { flowRate: flowRateToReceiver } = await getFlow(
        superToken,
        address,
        MATCHING_POOL_ADDRESS
      );
      const currentStreamValue = roundWeiAmount(
        BigInt(flowRateToReceiver) *
          BigInt(fromTimeUnitsToSeconds(1, unitOfTime[timeInterval])),
        4
      );

      setFlowRateToReceiver(flowRateToReceiver);
      setAmountPerTimeInterval(currentStreamValue);
    })();
  }, [address, superToken]);

  useEffect(() => {
    if (amountPerTimeInterval) {
      setWrapAmount(formatEther(parseEther(amountPerTimeInterval) * BigInt(3)));
    }
  }, [amountPerTimeInterval]);

  const handleAmountSelection = (
    e: React.ChangeEvent<HTMLInputElement>,
    setAmount: (value: string) => void
  ) => {
    const { value } = e.target;

    if (isNumber(value) || value === "") {
      setAmount(value);
    } else if (value === ".") {
      setAmount("0.");
    }
  };

  const handleSubmit = async () => {
    if (!address) {
      return;
    }

    const newFlowRate =
      parseEther(amountPerTimeInterval) /
      BigInt(fromTimeUnitsToSeconds(1, unitOfTime[timeInterval]));
    const transactions =
      wrapAmount && Number(wrapAmount) > 0
        ? [async () => wrap(parseEther(wrapAmount))]
        : [];

    if (BigInt(flowRateToReceiver) !== BigInt(0)) {
      transactions.push(async () =>
        updateFlow(address, MATCHING_POOL_ADDRESS, newFlowRate.toString())
      );
    } else {
      transactions.push(async () =>
        createFlow(address, MATCHING_POOL_ADDRESS, newFlowRate.toString())
      );
    }

    await executeTransactions(transactions);

    setStep(Step.SUCCESS);
  };

  const roundWeiAmount = (flowRate: bigint, digits: number) =>
    parseFloat(Number(formatEther(flowRate)).toFixed(digits)).toString();

  const convertStreamValueToInterval = (
    amount: bigint,
    from: TimeInterval,
    to: TimeInterval
  ) =>
    roundWeiAmount(
      (amount / BigInt(fromTimeUnitsToSeconds(1, unitOfTime[from]))) *
        BigInt(fromTimeUnitsToSeconds(1, unitOfTime[to])),
      4
    );

  return (
    <Stack
      direction="vertical"
      className="bg-blue mt-3 rounded-4 text-white pb-3"
    >
      <Stack
        direction="horizontal"
        className="justify-content-between align-items-center p-2"
      >
        <Card.Text className="fs-3 pe-0 m-0">Fund Matching Stream</Card.Text>
        <Button
          variant="transparent"
          className="float-end p-0 pe-0"
          onClick={() => setShowTransactionPanel(false)}
        >
          <Image src={CloseIcon} alt="close" width={28} />
        </Button>
      </Stack>
      <Stack direction="horizontal" gap={2} className="align-items-end">
        <Image src={SQFIcon} alt="SQF" width={128} />
        <Card className="bg-transparent text-white border-0">
          <Card.Title className="text-secondary fs-4">
            Matching Stream
          </Card.Title>
          <Card.Subtitle className="mb-0 fs-5">
            Your Current Stream
          </Card.Subtitle>
          <Card.Body className="d-flex align-items-center gap-2 p-0">
            {address && !flowRateToReceiver ? (
              <Spinner
                animation="border"
                role="status"
                className="mx-auto mt-3 p-3"
              ></Spinner>
            ) : (
              <>
                <Card.Text as="span" className="fs-1">
                  {roundWeiAmount(
                    BigInt(flowRateToReceiver) *
                      BigInt(
                        fromTimeUnitsToSeconds(
                          1,
                          unitOfTime[TimeInterval.MONTH]
                        )
                      ),
                    4
                  )}
                </Card.Text>
                <Card.Text as="span" className="fs-6">
                  ETHx <br />
                  per <br />
                  month
                </Card.Text>
              </>
            )}
          </Card.Body>
        </Card>
      </Stack>
      <Stack direction="horizontal" className="text-secondary fs-4 p-2">
        Details
        <Button
          variant="link"
          href="https://geoweb.network"
          target="_blank"
          rel="noreferrer"
          className="ms-2 p-0"
        >
          <Image src={WebIcon} alt="Web" width={18} />
        </Button>
        <Button
          variant="link"
          href="https://twitter.com/thegeoweb"
          target="_blank"
          rel="noreferrer"
          className="ms-1 p-0"
        >
          <Image src={XLogo} alt="X Social Network" width={12} />
        </Button>
      </Stack>
      <Stack direction="horizontal" gap={1} className="fs-6 p-2">
        <Stack direction="vertical" gap={1}>
          <Card.Text className="m-0 pe-0">You</Card.Text>
          <Badge className="w-100 bg-aqua rounded-1 p-1 text-start">0</Badge>
        </Stack>
        <Stack direction="vertical" gap={1}>
          <Card.Text className="m-0 pe-0">Direct</Card.Text>
          <Badge className="w-100 bg-secondary rounded-1 p-1 text-start">
            0
          </Badge>
        </Stack>
        <Stack direction="vertical" gap={1}>
          <Card.Text className="m-0 pe-0">Matching</Card.Text>
          <Badge className="w-100 bg-slate rounded-1 p-1 text-start">0</Badge>
        </Stack>
        <Card.Text className="align-self-end">total funding</Card.Text>
      </Stack>
      <Card.Text className="m-0 p-2 fs-5" style={{ maxWidth: 500 }}>
        100% of Geo Web PCO land market revenue is allocated through streaming
        quadratic funding. You can help fund more public goods by opening a
        direct stream to the matching pool OR by claiming a parcel at{" "}
        <Card.Link
          href="https://geoweb.land"
          target="_blank"
          rel="noreferrer"
          className="text-decoration-none"
        >
          https://geoweb.land
        </Card.Link>
      </Card.Text>
      <Accordion activeKey={step}>
        <Card className="bg-blue text-white border-0 rounded-0">
          <Button
            variant="transparent"
            className="d-flex align-items-center gap-2 p-2 border-0 text-white shadow-none"
            onClick={() => setStep(Step.SELECT_AMOUNT)}
            style={{ borderBottom: "1px dashed #31374E" }}
          >
            <Badge
              pill
              as="div"
              className="d-flex align-items-center p-1 bg-aqua"
            >
              {step !== Step.SELECT_AMOUNT ? (
                <Image src={DoneIcon} alt="done" width={16} />
              ) : (
                <Card.Text className="px-1 py-0">1</Card.Text>
              )}
            </Badge>
            {Step.SELECT_AMOUNT}
          </Button>
          <Accordion.Collapse
            eventKey={Step.SELECT_AMOUNT}
            className="bg-dark px-2 py-3"
            style={{ borderBottom: "1px dashed #31374E" }}
          >
            <Stack gap={3}>
              <Stack direction="horizontal" gap={2}>
                <Badge className="d-flex align-items-center gap-1 bg-blue w-50 rounded-3 px-3 py-2 fs-4 fw-normal">
                  <Image src={OpLogo} alt="optimism" width={18} />
                  {chain?.id === 420 ? "OP Goerli" : "OP Mainnet"}
                </Badge>
                <Badge className="d-flex align-items-center gap-1 bg-blue w-50 rounded-3 px-3 py-2 fs-4 fw-normal">
                  <Image src={ETHLogo} alt="optimism" width={12} />
                  ETHx
                </Badge>
              </Stack>
              <Stack direction="horizontal">
                <Form.Control
                  type="text"
                  placeholder="0"
                  disabled={!address || !flowRateToReceiver}
                  value={amountPerTimeInterval}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAmountSelection(e, setAmountPerTimeInterval)
                  }
                  className="bg-blue w-50 border-0 rounded-end-0 text-white shadow-none"
                />
                <Dropdown className="w-50">
                  <Dropdown.Toggle
                    variant="blue"
                    className="d-flex justify-content-between align-items-center w-100 border-0 rounded-start-0 fs-4"
                  >
                    {timeInterval}
                  </Dropdown.Toggle>
                  <Dropdown.Menu variant="dark" className="bg-blue">
                    <Dropdown.Item
                      className="text-white"
                      onClick={() => {
                        setAmountPerTimeInterval(
                          convertStreamValueToInterval(
                            parseEther(amountPerTimeInterval),
                            timeInterval,
                            TimeInterval.DAY
                          )
                        );
                        setTimeInterval(TimeInterval.DAY);
                      }}
                    >
                      {TimeInterval.DAY}
                    </Dropdown.Item>
                    <Dropdown.Item
                      className="text-white"
                      onClick={() => {
                        setAmountPerTimeInterval(
                          convertStreamValueToInterval(
                            parseEther(amountPerTimeInterval),
                            timeInterval,
                            TimeInterval.WEEK
                          )
                        );
                        setTimeInterval(TimeInterval.WEEK);
                      }}
                    >
                      {TimeInterval.WEEK}
                    </Dropdown.Item>
                    <Dropdown.Item
                      className="text-white"
                      onClick={() => {
                        setAmountPerTimeInterval(
                          convertStreamValueToInterval(
                            parseEther(amountPerTimeInterval),
                            timeInterval,
                            TimeInterval.MONTH
                          )
                        );
                        setTimeInterval(TimeInterval.MONTH);
                      }}
                    >
                      {TimeInterval.MONTH}
                    </Dropdown.Item>
                    <Dropdown.Item
                      className="text-white"
                      onClick={() => {
                        setAmountPerTimeInterval(
                          convertStreamValueToInterval(
                            parseEther(amountPerTimeInterval),
                            timeInterval,
                            TimeInterval.YEAR
                          )
                        );
                        setTimeInterval(TimeInterval.YEAR);
                      }}
                    >
                      {TimeInterval.YEAR}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Stack>
              {address ? (
                <Button
                  variant="success"
                  disabled={
                    !amountPerTimeInterval || Number(amountPerTimeInterval) <= 0
                  }
                  className="py-1 rounded-3 text-white"
                  onClick={() => setStep(Step.WRAP)}
                >
                  Continue
                </Button>
              ) : (
                <ConnectWallet />
              )}
            </Stack>
          </Accordion.Collapse>
        </Card>
        <Card className="bg-blue text-white border-0 rounded-0">
          <Button
            variant="transparent"
            disabled={step === Step.SELECT_AMOUNT}
            className="d-flex align-items-center gap-2 p-2 border-0 text-white shadow-none"
            onClick={() => setStep(Step.WRAP)}
            style={{ borderBottom: "1px dashed #31374E" }}
          >
            <Badge
              pill
              as="div"
              className={`d-flex align-items-center py-1
                    ${
                      step === Step.SELECT_AMOUNT ? "bg-secondary" : "bg-aqua"
                    } ${step === Step.REVIEW ? "px-1" : ""}`}
            >
              {step === Step.REVIEW ? (
                <Image src={DoneIcon} alt="done" width={16} />
              ) : (
                <Card.Text className="p-0">2</Card.Text>
              )}
            </Badge>
            {Step.WRAP}
          </Button>
          <Accordion.Collapse
            eventKey={Step.WRAP}
            className="bg-dark px-2 py-3"
            style={{ borderBottom: "1px dashed #31374E" }}
          >
            <Stack direction="vertical" gap={3}>
              <Stack direction="vertical" className="position-relative">
                <Stack
                  direction="horizontal"
                  gap={2}
                  className="w-100 bg-blue p-2 rounded-4 rounded-bottom-0"
                >
                  <Form.Control
                    type="text"
                    placeholder="0"
                    disabled={!address}
                    value={wrapAmount ?? ""}
                    className="bg-blue w-75 border-0 text-white shadow-none"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleAmountSelection(e, setWrapAmount)
                    }
                  />
                  <Badge
                    as="div"
                    className="d-flex align-items-center gap-2 bg-purple py-2 border border-dark rounded-3"
                  >
                    <Image src={ETHLogo} alt="done" width={10} />
                    <Card.Text className="p-0">ETH</Card.Text>
                  </Badge>
                </Stack>
                <Card.Text className="w-100 bg-blue m-0 mb-2 px-2 pb-2 rounded-bottom-4 text-end fs-5">
                  Balance: {ethBalance ? ethBalance.formatted.slice(0, 8) : "0"}
                </Card.Text>
                <Badge
                  pill
                  className="position-absolute top-50 start-50 translate-middle bg-dark p-1"
                >
                  <Image src={ArrowDownIcon} alt="downward arrow" width={22} />
                </Badge>
                <Stack
                  direction="horizontal"
                  gap={2}
                  className="w-100 bg-blue p-2 rounded-4 rounded-bottom-0"
                >
                  <Form.Control
                    type="text"
                    placeholder="0"
                    disabled={!address}
                    value={
                      wrapAmount ??
                      formatEther(parseEther(amountPerTimeInterval) * BigInt(3))
                    }
                    className="bg-blue w-75 border-0 text-white shadow-none"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleAmountSelection(e, setWrapAmount)
                    }
                  />
                  <Badge
                    as="div"
                    className="d-flex align-items-center gap-2 bg-purple py-2 border border-dark rounded-3"
                  >
                    <Image src={ETHLogo} alt="done" width={10} />
                    <Card.Text className="p-0">ETHx</Card.Text>
                  </Badge>
                </Stack>
                <Card.Text className="w-100 bg-blue m-0 px-2 pb-2 rounded-bottom-4 text-end fs-5">
                  Balance: {formatEther(superTokenBalance).slice(0, 8)}
                </Card.Text>
              </Stack>
              {ethBalance &&
                wrapAmount &&
                ethBalance.value < parseEther(wrapAmount) && (
                  <Alert variant="danger" className="m-0">
                    Insufficient Balance
                  </Alert>
                )}
              <Stack direction="horizontal" gap={2}>
                <OverlayTrigger
                  overlay={
                    <Tooltip id="t-skip-wrap" className="fs-6">
                      You must have enough ETHx to continue
                    </Tooltip>
                  }
                >
                  <Button
                    variant="primary"
                    disabled={superTokenBalance <= BigInt(0)}
                    className="w-50 py-1 rounded-3 text-white"
                    onClick={() => {
                      setWrapAmount("");
                      setStep(Step.REVIEW);
                    }}
                  >
                    Skip
                  </Button>
                </OverlayTrigger>
                <Button
                  variant="success"
                  disabled={
                    !ethBalance ||
                    !wrapAmount ||
                    Number(wrapAmount) === 0 ||
                    ethBalance.value < parseEther(wrapAmount)
                  }
                  className="w-50 py-1 rounded-3 text-white"
                  onClick={() => setStep(Step.REVIEW)}
                >
                  Continue
                </Button>
              </Stack>
            </Stack>
          </Accordion.Collapse>
        </Card>
        <Card className="bg-blue text-white border-0 rounded-0 rounded-bottom-4">
          <Button
            variant="transparent"
            disabled={step === Step.SELECT_AMOUNT || step === Step.WRAP}
            className="d-flex align-items-center gap-2 p-2 border-0 text-white shadow-none"
            onClick={() => setStep(Step.REVIEW)}
            style={{ borderBottom: "1px dashed #31374E" }}
          >
            <Badge
              pill
              className={`d-flex align-items-center py-1 ${
                step !== Step.REVIEW ? "bg-secondary" : "bg-aqua"
              } ${step === Step.SUCCESS ? "px-1" : ""}`}
            >
              {step === Step.SUCCESS ? (
                <Image src={DoneIcon} alt="done" width={16} />
              ) : (
                <Card.Text className="p-0">3</Card.Text>
              )}
            </Badge>
            {Step.REVIEW}
          </Button>
        </Card>
        <Accordion.Collapse
          eventKey={Step.REVIEW}
          className="bg-dark px-2 py-3"
          style={{ borderBottom: "1px dashed #31374E" }}
        >
          <Stack direction="vertical" gap={2}>
            {Number(wrapAmount) > 0 && (
              <Stack direction="vertical" gap={1}>
                <Card.Text className="border-bottom border-secondary mb-2 pb-1 text-secondary">
                  A. Wrap Tokens
                </Card.Text>
                <Stack
                  direction="horizontal"
                  gap={1}
                  className="position-relative"
                >
                  <Stack
                    direction="vertical"
                    gap={2}
                    className="justify-content-center align-items-center bg-blue p-2 rounded-4"
                  >
                    <Image src={ETHLogo} alt="done" width={16} />
                    <Card.Text className="border-0 text-center text-white fs-5">
                      {wrapAmount} <br /> ETH
                    </Card.Text>
                  </Stack>
                  <Image
                    className="bg-transparent"
                    src={ArrowForwardIcon}
                    alt="forward arrow"
                    width={30}
                  />
                  <Stack
                    direction="vertical"
                    gap={2}
                    className="justify-content-center align-items-center bg-blue p-2 rounded-4"
                  >
                    <Image src={ETHLogo} alt="done" width={16} />
                    <Card.Text className="border-0 text-center text-white fs-5">
                      {wrapAmount} <br /> ETHx
                    </Card.Text>
                  </Stack>
                </Stack>
                <Card.Text className="border-0 text-center text-gray fs-4">
                  1 ETH = 1 ETHx
                </Card.Text>
              </Stack>
            )}
            <Stack direction="vertical" gap={1}>
              <Card.Text className="border-bottom border-secondary m-0 pb-1 text-secondary">
                {Number(wrapAmount) > 0 ? "B." : "A."} Edit stream
              </Card.Text>
            </Stack>
            <Stack
              direction="horizontal"
              className="justify-content-around px-2"
            >
              <Card.Text className="m-0 border-0 text-center text-white fs-4">
                Sender
              </Card.Text>
              <Card.Text className="m-0 border-0 text-center text-white fs-4">
                Receiver
              </Card.Text>
            </Stack>
            <Stack direction="horizontal">
              <Badge className="d-flex justify-content-around align-items-center w-50 bg-blue py-3 rounded-3 border-0 text-center text-white fs-5">
                {truncateStr(address ?? "", 12)}
                <CopyTooltip
                  contentClick="Address copied"
                  contentHover="Copy address"
                  handleCopy={() =>
                    navigator.clipboard.writeText(address ?? "")
                  }
                  target={<Image src={CopyIcon} alt="copy" width={18} />}
                />
              </Badge>
              <Image
                className="bg-transparent"
                src={ArrowForwardIcon}
                alt="forward arrow"
                width={30}
              />
              <Badge className="d-flex justify-content-around align-items-center w-50 bg-blue px-2 py-3 rounded-3 border-0 text-center text-white fs-5">
                {truncateStr(MATCHING_POOL_ADDRESS, 12)}
                <CopyTooltip
                  contentClick="Address copied"
                  contentHover="Copy address"
                  handleCopy={() =>
                    navigator.clipboard.writeText(MATCHING_POOL_ADDRESS)
                  }
                  target={<Image src={CopyIcon} alt="copy" width={18} />}
                />
              </Badge>
            </Stack>
            <Stack
              direction="vertical"
              gap={2}
              className="bg-purple rounded-4 p-1"
            >
              <Stack
                direction="horizontal"
                className="border-bottom border-dark p-2"
              >
                <Card.Text className="w-33 m-0">Balance</Card.Text>
                <Stack direction="horizontal" gap={1} className="w-50 ms-1">
                  <Image src={ETHLogo} alt="eth" width={16} />
                  <Badge className="bg-blue w-100 ps-2 pe-2 py-2 fs-4 text-start">
                    {formatEther(superTokenBalance).slice(0, 8)}
                  </Badge>
                </Stack>
              </Stack>
              <Stack direction="horizontal" className="p-2">
                <Card.Text className="w-33 m-0">New Stream Value</Card.Text>
                <Stack direction="horizontal" gap={1} className="w-50 ms-1">
                  <Image src={ETHLogo} alt="eth" width={16} />
                  <Badge className="bg-aqua w-100 ps-2 pe-2 py-2 fs-4 text-start">
                    {convertStreamValueToInterval(
                      parseEther(amountPerTimeInterval),
                      timeInterval,
                      TimeInterval.MONTH
                    )}
                  </Badge>
                </Stack>
                <Card.Text className="m-0 ms-1 fs-5">/month</Card.Text>
              </Stack>
            </Stack>
            <Button
              variant="success"
              disabled={step === Step.SUCCESS}
              className="d-flex justify-content-center mt-2 py-1 rounded-3 text-white fw-bold"
              onClick={handleSubmit}
            >
              {areTransactionsLoading ? (
                <Stack
                  direction="horizontal"
                  gap={2}
                  className="justify-content-center"
                >
                  <Spinner
                    size="sm"
                    animation="border"
                    role="status"
                    className="p-2"
                  ></Spinner>
                  <Card.Text className="m-0">
                    {completedTransactions + 1}/{totalTransactions}
                  </Card.Text>
                </Stack>
              ) : (
                `Submit (${totalTransactions})`
              )}
            </Button>
            {step === Step.SUCCESS && (
              <Alert
                variant="success"
                className="mt-2 rounded-4 text-wrap text-break"
              >
                Success!
              </Alert>
            )}
            {transactionError && (
              <Alert
                variant="danger"
                className="mt-2 rounded-4 text-wrap text-break"
              >
                {transactionError}
              </Alert>
            )}
          </Stack>
        </Accordion.Collapse>
      </Accordion>
    </Stack>
  );
}
