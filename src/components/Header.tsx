import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ConnectWallet from "./ConnectWallet";

export default function Header() {
  return (
    <Navbar expand className="bg-dark text-white">
      <Container fluid>
        <Row className="justify-content-between align-items-center w-100">
          <Col xs={5}>
            <h1 className="fs-2 ps-2">Streaming Quadratic Funding</h1>
          </Col>
          <Col xs="2" className="d-flex justify-content-end align-items-center">
            <ConnectWallet />
          </Col>
        </Row>
      </Container>
    </Navbar>
  );
}
