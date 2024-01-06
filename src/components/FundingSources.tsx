import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import usdcWhite from "../assets/usdc-white.svg";
import ethWhite from "../assets/eth-white.svg";
import hand from "../assets/hand.svg";
import { VisualizationProps, Dimensions } from "./Visualization";
import { perSecondToPerMonth } from "../lib/utils";
import { VIZ_CARD_WIDTH_SOURCE } from "../lib/constants";

type FundingSourcesProps = VisualizationProps & {
  dimensions: Dimensions;
  startYScale: (n: number) => number;
  symbolsPerSecondUsdc: number;
  symbolsPerSecondEth: number;
  totalYou: number;
  totalDirect: number;
  totalMatching: number;
};

export default function FundingSources(props: FundingSourcesProps) {
  const {
    dimensions,
    startYScale,
    symbolsPerSecondUsdc,
    symbolsPerSecondEth,
    totalYou,
    totalDirect,
    totalMatching,
    setShowTransactionPanel,
  } = props;

  const totalUsdc = totalYou + totalDirect;
  const symbolsPerSecondToUsdc = (symbolsPerSecond: number) =>
    totalUsdc / symbolsPerSecond;

  const symbolsPerSecondToEth = (symbolsPerSecond: number) =>
    totalMatching / symbolsPerSecond;

  return (
    <Stack
      direction="vertical"
      className="text-white position-relative"
      style={{ width: VIZ_CARD_WIDTH_SOURCE, height: dimensions.height }}
    >
      <Card
        className="position-absolute w-100 bg-aqua border-0 rounded-end-0 px-2 py-1 text-white"
        style={{
          top: startYScale(0) - 105,
          height: dimensions.pathHeight,
        }}
      >
        <Card.Header className="p-0 border-0 fs-4">You</Card.Header>
        <Card.Body className="d-flex flex-column justify-content-center gap-1 p-0 pb-1 fs-6">
          <Stack direction="horizontal" gap={1} className="align-items-center">
            <Image src={usdcWhite} alt="usdc" width={16} />
            <Badge
              className="w-75 m-0 rounded-1 px-1 bg-aqua fs-6 text-white fw-normal text-start"
              style={{
                background: "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
              }}
            >
              {parseFloat(perSecondToPerMonth(totalYou).toFixed(2))}
            </Badge>
            <Card.Text className="w-25 m-0">/month</Card.Text>
          </Stack>
          <Stack direction="horizontal" gap={1} className="align-items-center">
            <Image src={usdcWhite} alt="usdc" width={16} />
            <Badge
              className="w-75 m-0 rounded-1 px-1 bg-aqua fs-6 text-white text-start fw-normal"
              style={{
                background: "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
              }}
            >
              {parseFloat((perSecondToPerMonth(totalYou) * 12).toFixed(2))}{" "}
            </Badge>
            <Card.Text className="w-25 m-0"> total</Card.Text>
          </Stack>
        </Card.Body>
      </Card>
      <Card
        className="position-absolute w-100 bg-secondary border-0 rounded-end-0 px-2 py-1 text-white"
        style={{
          top: startYScale(1) - 105,
          width: VIZ_CARD_WIDTH_SOURCE,
          height: dimensions.pathHeight,
        }}
      >
        <Card.Header className="p-0 border-0 fs-4">Direct Funders</Card.Header>
        <Card.Body className="d-flex flex-column justify-content-center gap-1 p-0 fs-6">
          <Stack direction="horizontal" gap={1} className="align-items-center">
            <Image src={usdcWhite} alt="usdc" width={16} />
            <Badge
              className="w-75 m-0 rounded-1 px-1 bg-secondary fs-6 text-white fw-normal text-start"
              style={{
                background: "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
              }}
            >
              {parseFloat(perSecondToPerMonth(totalDirect).toFixed(2))}
            </Badge>
            <Card.Text className="w-25 m-0">/month</Card.Text>
          </Stack>
          <Stack direction="horizontal" gap={1} className="align-items-center">
            <Image src={usdcWhite} alt="usdc" width={16} />
            <Badge
              className="w-75 m-0 rounded-1 px-1 bg-secondary fs-6 text-start fw-normal text-white"
              style={{
                background: "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
              }}
            >
              {parseFloat((perSecondToPerMonth(totalDirect) * 12).toFixed(2))}{" "}
            </Badge>
            <Card.Text className="w-25 m-0"> total</Card.Text>
          </Stack>
        </Card.Body>
      </Card>
      <Card
        className="position-absolute w-100 bg-slate border-0 rounded-end-0 p-0 pe-1 text-white"
        style={{
          top: startYScale(2) - 105,
          width: VIZ_CARD_WIDTH_SOURCE,
          height: dimensions.pathHeight,
        }}
      >
        <Stack direction="horizontal" gap={2} className="h-100 p-1">
          <Button
            variant="success"
            className="d-flex flex-column justify-content-center h-100 p-0 fs-3 text-white fw-bold"
            onClick={() => {
              setShowTransactionPanel(true);
            }}
          >
            <Image src={hand} alt="hand" width={26} />
          </Button>
          <Stack direction="vertical" gap={2} className="ms-1">
            <Card.Header className="p-0 border-0 fs-4 lh-sm">
              Quadratic Matching
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center gap-1 p-0 fs-6">
              <Stack
                direction="horizontal"
                gap={1}
                className="align-items-center"
              >
                <Image src={ethWhite} alt="usdc" width={8} />
                <Badge
                  className="w-75 m-0 rounded-1 px-1 bg-slate fs-6 text-start fw-normal text-white"
                  style={{
                    background:
                      "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
                  }}
                >
                  {parseFloat(perSecondToPerMonth(totalMatching).toFixed(2))}
                </Badge>
                <Card.Text className="w-25 m-0">/month</Card.Text>
              </Stack>
              <Stack
                direction="horizontal"
                gap={1}
                className="align-items-center"
              >
                <Image src={ethWhite} alt="usdc" width={8} className="py-1" />
                <Badge
                  className="w-75 m-0 rounded-1 px-1 bg-slate fs-6 text-start fw-normal text-white"
                  style={{
                    background:
                      "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
                  }}
                >
                  {parseFloat(
                    (perSecondToPerMonth(totalMatching) * 12).toFixed(2)
                  )}{" "}
                </Badge>
                <Card.Text className="w-25 m-0">total</Card.Text>
              </Stack>
            </Card.Body>
          </Stack>
        </Stack>
      </Card>
      <Card
        className="position-absolute bg-blue text-white mt-4 px-2"
        style={{ width: 340, bottom: window.screen.height < 1080 ? 106 : 126 }}
      >
        <Card.Header className="text-secondary border-purple px-0 py-1">
          Legend
        </Card.Header>
        <Card.Body className="d-flex align-items-center px-0 py-2 fs-5">
          <Card.Img
            variant="start"
            src={usdcWhite}
            width={30}
            className="pe-1"
          />
          <Card.Text className="mb-0 me-3">
            ={" "}
            {parseFloat(
              symbolsPerSecondToUsdc(symbolsPerSecondUsdc).toFixed(8)
            )}{" "}
            USDCx
          </Card.Text>
          <Card.Img
            variant="start"
            className="m-0 p-0 pe-2"
            src={ethWhite}
            width={20}
          />
          <Card.Text className="mb-0">
            ={" "}
            {symbolsPerSecondToEth(symbolsPerSecondEth)
              .toFixed(11)
              .replace(/\.?0+$/, "")}{" "}
            ETHx
          </Card.Text>
        </Card.Body>
      </Card>
    </Stack>
  );
}
