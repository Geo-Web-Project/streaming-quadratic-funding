import { useState, useEffect } from "react";
import { parseEther, formatEther } from "viem";
import { useAccount, useNetwork, useBalance } from "wagmi";
import Container from "react-bootstrap/Container";
import Accordion from "react-bootstrap/Accordion";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import ConnectWallet from "./ConnectWallet";
import XLogo from "../assets/x-logo.svg";
import WebIcon from "../assets/web.svg";
import CloseIcon from "../assets/close.svg";
import OpLogo from "../assets/op-logo.svg";
import ETHLogo from "../assets/eth-white.svg";
import DoneIcon from "../assets/done.svg";
import ArrowDownIcon from "../assets/arrow-down.svg";
import ArrowForwardIcon from "../assets/arrow-forward.svg";
import SQFIcon from "../assets/sqf.png";
import { useEthersSigner, useEthersProvider } from "../hooks/ethersAdapters";
import useSuperfluid from "../hooks/superfluid";
import useSuperTokenBalance from "../hooks/superTokenBalance";
import useTransactionsQueue from "../hooks/transactionsQueue";
import { isNumber, fromTimeUnitsToSeconds } from "../lib/utils";

interface FundProps {
  setShowTransactionPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

enum Step {
  SELECT_AMOUNT = "Select network and token",
  WRAP = "Wrap to Super Tokens",
  REVIEW = "Review the transaction(s)",
  SUCCESS = "Success!",
}

export default function Fund(props: FundProps) {
  const { setShowTransactionPanel } = props;

  const [wrapAmount, setWrapAmount] = useState<string | null>(null);
  const [step, setStep] = useState(Step.SELECT_AMOUNT);
  const [amountPerTimeUnit, setAmountPerTimeUnit] = useState("");

  const { chain } = useNetwork();
  const { address } = useAccount();
  const {
    sfFramework,
    startingSuperTokenBalance,
    flowRate,
    wrap,
    createFlow,
    updateFlow,
  } = useSuperfluid("ETHx");
  const { data: ethBalance } = useBalance({
    address,
    cacheTime: 10000,
    staleTime: 10000,
  });
  const superTokenBalance = useSuperTokenBalance(
    BigInt(startingSuperTokenBalance.availableBalance ?? 0),
    startingSuperTokenBalance.timestamp ?? 0,
    BigInt(flowRate)
  );
  const {
    areTransactionsLoading,
    completedTransactions,
    totalTransactions,
    transactionError,
    executeTransactions,
  } = useTransactionsQueue();
  const signer = useEthersSigner();
  const provider = useEthersProvider();

  useEffect(() => {
    if (amountPerTimeUnit) {
      setWrapAmount(formatEther(parseEther(amountPerTimeUnit) * BigInt(3)));
    }
  }, [amountPerTimeUnit]);

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

  return (
    <Container className="bg-blue mt-3 p-2 rounded-3 text-white">
      <Row className="align-items-center">
        <Col className="fs-3 pe-0">Fund Matching Stream</Col>
        <Col xs="2" className="d-flex justify-content-end p-0">
          <Button
            variant="transparent"
            className="p-0 pe-2"
            onClick={() => setShowTransactionPanel(false)}
          >
            <Image src={CloseIcon} alt="close" width={28} />
          </Button>
        </Col>
      </Row>
      <Row className="align-items-end">
        <Col xs="5" className="p-0">
          <Image src={SQFIcon} alt="SQF" width={128} />
        </Col>
        <Col className="p-0">
          <Card className="bg-transparent text-white border-0">
            <Card.Title className="text-secondary fs-4">
              Matching Stream
            </Card.Title>
            <Card.Subtitle className="mb-0 fs-5">
              Your Current Stream
            </Card.Subtitle>
            <Card.Body className="d-flex align-items-center gap-2 p-0">
              <Card.Text as="span" className="fs-1">
                0
              </Card.Text>
              <Card.Text as="span" className="fs-6">
                USDCx <br />
                per <br />
                month
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Row>
          <Col className="d-flex align-items-center text-secondary fs-4 mb-2">
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
          </Col>
        </Row>
      </Row>
      <Row className="fs-6">
        <Col xs="3" className="pe-0">
          You
        </Col>
        <Col xs="3" className="p-0 ps-1">
          Direct
        </Col>
        <Col xs="3" className="p-0">
          Matching
        </Col>
      </Row>
      <Row className="fs-6 mb-3">
        <Col xs="3" className="pe-0">
          <Badge className="w-100 bg-aqua rounded-1 p-1 text-start">0</Badge>
        </Col>
        <Col xs="3" className="px-1">
          <Badge className="w-100 bg-secondary rounded-1 p-1 text-start">
            0
          </Badge>
        </Col>
        <Col xs="3" className="p-0 pe2">
          <Badge className="w-100 bg-slate rounded-1 p-1 text-start">0</Badge>
        </Col>
        <Col className="ps-2">total funding</Col>
      </Row>
      <Row>
        <Col className="fs-5" style={{ maxWidth: 500 }}>
          100% of Geo Web PCO land market revenue is allocated through streaming
          quadratic funding. You can help fund more public goods by opening a
          direct stream to the matching pool OR by claiming a parcel at{" "}
          <a
            href="https://geoweb.land"
            target="_blank"
            rel="noreferrer"
            className="text-decoration-none"
          >
            https://geoweb.land
          </a>
        </Col>
      </Row>
      <Row className="mt-2">
        <Col>
          <Accordion activeKey={step}>
            <Card className="bg-blue text-white border-0 rounded-0">
              <Button
                variant="transparent"
                className="d-flex gap-2 p-2 border-0 text-white shadow-none"
                onClick={() => setStep(Step.SELECT_AMOUNT)}
                style={{ borderBottom: "1px dashed #31374E" }}
              >
                <Badge
                  pill
                  as="div"
                  className="d-flex align-items-center px-1 py-0 bg-aqua"
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
                      disabled={!address}
                      value={amountPerTimeUnit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleAmountSelection(e, setAmountPerTimeUnit)
                      }
                      className="bg-blue w-50 border-0 rounded-end-0 text-white"
                    />
                    <Dropdown className="w-50">
                      <Dropdown.Toggle
                        variant="blue"
                        className="d-flex justify-content-between align-items-center w-100 border-0 rounded-start-0 fs-4"
                      >
                        /month
                      </Dropdown.Toggle>
                      {/* TODO: handle other time units beside months */}
                      <Dropdown.Menu variant="dark" className="bg-blue">
                        <Dropdown.Item className="text-white">
                          Months
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Stack>
                  {address ? (
                    <Button
                      variant="success"
                      disabled={
                        !amountPerTimeUnit || Number(amountPerTimeUnit) <= 0
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
                className="d-flex gap-2 p-2 border-0 text-white shadow-none"
                onClick={() => setStep(Step.WRAP)}
                style={{ borderBottom: "1px dashed #31374E" }}
              >
                <Badge
                  pill
                  as="div"
                  className={`d-flex align-items-center py-0
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
                        className="bg-blue w-75 border-0 text-white"
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
                    <Card.Text className="w-100 bg-blue m-0 mb-2 px-2 pb-2 rounded-bottom-4 text-end fs-5">
                      Balance:{" "}
                      {ethBalance ? ethBalance.formatted.slice(0, 8) : "0"}
                    </Card.Text>
                    <Badge
                      pill
                      className="position-absolute top-50 start-50 translate-middle bg-dark p-1"
                    >
                      <Image
                        src={ArrowDownIcon}
                        alt="downward arrow"
                        width={22}
                      />
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
                          formatEther(parseEther(amountPerTimeUnit) * BigInt(3))
                        }
                        className="bg-blue w-75 border-0 text-white"
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
                  <Button
                    variant="success"
                    disabled={!wrapAmount || Number(wrapAmount) <= 0}
                    className="py-1 rounded-3 text-white"
                    onClick={() => setStep(Step.REVIEW)}
                  >
                    Continue
                  </Button>
                </Stack>
              </Accordion.Collapse>
            </Card>
            <Card className="bg-blue text-white border-0 rounded-0">
              <Button
                variant="transparent"
                disabled={step === Step.SELECT_AMOUNT || step === Step.WRAP}
                className="d-flex gap-2 p-2 border-0 text-white shadow-none"
                onClick={() => setStep(Step.REVIEW)}
                style={{ borderBottom: "1px dashed #31374E" }}
              >
                <Badge
                  pill
                  className={`d-flex align-items-center py-0 ${
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
                <Stack direction="vertical" gap={1}>
                  <Card.Text className="border-bottom border-secondary mb-2 pb-1 text-secondary">
                    B. Edit stream
                  </Card.Text>
                </Stack>
                {/* TODO: Update flow if the user has one open already */}
                {/* TODO: Execute only one transaction if the user don't need to wrap */}
                {/* TODO: Show error message */}
                <Button
                  variant="success"
                  disabled={!wrapAmount || Number(wrapAmount) <= 0}
                  className="d-flex justify-content-center py-1 rounded-3 text-white"
                  onClick={async () => {
                    if (!wrapAmount || !address) {
                      return;
                    }
                    const sender: string = address;
                    const receiver =
                      "0x5A9E4bA56bF8139CaCC7Fe72CB18E9eA276317FB";
                    const flowRate =
                      parseEther(amountPerTimeUnit) /
                      BigInt(fromTimeUnitsToSeconds(1, "months"));
                    await executeTransactions([
                      async () => wrap(parseEther(wrapAmount.toString())),
                      async () =>
                        createFlow(sender, receiver, flowRate.toString()),
                    ]);

                    setStep(Step.SUCCESS);
                  }}
                >
                  {areTransactionsLoading ? (
                    <Spinner
                      size="sm"
                      animation="border"
                      role="status"
                      className="p-2"
                    ></Spinner>
                  ) : (
                    `Submit (2)`
                  )}
                </Button>
              </Stack>
            </Accordion.Collapse>
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
}
