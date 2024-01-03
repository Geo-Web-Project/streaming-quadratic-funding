import Container from "react-bootstrap/Container";
import { parseEther } from "viem";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import hand from "../assets/hand.svg";
import { Dimensions } from "./Visualization";
import { perSecondToPerMonth } from "../lib/utils";
import { VIZ_CARD_WIDTH_GRANTEE } from "../lib/constants";

interface GranteesProps {
  dimensions: Dimensions;
  endYScale: (n: number) => number;
  totalYou: number;
  totalDirect: number;
  totalMatching: number;
  datasetUsdc: any;
  datasetEth: any;
  grantees: string[];
  descriptions: string[];
  poolYou: any;
  setPoolYou: React.Dispatch<React.SetStateAction<any>>;
}

export default function Grantees(props: GranteesProps) {
  const {
    dimensions,
    endYScale,
    totalYou,
    totalDirect,
    totalMatching,
    datasetUsdc,
    datasetEth,
    grantees,
    descriptions,
    poolYou,
    setPoolYou,
  } = props;

  return (
    <div
      className="d-flex flex-column text-white position-relative"
      style={{ width: VIZ_CARD_WIDTH_GRANTEE, height: dimensions.height }}
    >
      {grantees.map((grantee, i) => (
        <div
          className="d-flex border bg-blue border-0 rounded-end-2 px-2 py-1"
          style={{
            position: "absolute",
            top: endYScale(i) - 105,
            width: VIZ_CARD_WIDTH_GRANTEE,
            height: dimensions.pathHeight,
          }}
          key={i}
        >
          <Button
            variant="success"
            className="d-flex flex-column justify-content-center align-items-center p-0 fs-3 text-white fw-bold"
            onClick={() => {
              const _poolYou = [...poolYou];
              poolYou[i].perSecondRate = (
                BigInt(poolYou[i].perSecondRate) + parseEther("0.00000216")
              ).toString();
              setPoolYou(_poolYou);
            }}
          >
            <Image src={hand} alt="hand" width={26} />
          </Button>
          <Container className="px-2">
            <Row className="p-0 fs-4">
              <Col>{grantee}</Col>
            </Row>
            <Row className="d-block h-50 p-0 m-0 fs-5 text-info text-wrap text-break text-truncate">
              <Col className="p-0">{descriptions[i]}</Col>
            </Row>
            <Row className="d-flex align-items-center gap-1 fs-6 m-0 p-0">
              <Col className="bg-aqua w-33 rounded-1 px-1">
                {parseFloat(
                  perSecondToPerMonth(
                    totalYou * datasetUsdc[0][grantee]
                  ).toFixed(2)
                )}{" "}
              </Col>
              <Col className="bg-secondary w-33 rounded-1 px-1">
                {parseFloat(
                  perSecondToPerMonth(
                    totalDirect * datasetUsdc[1][grantee]
                  ).toFixed(2)
                )}{" "}
              </Col>
              <Col className="bg-slate w-33 rounded-1 px-1">
                {parseFloat(
                  perSecondToPerMonth(
                    totalMatching * datasetEth[1][grantee]
                  ).toFixed(2)
                )}{" "}
              </Col>
              /month
            </Row>
          </Container>
        </div>
      ))}
    </div>
  );
}
