import { parseEther } from "viem";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import HandIcon from "../assets/hand.svg";
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
    <Stack
      direction="vertical"
      className="text-white position-relative"
      style={{ width: VIZ_CARD_WIDTH_GRANTEE, height: dimensions.height }}
    >
      {grantees.map((grantee, i) => (
        <Stack
          direction="horizontal"
          gap={1}
          className="justify-content-even border bg-blue border-0 rounded-end-2 px-2 py-1"
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
            className="d-flex flex-column justify-content-center align-items-center h-100 p-0 fs-3 text-white fw-bold"
            onClick={() => {
              const _poolYou = [...poolYou];
              poolYou[i].perSecondRate = (
                BigInt(poolYou[i].perSecondRate) + parseEther("0.00000216")
              ).toString();
              setPoolYou(_poolYou);
            }}
          >
            <Image src={HandIcon} alt="donate" width={26} />
          </Button>
          <Card className="h-100 px-1 bg-transparent text-white">
            <Card.Title className="m-0 mb-1 p-0 fs-4">{grantee}</Card.Title>
            <Card.Subtitle
              as="p"
              className="d-block h-50 p-0 m-0 fs-5 text-info text-wrap text-break text-truncate lh-md"
            >
              {descriptions[i]}
            </Card.Subtitle>
            <Stack
              direction="horizontal"
              gap={1}
              className="align-items-center fs-6 m-0 p-0"
            >
              <Badge className="bg-aqua w-33 rounded-1 fs-6 text-start fw-normal">
                {parseFloat(
                  perSecondToPerMonth(
                    totalYou * datasetUsdc[0][grantee]
                  ).toFixed(2)
                )}{" "}
              </Badge>
              <Badge className="bg-secondary w-33 rounded-1 px-1 fs-6 text-start fw-normal">
                {parseFloat(
                  perSecondToPerMonth(
                    totalDirect * datasetUsdc[1][grantee]
                  ).toFixed(2)
                )}{" "}
              </Badge>
              <Badge className="bg-slate w-33 rounded-1 px-1 fs-6 text-start fw-normal">
                {parseFloat(
                  perSecondToPerMonth(
                    totalMatching * datasetEth[1][grantee]
                  ).toFixed(2)
                )}{" "}
              </Badge>
              /month
            </Stack>
          </Card>
        </Stack>
      ))}
    </Stack>
  );
}
