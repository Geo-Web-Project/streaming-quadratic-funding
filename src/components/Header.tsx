import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <Navbar expand className="bg-dark text-white">
      <Container>
        <Row className="justify-content-between justify-content-lg-center w-100">
          <Col xs={5} lg={{ span: 6, offset: 4 }}>
            <h1>Streaming Quadratic Funding</h1>
          </Col>
          <Col xs="2" className="d-flex justify-content-end align-items-center">
            <ConnectButton
              label="Connect"
              chainStatus="icon"
              showBalance={false}
            />
          </Col>
        </Row>
      </Container>
    </Navbar>
  );
}
