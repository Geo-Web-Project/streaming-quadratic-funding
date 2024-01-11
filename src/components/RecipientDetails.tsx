import { useAccount } from "wagmi";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import XLogo from "../assets/x-logo.svg";
import WebIcon from "../assets/web.svg";
import {
  TimeInterval,
  unitOfTime,
  fromTimeUnitsToSeconds,
  roundWeiAmount,
} from "../lib/utils";

interface RecipientDetailsProps {
  name: string;
  image: string;
  description: JSX.Element;
  website: string;
  social: string;
  flowRateToReceiver: string;
  isMatchingPool: boolean;
}

export default function RecipientDetails(props: RecipientDetailsProps) {
  const {
    name,
    image,
    description,
    website,
    social,
    flowRateToReceiver,
    isMatchingPool,
  } = props;

  const { address } = useAccount();

  return (
    <Stack direction="vertical" className="bg-blue rounded-4 p-2 pt-0">
      <Stack direction="horizontal" gap={2} className="align-items-end">
        <Image src={image} alt="SQF" width={128} />
        <Card className="bg-transparent text-white border-0">
          <Card.Title className="text-secondary fs-4">{name}</Card.Title>
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
                  {isMatchingPool ? "ETHx" : "USDCx"} <br />
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
          href={website}
          target="_blank"
          rel="noreferrer"
          className="ms-2 p-0"
        >
          <Image src={WebIcon} alt="Web" width={18} />
        </Button>
        <Button
          variant="link"
          href={social}
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
        {description}
      </Card.Text>
    </Stack>
  );
}
