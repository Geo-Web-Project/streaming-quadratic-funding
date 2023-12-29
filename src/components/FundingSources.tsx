import Card from "react-bootstrap/Card";
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
    <div
      className="text-white position-relative"
      style={{ width: VIZ_CARD_WIDTH_SOURCE, height: dimensions.height }}
    >
      <Card
        className="position-absolute w-100 bg-aqua border-0 rounded-end-0 px-2 py-0 text-white"
        style={{
          top: startYScale(0) - 105,
          height: dimensions.pathHeight,
        }}
      >
        <Card.Header className="p-0 border-0 fs-3">You</Card.Header>
        <Card.Body className="d-flex flex-column justify-content-center p-0 pb-1 fs-6">
          <div className="d-flex align-items-center gap-1">
            <Image src={usdcWhite} alt="usdc" width={16} />
            <span
              className="w-75 rounded-1 px-1 bg-aqua text-white"
              style={{
                background: "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
              }}
            >
              {parseFloat(perSecondToPerMonth(totalYou).toFixed(2))}
            </span>
            <span className="w-25">monthly</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <Image src={usdcWhite} alt="usdc" width={16} />
            <span
              className="w-75 rounded-1 px-1 bg-aqua text-white"
              style={{
                background: "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
              }}
            >
              {parseFloat((perSecondToPerMonth(totalYou) * 12).toFixed(2))}{" "}
            </span>
            <span className="w-25"> total</span>
          </div>
          {/*<Button variant="success" className="w-100 p-0 fs-5 text-white fw-bold">Connect</Button>*/}
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
        <Card.Body className="d-flex flex-column justify-content-center p-0 fs-6">
          <div className="d-flex align-items-center gap-1">
            <Image src={usdcWhite} alt="usdc" width={16} />
            <span
              className="w-75 rounded-1 px-1 bg-secondary text-white"
              style={{
                background: "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
              }}
            >
              {parseFloat(perSecondToPerMonth(totalDirect).toFixed(2))}
            </span>
            <span className="w-25">monthly</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <Image src={usdcWhite} alt="usdc" width={16} />
            <span
              className="w-75 rounded-1 px-1 bg-secondary text-white"
              style={{
                background: "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
              }}
            >
              {parseFloat((perSecondToPerMonth(totalDirect) * 12).toFixed(2))}{" "}
            </span>
            <span className="w-25"> total</span>
          </div>
        </Card.Body>
      </Card>
      <Card
        className="position-absolute w-100 bg-slate border-0 rounded-end-0 p-0 text-white"
        style={{
          top: startYScale(2) - 105,
          width: VIZ_CARD_WIDTH_SOURCE,
          height: dimensions.pathHeight,
        }}
      >
        <div className="d-flex h-100 p-1 gap-2">
          <Button
            variant="success"
            className="d-flex flex-column justify-content-center p-0 fs-3 text-white fw-bold"
            onClick={() => {
              setShowTransactionPanel(true);
            }}
          >
            <Image src={hand} alt="hand" width={26} />
          </Button>
          <div className="d-flex flex-column gap-2 ms-1">
            <Card.Header className="p-0 border-0 fs-4 lh-sm">
              Quadratic Matching
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-center p-0 fs-6">
              <div className="d-flex align-items-center gap-1">
                <Image src={ethWhite} alt="usdc" width={8} />
                <span
                  className="w-75 rounded-1 px-1 bg-slate text-white"
                  style={{
                    background:
                      "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
                  }}
                >
                  {parseFloat(perSecondToPerMonth(totalMatching).toFixed(2))}
                </span>
                <span className="w-25">monthly</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <Image src={ethWhite} alt="usdc" width={8} className="py-1" />
                <span
                  className="w-75 rounded-1 px-1 bg-slate text-white"
                  style={{
                    background:
                      "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
                  }}
                >
                  {parseFloat(
                    (perSecondToPerMonth(totalMatching) * 12).toFixed(2)
                  )}{" "}
                </span>
                <span className="w-25"> total</span>
              </div>
            </Card.Body>
          </div>
        </div>
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
    </div>
  );
}
