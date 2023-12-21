import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import closeIcon from "../assets/close.svg";

interface FundProps {
  setShowTransactionPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Fund(props: FundProps) {
  const { setShowTransactionPanel } = props;

  return (
    <Container className="bg-blue mt-3 pb-3 rounded-2 text-white">
      <Row className="align-items-center mb-3">
        <Col className="fs-3">Fund Matching Stream</Col>
        <Col xs="1" className="self-end p-0">
          <Button
            variant="transparent"
            className="p-0 float-end"
            onClick={() => setShowTransactionPanel(false)}
          >
            <Image src={closeIcon} alt="close" width={28} />
          </Button>
        </Col>
      </Row>
      <Row>
        <Col className="fs-5" style={{ maxWidth: 600 }}>
          100% of Geo Web PCO land market revenue is allocated through streaming
          quadratic funding. You can help fund more public goods by opening a
          direct stream to the matching pool OR by claiming a parcel at
          https://geoweb.land/
        </Col>
      </Row>
    </Container>
  );
}
