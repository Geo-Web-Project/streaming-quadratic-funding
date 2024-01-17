import { useState, useMemo, useEffect } from "react";
import { useAccount, useNetwork, useBalance } from "wagmi";
import { formatEther, parseEther, formatUnits } from "viem";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Accordion from "react-bootstrap/Accordion";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import Tooltip from "react-bootstrap/Tooltip";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import ConnectWallet from "./ConnectWallet";
import CopyTooltip from "./CopyTooltip";
import InfoIcon from "../assets/info.svg";
import OpLogo from "../assets/op-logo.svg";
import ETHLogo from "../assets/eth-white.svg";
import USDCLogo from "../assets/usdc-white.svg";
import DoneIcon from "../assets/done.svg";
import XIcon from "../assets/x-logo.svg";
import LensIcon from "../assets/lens.svg";
import FarcasterIcon from "../assets/farcaster.svg";
import PassportIcon from "../assets/passport.svg";
import ArrowDownIcon from "../assets/arrow-down.svg";
import ArrowForwardIcon from "../assets/arrow-forward.svg";
import CopyIcon from "../assets/copy-light.svg";
import ReloadIcon from "../assets/reload.svg";
import { MatchingData } from "../components/StreamingQuadraticFunding";
import useFlowingAmount from "../hooks/flowingAmount";
import useSuperfluid from "../hooks/superfluid";
import useTransactionsQueue from "../hooks/transactionsQueue";
import {
  TimeInterval,
  unitOfTime,
  isNumber,
  fromTimeUnitsToSeconds,
  truncateStr,
  roundWeiAmount,
  convertStreamValueToInterval,
  sqrtBigInt,
} from "../lib/utils";
import {
  USDC_ADDRESS,
  USDCX_ADDRESS,
  SQF_STRATEGY_ADDRESS,
} from "../lib/constants";

interface EditStreamProps {
  granteeName: string;
  granteeIndex: number | null;
  matchingData?: MatchingData;
  receiver: string;
  flowRateToReceiver: string;
  setFlowRateToReceiver: React.Dispatch<React.SetStateAction<string>>;
  newFlowRate: string;
  setNewFlowRate: React.Dispatch<React.SetStateAction<string>>;
  transactionsToQueue: (() => Promise<void>)[];
  isFundingMatchingPool: boolean;
  passportScore?: number | null;
  refetchPassportScore?: () => void;
}

enum Step {
  SELECT_AMOUNT = "Edit stream",
  WRAP = "Wrap to Super Token",
  REVIEW = "Review the transaction(s)",
  MINT_PASSPORT = "Mint Gitcoin Passport",
  SUCCESS = "Success!",
}

dayjs().format();
dayjs.extend(duration);

