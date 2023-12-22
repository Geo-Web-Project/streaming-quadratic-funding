import { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Fund from "./Fund";
import Visualization from "./Visualization";

export default function StreamingQuadraticFunding() {
  const [showTransactionPanel, setShowTransactionPanel] =
    useState<boolean>(false);

  return (
    <Container fluid className="p-0">
      <Row>
        <Col xs="3">
          {showTransactionPanel && (
            <Fund setShowTransactionPanel={setShowTransactionPanel} />
          )}
        </Col>
        <Col xs={showTransactionPanel ? "9" : 0}>
          <div className="d-flex flex-column justify-content-stretch pt-2">
            <p className="d-flex fs-3 text-primary mb-0">
              Streaming Quadratic Funding
            </p>
            <p className="text-white fs-4 mb-1">
              A quadratic funding round every second
            </p>
            <p className="text-info fs-5 mb-0">
              Beta Run - January 15 - April 15, 2024
            </p>
          </div>
          <Visualization
            showTransactionPanel={showTransactionPanel}
            setShowTransactionPanel={setShowTransactionPanel}
          />
        </Col>
      </Row>
    </Container>
  );
}
