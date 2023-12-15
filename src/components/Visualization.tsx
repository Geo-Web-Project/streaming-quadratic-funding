// @ts-nocheck
import * as d3 from "d3";
import { useRef, useMemo, useLayoutEffect, useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Container";
import Col from "react-bootstrap/Container";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import { weightedPick, getRandomNumberInRange } from "../lib/utils";
import {
  MS_PER_SECOND,
  VIZ_MAX_SYMBOLS,
  VIZ_ANIMATION_DURATION,
} from "../lib/constants";
import ethLight from "../assets/eth-light.svg";
import ethDark from "../assets/eth-dark.svg";
import ethWhite from "../assets/eth-white.svg";
import usdcLight from "../assets/usdc-light.svg";
import usdcDark from "../assets/usdc-dark.svg";
import usdcWhite from "../assets/usdc-white.svg";
import jsonUsdc from "../lib/funding-usdc.json";
import jsonEth from "../lib/funding-eth.json";

enum Source {
  YOU,
  DIRECT,
  MATCHING,
}

enum Token {
  USDC,
  ETH,
}

let lastSymbolId = 0;

const symbols = [];
const grantees = [
  "Gov4Git",
  "Open Source Observer",
  "Avelous Hacking",
  "OpSci",
  "OpenCann",
  "Blockscout",
];
const sources = ["you", "direct", "matching"];
const granteeIndexes = d3.range(grantees.length);
const sourceIndexes = d3.range(sources.length);

export default function Visualization() {
  const [datasetUsdc, setDatasetUsdc] = useState(jsonUsdc);
  const [datasetEth, setDatasetEth] = useState(jsonEth);
  const [timerSymbolsEth, setTimerSymbolsEth] = useState(null);
  const [timerSymbolsUsdc, setTimerSymbolsUsdc] = useState(null);
  const [timerStarted, setTimerStarted] = useState(null);
  const [symbolsPerSecondUsdc, setSymbolsPerSecondUsdc] = useState(0);
  const [symbolsPerSecondEth, setSymbolsPerSecondEth] = useState(0);
  const [totalYou, setTotalYou] = useState(0.000004); // USDC
  const [totalDirect, setTotalDirect] = useState(0.0002 - totalYou); // USDC

  const svgRef = useRef<SVGSVGElement | null>(null);
  const symbolsGroup = useRef(null);

  const totalUsdc = totalYou + totalDirect;
  const totalMatching = totalUsdc / 2000; // ETH

  const dimensions = {
    width: window.screen.width / 3,
    height: window.screen.height > 1080 ? 1000 : 750,
    margin: {
      top: 0,
      right: 0,
      bottom: 10,
      left: 0,
    },
    pathHeight: 80,
  };

  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  const { xScale, startYScale, endYScale, yTransitionProgressScale } =
    useMemo(() => {
      const xScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([0, dimensions.boundedWidth])
        .clamp(true);
      const startYScale = d3
        .scaleLinear()
        .domain([-1, sourceIndexes.length])
        .range([0, dimensions.boundedHeight]);
      const endYScale = d3
        .scaleLinear()
        .domain([-1, granteeIndexes.length])
        .range([0, dimensions.boundedHeight]);
      const yTransitionProgressScale = d3
        .scaleLinear()
        .domain([0.45, 0.55])
        .range([0, 1])
        .clamp(true);

      return {
        xScale,
        startYScale,
        endYScale,
        yTransitionProgressScale,
      };
    }, []);

  useLayoutEffect(() => {
    let _timerSymbolsUsdc = null;
    let _timerSymbolsEth = null;

    const svgElement = d3.select(svgRef.current);
    const bounds = svgElement
      .append("g")
      .style("transform", `translateY(-60px)`);
    const linkLineGenerator = d3
      .line()
      .x((d, i) => i * (dimensions.boundedWidth / 5))
      .y((d, i) => (i <= 2 ? startYScale(d[0]) : endYScale(d[1])))
      .curve(d3.curveMonotoneX);
    const linkOptions = d3.merge(
      sourceIndexes.map((startId) =>
        granteeIndexes.map((endId) => new Array(6).fill([startId, endId]))
      )
    );
    const linksGroup = bounds.append("g");

    linksGroup
      .selectAll(".grantee-path")
      .data(linkOptions)
      .enter()
      .append("path")
      .attr("class", "grantee-path")
      .attr("d", linkLineGenerator)
      .attr("stroke-width", dimensions.pathHeight);

    symbolsGroup.current = bounds.append("g").attr("class", "symbols-group");

    const bottomRangeUsdc = findBottomRange(totalUsdc);
    const topRangeUsdc = bottomRangeUsdc * 10;
    const bottomRangeEth = findBottomRange(totalMatching);
    const topRangeEth = bottomRangeEth * 10;

    const symbolsPerSecondUsdc = amountToSymbolsPerSecond(
      totalUsdc,
      [bottomRangeUsdc, topRangeUsdc],
      [10, 30]
    );
    const symbolsPerSecondEth = amountToSymbolsPerSecond(
      totalMatching,
      [bottomRangeEth, topRangeEth],
      [10, 30]
    );

    setSymbolsPerSecondUsdc(symbolsPerSecondUsdc);
    setSymbolsPerSecondEth(symbolsPerSecondEth);
    setTimerStarted(d3.now());
    _timerSymbolsUsdc = d3.interval(
      (elapsed) => enterSymbol(elapsed, datasetUsdc, Token.USDC),
      MS_PER_SECOND / symbolsPerSecondUsdc
    );
    _timerSymbolsEth = d3.interval(
      (elapsed) => enterSymbol(elapsed, datasetEth, Token.ETH),
      MS_PER_SECOND / symbolsPerSecondEth
    );
    setTimerSymbolsUsdc(_timerSymbolsUsdc);
    setTimerSymbolsEth(_timerSymbolsEth);
    d3.timer(updateSymbols);

    return () => {
      if (_timerSymbolsUsdc) {
        _timerSymbolsUsdc.stop();
      }

      if (_timerSymbolsEth) {
        _timerSymbolsEth.stop();
      }

      bounds.remove("g");
    };
  }, []);

  const generateSymbolUsdc = (elapsed: number, dataset: any) => {
    const pick = weightedPick(
      dataset,
      dataset.map((d) => d.weight)
    );
    const token = Token.USDC;
    const source = pick.source === "you" ? Source.YOU : Source.DIRECT;
    const weights = grantees.map((grantee, i) => pick[grantee]);
    const grantee = weightedPick(granteeIndexes, weights);
    const symbol = {
      id: lastSymbolId,
      token,
      you: false,
      source,
      grantee,
      startTime: elapsed + getRandomNumberInRange(-0.1, 0.1),
      yJitter: getRandomNumberInRange(-15, 15),
    };

    lastSymbolId = ++lastSymbolId & (VIZ_MAX_SYMBOLS - 1);

    return symbol;
  };

  const generateSymbolEth = (elapsed: number, dataset: any) => {
    const pick = weightedPick(
      dataset,
      dataset.map((d) => d.weight)
    );
    const token = Token.ETH;
    const source = Source.MATCHING;
    const weights = grantees.map((grantee, i) => pick[grantee]);
    const grantee = weightedPick(granteeIndexes, weights);
    const symbol = {
      id: lastSymbolId,
      token,
      you: pick.source === "you",
      source,
      grantee,
      startTime: elapsed + getRandomNumberInRange(-0.1, 0.1),
      yJitter: getRandomNumberInRange(-15, 15),
    };

    lastSymbolId = ++lastSymbolId & (VIZ_MAX_SYMBOLS - 1);

    return symbol;
  };

  const updateSymbols = (elapsed) => {
    const xProgressAccessor = (d) =>
      (elapsed - d.startTime) / VIZ_ANIMATION_DURATION;
    const usdcSymbols = symbolsGroup.current.selectAll(".usdc-symbol").data(
      symbols.filter((d) => xProgressAccessor(d) < 1 && d.token === Token.USDC),
      (d) => d.id
    );
    const ethSymbols = symbolsGroup.current.selectAll(".eth-symbol").data(
      symbols.filter((d) => xProgressAccessor(d) < 1 && d.token === Token.ETH),
      (d) => d.id
    );

    usdcSymbols.exit().remove();
    ethSymbols.exit().remove();

    d3.selectAll(".symbol")
      .style("transform", (d) => {
        const x = xScale(xProgressAccessor(d));
        const yStart = startYScale(d.source);
        const yEnd = endYScale(d.grantee);
        const yChange = yEnd - yStart;
        const yProgress = yTransitionProgressScale(xProgressAccessor(d));
        const y = yStart + yChange * yProgress + d.yJitter;
        return `translate(${x}px, ${y}px)`;
      })
      .transition()
      .duration(50)
      .style("opacity", (d) => (xScale(xProgressAccessor(d)) < 10 ? 0 : 1));
  };

  const enterSymbol = (elapsed, dataset, token: Token) => {
    symbols.push(
      token === Token.USDC
        ? generateSymbolUsdc(elapsed, dataset)
        : generateSymbolEth(elapsed, dataset)
    );

    const symbol = symbols[symbols.length - 1];
    const tokenSymbols = symbolsGroup.current
      .selectAll(token === Token.USDC ? ".usdc-symbol" : ".eth-symbol")
      .data(
        symbols.filter((d) => d.token === token),
        (d) => d.id
      );

    tokenSymbols
      .enter()
      .append("svg:image")
      .attr(
        "class",
        `symbol ${token === Token.USDC ? "usdc-symbol" : "eth-symbol"}`
      )
      .attr(
        "xlink:href",
        token === Token.USDC && symbol.source === Source.YOU
          ? usdcLight
          : token === Token.USDC
          ? usdcDark
          : symbol.you
          ? ethLight
          : ethDark
      )
      .attr("width", 16)
      .attr("height", 16)
      .attr("y", -10)
      .attr("x", -10)
      .style("opacity", 0);

    if (symbols.length > VIZ_MAX_SYMBOLS) {
      symbols.splice(0, VIZ_MAX_SYMBOLS / 2);
    }
  };

  const perSecondToPerMonth = (amount) => amount * 2628000;

  const symbolsPerSecondToUsdc = (symbolsPerSecond) =>
    totalUsdc /
    (symbolsPerSecond *
      ((datasetUsdc[0].weight + datasetUsdc[1].weight) / 100));

  const symbolsPerSecondToEth = (symbolsPerSecond) =>
    totalMatching / symbolsPerSecond;

  const findBottomRange = (amount) =>
    Math.pow(10, Math.floor(Math.log10(amount)));

  const amountToSymbolsPerSecond = (amount, inputRange, outputRange) => {
    const slope =
      (outputRange[1] - outputRange[0]) / (inputRange[1] - inputRange[0]);

    return outputRange[0] + slope * (amount - inputRange[0]);
  };

  return (
    <>
      <div className="d-flex">
        <div
          className="text-white position-relative"
          style={{ width: 160, height: dimensions.height }}
        >
          <Card
            className="position-absolute bg-primary border-0 rounded-end-0 px-2 py-1 text-white"
            style={{
              top: startYScale(0) - 100,
              width: 160,
              height: dimensions.pathHeight,
            }}
          >
            <Card.Title className="p-0 border-0 fs-3">You</Card.Title>
            <Card.Body className="p-0 fs-6">
              <div className="d-flex align-items-center gap-1">
                <Image src={usdcWhite} alt="usdc" width={16} />
                <span
                  className="w-75 rounded-1 px-1 bg-primary text-white"
                  style={{
                    background:
                      "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
                  }}
                >
                  {parseFloat(perSecondToPerMonth(totalYou).toFixed(2))}
                </span>
                <span className="w-25">monthly</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <Image src={usdcWhite} alt="usdc" width={16} />
                <span
                  className="w-75 rounded-1 px-1 bg-primary text-white"
                  style={{
                    background:
                      "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
                  }}
                >
                  {parseFloat((perSecondToPerMonth(totalYou) * 12).toFixed(2))}{" "}
                </span>
                <span className="w-25"> total</span>
              </div>
            </Card.Body>
          </Card>
          <Card
            className="position-absolute bg-secondary border-0 rounded-end-0 px-2 py-1 text-white"
            style={{
              top: startYScale(1) - 100,
              width: 160,
              height: dimensions.pathHeight,
            }}
          >
            <Card.Title className="p-0 border-0 fs-4 mb-3">
              Direct Funders
            </Card.Title>
            <Card.Body className="p-0 fs-6">
              <div className="d-flex align-items-center gap-1">
                <Image src={usdcWhite} alt="usdc" width={16} />
                <span
                  className="w-75 rounded-1 px-1 bg-secondary text-white"
                  style={{
                    background:
                      "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
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
                    background:
                      "linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25))",
                  }}
                >
                  {parseFloat(
                    (perSecondToPerMonth(totalDirect) * 12).toFixed(2)
                  )}{" "}
                </span>
                <span className="w-25"> total</span>
              </div>
            </Card.Body>
          </Card>
          <Card
            className="position-absolute bg-slate border-0 rounded-end-0 px-2 py-1 text-white"
            style={{
              top: startYScale(2) - 100,
              width: 160,
              height: dimensions.pathHeight,
            }}
          >
            <Card.Title className="p-0 border-0 fs-4 mb-3">
              Quadratic Matching
            </Card.Title>
            <Card.Body className="p-0 fs-6">
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
          </Card>
          <Card
            className="position-absolute bg-blue text-white mt-4 px-2"
            style={{ width: 340, bottom: 116 }}
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
        <svg width={dimensions.width} height={dimensions.height} ref={svgRef} />
        <div
          className="d-flex flex-column text-white position-relative"
          style={{ width: 220, height: dimensions.height }}
        >
          {grantees.map((grantee, i) => (
            <div
              className="d-flex border bg-blue border-0 rounded-end-2 px-2 py-1"
              style={{
                position: "absolute",
                top: endYScale(i) - 100,
                width: 220,
                height: dimensions.pathHeight,
              }}
              key={i}
            >
              <Button
                variant="success"
                className="p-1 text-white"
                onClick={() => {}}
              >
                +
              </Button>
              <Container className="px-2">
                <Row className="p-0">{grantee}</Row>
                <Row className="d-flex align-items-center gap-1 fs-6 m-0 p-0">
                  <Col className="bg-primary w-33 rounded-1 px-1">
                    {parseFloat(
                      perSecondToPerMonth(
                        (totalYou * datasetUsdc[0][grantee]) / 100
                      ).toFixed(2)
                    )}{" "}
                  </Col>
                  <Col className="bg-secondary w-33 rounded-1 px-1">
                    {parseFloat(
                      perSecondToPerMonth(
                        (totalDirect * datasetUsdc[1][grantee]) / 100
                      ).toFixed(2)
                    )}{" "}
                  </Col>
                  <Col className="bg-info w-33 rounded-1 px-1">
                    {parseFloat(
                      perSecondToPerMonth(
                        totalMatching * datasetEth[0][grantee] +
                          (totalMatching * datasetEth[1][grantee]) / 100
                      ).toFixed(2)
                    )}{" "}
                  </Col>
                  monthly
                </Row>
              </Container>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
