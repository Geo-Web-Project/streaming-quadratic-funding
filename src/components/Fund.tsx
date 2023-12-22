import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import XLogo from "../assets/x-logo.svg";
import WebIcon from "../assets/web.svg";
import CloseIcon from "../assets/close.svg";
import SQFIcon from "../assets/sqf.png";

interface FundProps {
  setShowTransactionPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Fund(props: FundProps) {
  const { setShowTransactionPanel } = props;

  return (
    <Container className="bg-blue mt-3 p-2 rounded-2 text-white">
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
          <Col className="d-flex align-items-center text-secondary fs-4 mb-3">
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
    </Container>
  );
}