export default function EditStream(props: EditStreamProps) {
  const {
    granteeName,
    granteeIndex,
    matchingData,
    flowRateToReceiver,
    setFlowRateToReceiver,
    newFlowRate,
    setNewFlowRate,
    transactionsToQueue,
    isFundingMatchingPool,
    passportScore,
    refetchPassportScore,
    receiver,
  } = props;

  const [wrapAmount, setWrapAmount] = useState<string | null>(null);
  const [step, setStep] = useState(Step.SELECT_AMOUNT);
  const [amountPerTimeInterval, setAmountPerTimeInterval] = useState("");
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(
    TimeInterval.MONTH
  );

  const { address } = useAccount();
  const { chain } = useNetwork();
  const {
    superToken,
    startingSuperTokenBalance,
    accountFlowRate,
    underlyingTokenAllowance,
    updateSfAccountInfo,
    updatePermissions,
    getFlow,
    wrap,
    underlyingTokenApprove,
  } = useSuperfluid(isFundingMatchingPool ? "ETHx" : USDCX_ADDRESS, address);
  const superTokenBalance = useFlowingAmount(
    BigInt(startingSuperTokenBalance.availableBalance ?? 0),
    startingSuperTokenBalance.timestamp ?? 0,
    BigInt(accountFlowRate)
  );
  const { data: underlyingTokenBalance } = useBalance({
    address,
    cacheTime: 10000,
    staleTime: 10000,
    token: isFundingMatchingPool ? void 0 : USDC_ADDRESS,
  });
  const {
    areTransactionsLoading,
    completedTransactions,
    transactionError,
    executeTransactions,
  } = useTransactionsQueue();

  const shouldWrap = Number(wrapAmount) > 0 ? true : false;
  const totalTransactions =
    isFundingMatchingPool && shouldWrap
      ? 2
      : shouldWrap
      ? 4
      : isFundingMatchingPool
      ? 1
      : 2;
  const superTokenSymbol = isFundingMatchingPool ? "ETHx" : "USDCx";
  const superTokenIcon = isFundingMatchingPool ? ETHLogo : USDCLogo;
  const underlyingTokenName = isFundingMatchingPool ? "ETH" : "USDC";
  const minPassportScore = 3;

  useEffect(() => {
    updateFlowRateToReceiver();
  }, [address, superToken, receiver]);

  const netImpact = useMemo(() => {
    if (
      granteeIndex === null ||
      !matchingData ||
      !flowRateToReceiver ||
      !newFlowRate
    ) {
      return BigInt(0);
    }

    const granteeUnits = BigInt(matchingData.members[granteeIndex].units);
    const granteeFlowRate = BigInt(matchingData.members[granteeIndex].flowRate);
    const newGranteeUnits =
      (sqrtBigInt(granteeUnits * BigInt(1000)) -
        sqrtBigInt(BigInt(flowRateToReceiver)) +
        sqrtBigInt(BigInt(newFlowRate))) **
        BigInt(2) /
      BigInt(1000);
    const unitsDelta = newGranteeUnits - granteeUnits;
    const newPoolUnits = unitsDelta + BigInt(matchingData.totalUnits);
    const newGranteeFlowRate =
      (newGranteeUnits * BigInt(matchingData.flowRate)) / newPoolUnits;
    const netImpact = newGranteeFlowRate - granteeFlowRate;

    return netImpact;
  }, [newFlowRate, flowRateToReceiver, matchingData]);

  useEffect(() => {
    if (amountPerTimeInterval) {
      setWrapAmount(formatEther(parseEther(amountPerTimeInterval) * BigInt(3)));
      setNewFlowRate(
        (
          parseEther(amountPerTimeInterval) /
          BigInt(fromTimeUnitsToSeconds(1, unitOfTime[timeInterval]))
        ).toString()
      );
    }
  }, [amountPerTimeInterval, timeInterval]);

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
    if (!address || !superToken) {
      return;
    }

    let transactions: (() => Promise<void>)[] = [];

    if (wrapAmount && Number(wrapAmount) > 0) {
      const wrapAmountWei = parseEther(wrapAmount);

      if (
        !isFundingMatchingPool &&
        wrapAmountWei > BigInt(underlyingTokenAllowance)
      ) {
        transactions.push(async () => {
          await underlyingTokenApprove(wrapAmountWei.toString());
        });
      }

      transactions.push(async () => await wrap(wrapAmountWei));
    }

    if (!isFundingMatchingPool) {
      transactions.push(
        async () =>
          await updatePermissions(
            SQF_STRATEGY_ADDRESS,
            BigInt(newFlowRate).toString()
          )
      );
    }

    transactions.push(...transactionsToQueue);

    await executeTransactions(transactions);
    await updateFlowRateToReceiver();
    await updateSfAccountInfo(superToken);

    setStep(Step.SUCCESS);
  };

  const updateFlowRateToReceiver = async () => {
    if (!address || !superToken) {
      return;
    }

    const { flowRate: flowRateToReceiver } = await getFlow(
      superToken,
      address,
      receiver
    );
    const currentStreamValue = roundWeiAmount(
      BigInt(flowRateToReceiver) *
        BigInt(fromTimeUnitsToSeconds(1, unitOfTime[timeInterval])),
      4
    );

    setFlowRateToReceiver(flowRateToReceiver);
    setAmountPerTimeInterval(currentStreamValue);
  };

  return (
    <Accordion activeKey={step}>
      <Card className="bg-blue text-white rounded-0 rounded-top-4 border-0 border-bottom border-purple">
        <Button
          variant="transparent"
          className="d-flex align-items-center gap-2 p-3 text-white border-0 rounded-0 shadow-none"
          style={{
            pointerEvents: step === Step.SELECT_AMOUNT ? "none" : "auto",
          }}
          onClick={() => setStep(Step.SELECT_AMOUNT)}
        >
          <Badge
            pill
            as="div"
            className="d-flex justify-content-center p-0 bg-aqua"
            style={{
              width: 20,
              height: 20,
            }}
          >
            {step !== Step.SELECT_AMOUNT ? (
              <Image src={DoneIcon} alt="done" width={16} />
            ) : (
              <Card.Text className="m-auto text-blue">1</Card.Text>
            )}
          </Badge>
          {Step.SELECT_AMOUNT}
        </Button>
        <Accordion.Collapse eventKey={Step.SELECT_AMOUNT} className="p-3 pt-0">
          <Stack gap={3}>
            <Stack direction="horizontal" gap={2}>
              <Badge className="d-flex align-items-center gap-1 bg-purple w-50 rounded-3 px-3 py-2 fs-4 fw-normal">
                <Image src={OpLogo} alt="optimism" width={18} />
                {chain?.id === 420 ? "OP Goerli" : "OP Mainnet"}
              </Badge>
              <Badge className="d-flex align-items-center gap-1 bg-purple w-50 rounded-3 px-3 py-2 fs-4 fw-normal">
                <Image
                  src={superTokenIcon}
                  alt="optimism"
                  width={isFundingMatchingPool ? 12 : 18}
                />
                {superTokenSymbol}
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
                className="bg-purple w-50 border-0 rounded-end-0 text-white shadow-none"
              />
              <Dropdown className="w-50">
                <Dropdown.Toggle
                  variant="blue"
                  className="d-flex justify-content-between align-items-center w-100 bg-purple border-0 rounded-start-0 fs-4"
                >
                  {timeInterval}
                </Dropdown.Toggle>
                <Dropdown.Menu variant="dark" className="bg-purple">
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
      <Card className="bg-blue text-white rounded-0 border-0 border-bottom border-purple">
        <Button
          variant="transparent"
          className="d-flex align-items-center gap-2 p-3 border-0 rounded-0 text-white shadow-none"
          onClick={() => setStep(Step.WRAP)}
          style={{
            pointerEvents:
              step === Step.SELECT_AMOUNT || step === Step.WRAP
                ? "none"
                : "auto",
          }}
        >
          <Badge
            pill
            as="div"
            className={`d-flex justify-content-center p-0
                    ${
                      step === Step.SELECT_AMOUNT ? "bg-secondary" : "bg-aqua"
                    }`}
            style={{
              width: 20,
              height: 20,
            }}
          >
            {step === Step.REVIEW || step === Step.SUCCESS ? (
              <Image src={DoneIcon} alt="done" width={16} />
            ) : (
              <Card.Text className="m-auto text-blue">2</Card.Text>
            )}
          </Badge>
          {Step.WRAP}
        </Button>
        <Accordion.Collapse eventKey={Step.WRAP} className="p-3 pt-0">
          <Stack direction="vertical" gap={3}>
            <Stack direction="vertical" className="position-relative">
              <Stack
                direction="horizontal"
                gap={2}
                className="w-100 bg-purple p-2 rounded-4 rounded-bottom-0"
              >
                <Form.Control
                  type="text"
                  placeholder="0"
                  disabled={!address}
                  value={wrapAmount ?? ""}
                  className="bg-purple w-75 border-0 text-white shadow-none"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAmountSelection(e, setWrapAmount)
                  }
                />
                <Badge
                  as="div"
                  className="d-flex justify-content-center align-items-center w-25 gap-1 bg-dark py-2 border border-dark rounded-3"
                >
                  <Image
                    src={superTokenIcon}
                    alt="done"
                    width={isFundingMatchingPool ? 10 : 18}
                  />
                  <Card.Text className="p-0">{underlyingTokenName}</Card.Text>
                </Badge>
              </Stack>
              <Card.Text className="w-100 bg-purple m-0 mb-2 px-2 pb-2 rounded-bottom-4 text-end fs-5">
                Balance:{" "}
                {underlyingTokenBalance
                  ? underlyingTokenBalance.formatted.slice(0, 8)
                  : "0"}
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
                className="w-100 bg-purple p-2 rounded-4 rounded-bottom-0"
              >
                <Form.Control
                  type="text"
                  placeholder="0"
                  disabled={!address}
                  value={
                    wrapAmount ??
                    formatEther(parseEther(amountPerTimeInterval) * BigInt(3))
                  }
                  className="bg-purple w-75 border-0 text-white shadow-none"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleAmountSelection(e, setWrapAmount)
                  }
                />
                <Badge
                  as="div"
                  className="d-flex justify-content-center align-items-center gap-1 w-25 bg-dark py-2 border border-dark rounded-3"
                >
                  <Image
                    src={superTokenIcon}
                    alt="done"
                    width={isFundingMatchingPool ? 10 : 18}
                  />
                  <Card.Text className="p-0">{superTokenSymbol}</Card.Text>
                </Badge>
              </Stack>
              <Card.Text className="w-100 bg-purple m-0 px-2 pb-2 rounded-bottom-4 text-end fs-5">
                Balance: {formatEther(superTokenBalance).slice(0, 8)}
              </Card.Text>
            </Stack>
            {underlyingTokenBalance &&
              wrapAmount &&
              Number(
                formatUnits(
                  underlyingTokenBalance.value,
                  underlyingTokenBalance.decimals
                )
              ) < Number(wrapAmount) && (
                <Alert variant="danger" className="m-0">
                  Insufficient Balance
                </Alert>
              )}
            <Stack direction="horizontal" gap={2}>
              <OverlayTrigger
                overlay={
                  <Tooltip id="t-skip-wrap" className="fs-6">
                    You can skip wrapping if you already have an{" "}
                    {superTokenSymbol}
                    balance.
                  </Tooltip>
                }
              >
                <Button
                  variant="primary"
                  disabled={superTokenBalance <= BigInt(0)}
                  className="w-50 py-1 rounded-3 text-white"
                  onClick={() => {
                    setWrapAmount("");
                    setStep(
                      isFundingMatchingPool ||
                        (passportScore && passportScore >= minPassportScore)
                        ? Step.REVIEW
                        : Step.MINT_PASSPORT
                    );
                  }}
                >
                  Skip
                </Button>
              </OverlayTrigger>
              <Button
                variant="success"
                disabled={
                  !underlyingTokenBalance ||
                  !wrapAmount ||
                  Number(wrapAmount) === 0 ||
                  Number(
                    formatUnits(
                      underlyingTokenBalance.value,
                      underlyingTokenBalance.decimals
                    )
                  ) < Number(wrapAmount)
                }
                className="w-50 py-1 rounded-3 text-white"
                onClick={() =>
                  setStep(
                    isFundingMatchingPool ||
                      (passportScore && passportScore >= minPassportScore)
                      ? Step.REVIEW
                      : Step.MINT_PASSPORT
                  )
                }
              >
                Continue
              </Button>
            </Stack>
          </Stack>
        </Accordion.Collapse>
      </Card>
      {!isFundingMatchingPool && (
        <Card className="bg-blue text-white rounded-0 border-0 border-bottom border-purple">
          <Button
            variant="transparent"
            className="d-flex align-items-center gap-2 p-3 border-0 rounded-0 text-white shadow-none"
            style={{
              pointerEvents: step !== Step.REVIEW ? "none" : "auto",
            }}
            onClick={() => setStep(Step.MINT_PASSPORT)}
          >
            <Badge
              pill
              className={`d-flex justify-content-center p-0 ${
                step !== Step.MINT_PASSPORT &&
                step !== Step.REVIEW &&
                step !== Step.SUCCESS
                  ? "bg-secondary"
                  : "bg-aqua"
              }`}
              style={{
                width: 20,
                height: 20,
              }}
            >
              {step === Step.REVIEW || step === Step.SUCCESS ? (
                <Image src={DoneIcon} alt="done" width={16} />
              ) : (
                <Card.Text className="m-auto text-blue">3</Card.Text>
              )}
            </Badge>
            {Step.MINT_PASSPORT}
          </Button>
          <Accordion.Collapse
            eventKey={Step.MINT_PASSPORT}
            className="p-3 py-0"
          >
            <Stack direction="vertical" gap={2}>
              <Card.Text className="m-0 border-bottom border-secondary text-secondary">
                Current Score
              </Card.Text>
              <Stack
                direction="horizontal"
                gap={3}
                className={`${
                  passportScore && passportScore > minPassportScore
                    ? "text-success"
                    : passportScore
                    ? "text-danger"
                    : "text-yellow"
                }`}
              >
                <Image src={PassportIcon} alt="passport" width={36} />
                <Card.Text className="m-0 fs-1 fw-bold">
                  {passportScore ? parseFloat(passportScore.toFixed(3)) : "N/A"}
                </Card.Text>
                <Card.Text className="m-0 fs-5" style={{ width: 80 }}>
                  min. {minPassportScore} required for matching
                </Card.Text>
                <Button
                  variant="transparent"
                  className="p-0"
                  onClick={refetchPassportScore}
                >
                  <Image
                    src={ReloadIcon}
                    alt="reload"
                    width={24}
                    style={{
                      filter:
                        passportScore && passportScore > minPassportScore
                          ? "invert(65%) sepia(44%) saturate(6263%) hue-rotate(103deg) brightness(95%) contrast(97%)"
                          : passportScore
                          ? "invert(27%) sepia(47%) saturate(3471%) hue-rotate(336deg) brightness(93%) contrast(85%)"
                          : "invert(88%) sepia(26%) saturate(4705%) hue-rotate(2deg) brightness(109%) contrast(102%)",
                    }}
                  />
                </Button>
              </Stack>
              <Button variant="success" className="w-100 rounded-3">
                <Card.Link
                  href="https://passport.gitcoin.co"
                  target="_blank"
                  rel="noreferrer"
                  className="text-decoration-none text-white fw-bold"
                >
                  Update stamps and mint
                </Card.Link>
              </Button>
              <Button
                variant="transparent"
                className="m-0 ms-auto fs-4 text-info"
                onClick={() => setStep(Step.REVIEW)}
              >
                Skip
              </Button>
            </Stack>
          </Accordion.Collapse>
        </Card>
      )}
      <Card className="bg-blue text-white rounded-0 rounded-bottom-4 border-0">
        <Button
          variant="transparent"
          className="d-flex align-items-center gap-2 p-3 border-0 rounded-0 text-white shadow-none"
          style={{
            pointerEvents: "none",
          }}
          onClick={() => setStep(Step.REVIEW)}
        >
          <Badge
            pill
            className={`d-flex justify-content-center p-0 ${
              step !== Step.REVIEW && step !== Step.SUCCESS
                ? "bg-secondary"
                : "bg-aqua"
            }`}
            style={{
              width: 20,
              height: 20,
            }}
          >
            {step === Step.SUCCESS ? (
              <Image src={DoneIcon} alt="done" width={16} />
            ) : (
              <Card.Text className="m-auto text-blue">
                {isFundingMatchingPool ? 3 : 4}
              </Card.Text>
            )}
          </Badge>
          {Step.REVIEW}
        </Button>
        <Accordion.Collapse eventKey={Step.REVIEW} className="p-3 pt-0">
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
                    className="justify-content-center align-items-center bg-purple p-2 rounded-4"
                  >
                    <Image
                      src={superTokenIcon}
                      alt="done"
                      width={isFundingMatchingPool ? 16 : 28}
                    />
                    <Card.Text className="m-0 border-0 text-center text-white fs-5">
                      {wrapAmount} <br /> {underlyingTokenName}
                    </Card.Text>
                    <Card.Text className="border-0 text-center text-white fs-6">
                      New Balance:{" "}
                      {(
                        Number(underlyingTokenBalance?.formatted) -
                        Number(wrapAmount)
                      )
                        .toString()
                        .slice(0, 8)}
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
                    className="justify-content-center align-items-center bg-purple p-2 rounded-4"
                  >
                    <Image
                      src={superTokenIcon}
                      alt="done"
                      width={isFundingMatchingPool ? 16 : 28}
                    />
                    <Card.Text className="m-0 border-0 text-center text-white fs-5">
                      {wrapAmount} <br /> {superTokenSymbol}
                    </Card.Text>
                    <Card.Text className="border-0 text-center text-white fs-6">
                      New Balance:{" "}
                      {formatEther(
                        superTokenBalance + parseEther(wrapAmount ?? "0")
                      ).slice(0, 8)}
                    </Card.Text>
                  </Stack>
                </Stack>
                <Card.Text className="border-0 text-center text-gray fs-4">
                  1 {underlyingTokenName} = 1 {superTokenSymbol}
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
              <Badge className="d-flex justify-content-around align-items-center w-50 bg-purple py-3 rounded-3 border-0 text-center text-white fs-5">
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
              <Badge className="d-flex justify-content-around align-items-center w-50 bg-purple px-2 py-3 rounded-3 border-0 text-center text-white fs-5">
                {truncateStr(receiver, 12)}
                <CopyTooltip
                  contentClick="Address copied"
                  contentHover="Copy address"
                  handleCopy={() => navigator.clipboard.writeText(receiver)}
                  target={<Image src={CopyIcon} alt="copy" width={18} />}
                />
              </Badge>
            </Stack>
            <Stack direction="vertical">
              <Stack
                direction="horizontal"
                className={`mt-2 bg-purple p-2 ${
                  !isFundingMatchingPool ? "rounded-top-4" : "rounded-4"
                }`}
              >
                <Card.Text className="w-33 m-0">New Stream</Card.Text>
                <Stack direction="horizontal" gap={1} className="w-50 ms-1 p-2">
                  <Image
                    src={superTokenIcon}
                    alt={isFundingMatchingPool ? "eth" : "usdc"}
                    width={isFundingMatchingPool ? 16 : 32}
                  />
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
              {!isFundingMatchingPool && (
                <Stack
                  direction="horizontal"
                  className="bg-purple rounded-bottom-4 border-top border-dark p-2"
                >
                  <Card.Text className="w-33 m-0">Matching</Card.Text>
                  <Stack
                    direction="horizontal"
                    gap={1}
                    className="w-50 ms-1 p-2"
                  >
                    <Image
                      src={ETHLogo}
                      alt="eth"
                      width={18}
                      className="mx-1"
                    />
                    <Badge className="bg-slate w-100 ps-2 pe-2 py-2 fs-4 text-start">
                      {passportScore && passportScore < minPassportScore
                        ? "N/A"
                        : netImpact
                        ? `${netImpact > 0 ? "+" : ""}${parseFloat(
                            (
                              Number(formatEther(netImpact)) *
                              fromTimeUnitsToSeconds(1, "months")
                            ).toFixed(6)
                          )}`
                        : 0}
                    </Badge>
                  </Stack>
                  <Card.Text className="m-0 ms-1 fs-5">/month</Card.Text>
                </Stack>
              )}
            </Stack>
            {accountFlowRate &&
              BigInt(-accountFlowRate) -
                BigInt(flowRateToReceiver) +
                parseEther(amountPerTimeInterval) /
                  BigInt(fromTimeUnitsToSeconds(1, unitOfTime[timeInterval])) >
                BigInt(0) && (
                <Stack direction="horizontal" gap={1} className="mt-1">
                  <Card.Text className="m-0">Est. Liquidation</Card.Text>
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="t-liquidation-info" className="fs-6">
                        This is the current estimate for when your token balance
                        will reach 0. Make sure to close your stream or wrap
                        more tokens before this date to avoid loss of your
                        buffer deposit.
                      </Tooltip>
                    }
                  >
                    <Image src={InfoIcon} alt="liquidation info" width={16} />
                  </OverlayTrigger>
                  <Card.Text className="m-0 ms-1">
                    {dayjs()
                      .add(
                        dayjs.duration({
                          seconds:
                            Number(
                              formatEther(
                                superTokenBalance +
                                  parseEther(wrapAmount ?? "0")
                              )
                            ) /
                            Number(
                              formatEther(
                                BigInt(-accountFlowRate) -
                                  BigInt(flowRateToReceiver) +
                                  BigInt(newFlowRate)
                              )
                            ),
                        })
                      )
                      .format("MMMM D, YYYY")}
                  </Card.Text>
                </Stack>
              )}
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
      </Card>
      {step === Step.SUCCESS && (
        <Card className="bg-blue mt-4 p-4 text-white rounded-4">
          <Card.Text>
            Donation stream confirmed! Thank you for your ongoing support to
            public goods.
          </Card.Text>
          <Card.Text
            as="span"
            className="text-center"
            style={{ fontSize: 100 }}
          >
            &#x1F64F;
          </Card.Text>
          <Card.Text>
            Help spread the word about Streaming Quadratic Funding by sharing
            your contribution with your network:
          </Card.Text>
          <Stack
            direction="horizontal"
            className="justify-content-center align-items-end"
          >
            <Card.Link
              className="d-flex flex-column twitter-share-button text-decoration-none text-white fs-5 p-2"
              rel="noreferrer"
              target="_blank"
              href={`https://twitter.com/intent/tweet?text=I%20just%20opened%20a%20contribution%20stream%20to%20${granteeName}%20in%20the%20%23streamingquadratic%20funding%20pilot%20presented%20by%20%40thegeoweb%2C%20%40Superfluid_HQ%2C%20%26%20%40gitcoin%3A%0A%0Ahttps%3A%2F%2Fgeoweb.land%2Fgovernance%2F%0A%0AJoin%20me%20in%20making%20public%20goods%20funding%20history%20by%20donating%20in%20the%20world%27s%20first%20SQF%20round%21`}
              data-size="large"
            >
              <Image src={XIcon} alt="x social" width={24} className="m-auto" />
              Post to X
            </Card.Link>
            <Card.Link
              className="d-flex flex-column text-decoration-none text-white fs-5 p-2"
              rel="noreferrer"
              target="_blank"
              href={`https://warpcast.com/~/compose?text=I+just+opened+a+contribution+stream+to+${granteeName}+in+the+%23streamingquadraticfunding+pilot+round+presented+by+%40geoweb%2C+%40gitcoin%2C+%26+Superfluid%3A+%0A%0Ahttps%3A%2F%2Fgeoweb.land%2Fgovernance%2F+%0A%0AJoin+me+in+making+public+goods+funding+history+by+donating+in+the+world's+first+SQF+round%21`}
            >
              <Image
                src={FarcasterIcon}
                alt="farcaster"
                width={28}
                className="m-auto"
              />
              Cast to Farcaster
            </Card.Link>
            <Card.Link
              className="d-flex flex-column text-decoration-none text-white fs-5 p-2"
              rel="noreferrer"
              target="_blank"
              href={`https://hey.xyz/?text=I+just+opened+a+contribution+stream+to+GRANTEE+in+the+%23streamingquadraticfunding+pilot+round+presented+by+%40geoweb%2C+%40gitcoin%2C+%26+%40superfluid%3A+%0A%0Ahttps%3A%2F%2Fgeoweb.land%2Fgovernance%2F+%0A%0AJoin+me+in+making+public+goods+funding+history+by+donating+in+the+world%27s+first+SQF+round%21`}
            >
              <Image src={LensIcon} alt="lens" width={32} className="m-auto" />
              Post on Lens
            </Card.Link>
          </Stack>
        </Card>
      )}
    </Accordion>
  );
}
