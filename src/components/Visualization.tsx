// @ts-nocheck
import * as d3 from "d3";
import { useRef, useMemo, useLayoutEffect, useState } from "react";
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
import json from "../lib/funding.json";

enum Source {
  MATCHING,
  DIRECT,
  YOU,
}

enum Token {
  USDC,
  ETH,
}

let lastSymbolId = 0;

const symbols = [];
const tokens = ["usdc", "eth"];
const grantees = [
  "Gov4Git",
  "Open Source Observer",
  "Avelous Hacking",
  "OpSci",
  "OpenCann",
  "Blockscout",
];
const granteeIndexes = d3.range(grantees.length);
const sources = ["matching", "direct", "you"];
const sourceIndexes = d3.range(sources.length);
const dimensions = {
  width: 500,
  height: 750,
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

export default function Visualization() {
  const [dataset, setDataset] = useState(json);
  const [timerId, setTimerId] = useState(null);
  const [timerStarted, setTimerStarted] = useState(null);
  const [symbolsPerSecond, setSymbolsPerSecond] = useState(0);
  const [totalYou, setTotalYou] = useState(0.000004); // USDC
  const [totalDirect, setTotalDirect] = useState(0.0002 - totalYou); // USDC

  const ethPrice = 2000;
  const totalUsdc = totalYou + totalDirect;
  const totalMatching = totalUsdc / ethPrice; // ETH
  const totalNormalizedUsdc = totalUsdc + totalMatching * ethPrice;

  const symbolsPerSecondToUsdc = (symbolsPerSecond) =>
    totalUsdc /
    (symbolsPerSecond * ((dataset[0].weight + dataset[1].weight) / 100));
  const symbolsPerSecondToEth = (symbolsPerSecond) =>
    totalMatching / (symbolsPerSecond * (dataset[2].weight / 100));
  const usdcToSymbolsPerSecond = (amount) =>
    totalUsdc / amount / ((dataset[0].weight + dataset[1].weight) / 100);
  const ethToSymbolsPerSecond = (amount) =>
    totalMatching / amount / (dataset[2].weight / 100);
  const findBottomRange = (amount) =>
    Math.pow(10, Math.floor(Math.log10(amount)));
  const amountToSymbolsPerSecond = (amount, inputRange, outputRange) => {
    const slope =
      (outputRange[1] - outputRange[0]) / (inputRange[1] - inputRange[0]);
    return outputRange[0] + slope * (amount - inputRange[0]);
  };

  const [legend, setLegend] = useState({
    usdc: symbolsPerSecondToUsdc(symbolsPerSecond),
    eth: symbolsPerSecondToEth(symbolsPerSecond),
  });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const symbolsGroup = useRef(null);

  const { xScale, startYScale, endYScale, yTransitionProgressScale } =
    useMemo(() => {
      const xScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([0, dimensions.boundedWidth])
        .clamp(true);
      const startYScale = d3
        .scaleLinear()
        .domain([sourceIndexes.length, -1])
        .range([0, dimensions.boundedHeight]);
      const endYScale = d3
        .scaleLinear()
        .domain([granteeIndexes.length, -1])
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
    let _timerId = null;

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

    const bottomRange = findBottomRange(totalNormalizedUsdc);
    const topRange = bottomRange * 10;

    const symbolsPerSecond = amountToSymbolsPerSecond(
      totalNormalizedUsdc,
      [bottomRange, topRange],
      [20, 60]
    );
    const symbolEnterInterval = MS_PER_SECOND / symbolsPerSecond;
    console.log(symbolsPerSecond);

    setSymbolsPerSecond(symbolsPerSecond);
    setTimerStarted(d3.now());
    _timerId = d3.interval(
      (elapsed) => enterSymbols(elapsed, dataset),
      symbolEnterInterval
    );
    setTimerId(_timerId);
    d3.timer(updateSymbols);

    return () => {
      if (_timerId) {
        _timerId.stop();
      }

      bounds.remove("g");
    };
  }, []);

  const generateSymbol = (elapsed, dataset) => {
    const pick = weightedPick(
      dataset,
      dataset.map((d) => d.weight)
    );
    const token = tokens.indexOf(pick.token);
    const source = sources.indexOf(pick.source);
    const weights = grantees.map((grantee, i) => pick[grantee]);
    const grantee = weightedPick(granteeIndexes, weights);
    const symbol = {
      id: lastSymbolId,
      token,
      you:
        source === Source.MATCHING &&
        weightedPick([true, false], [pick.you, 100 - pick.you]),
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

  const enterSymbols = (elapsed, dataset) => {
    symbols.push(generateSymbol(elapsed, dataset));

    const symbol = symbols[symbols.length - 1];

    if (symbol.source === Source.DIRECT || symbol.source === Source.YOU) {
      const usdcSymbols = symbolsGroup.current.selectAll(".usdc-symbol").data(
        symbols.filter((d) => d.token === Token.USDC),
        (d) => d.id
      );
      usdcSymbols
        .enter()
        .append("svg:image")
        .attr("class", "symbol usdc-symbol")
        .attr("xlink:href", symbol.source === Source.YOU ? usdcLight : usdcDark)
        .attr("width", 16)
        .attr("height", 16)
        .attr("y", -10)
        .attr("x", -10)
        .style("opacity", 0);
    }

    if (symbol.source === Source.MATCHING) {
      const ethSymbols = symbolsGroup.current.selectAll(".eth-symbol").data(
        symbols.filter((d) => d.token === Token.ETH),
        (d) => d.id
      );
      ethSymbols
        .enter()
        .append("svg:image")
        .attr("class", "symbol eth-symbol")
        .attr("xlink:href", symbol.you ? ethLight : ethDark)
        .attr("x", -10)
        .attr("y", -10)
        .attr("width", 16)
        .attr("height", 16)
        .style("opacity", 0);
    }

    if (symbols.length > VIZ_MAX_SYMBOLS) {
      symbols.splice(0, VIZ_MAX_SYMBOLS / 2);
    }
  };

  const perSecondToPerMonth = (amount) => amount * 2628000;

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
              bottom: startYScale(0) + 30,
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
              bottom: startYScale(1) + 30,
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
              bottom: startYScale(2) + 30,
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
                  symbolsPerSecondToUsdc(symbolsPerSecond).toFixed(8)
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
                {symbolsPerSecondToEth(symbolsPerSecond)
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
                bottom: endYScale(i) + 30,
                width: 220,
                height: dimensions.pathHeight,
              }}
              key={i}
            >
              <Button
                variant="success"
                className="p-1 text-white"
                onClick={() => {
                  const value = 0.00001;
                  const prevYou = dataset[0].weight;
                  const percentIncrement = (value / totalNormalizedUsdc) * 100;
                  const _totalNormalizedUsdc = value + totalNormalizedUsdc;
                  const d = [...dataset];
                  d[0].weight += percentIncrement;
                  d[1].weight -= percentIncrement;
                  d[2].you += percentIncrement * 2;

                  const bottomRange = findBottomRange(_totalNormalizedUsdc);
                  const topRange = bottomRange * 10;

                  const symbolsPerSecond = amountToSymbolsPerSecond(
                    _totalNormalizedUsdc,
                    [bottomRange, topRange],
                    [20, 60]
                  );
                  const symbolEnterInterval = MS_PER_SECOND / symbolsPerSecond;
                  console.log(d[0].weight, symbolsPerSecond);

                  timerId.restart(
                    (elapsed) => enterSymbols(elapsed, d),
                    symbolEnterInterval,
                    timerStarted
                  );
                  setDataset(d);
                  setTotalYou(totalYou + value);
                  setSymbolsPerSecond(symbolsPerSecond);
                }}
              >
                +
              </Button>
              <Container className="px-2">
                <Row className="p-0">{grantee}</Row>
                <Row className="d-flex align-items-center gap-1 fs-6 m-0 p-0">
                  <Col className="bg-primary w-33 rounded-1 px-1">
                    {parseFloat(
                      perSecondToPerMonth(
                        (totalYou * dataset[0][grantee]) / 100
                      ).toFixed(2)
                    )}{" "}
                  </Col>
                  <Col className="bg-secondary w-33 rounded-1 px-1">
                    {parseFloat(
                      perSecondToPerMonth(
                        (totalDirect * dataset[1][grantee]) / 100
                      ).toFixed(2)
                    )}{" "}
                  </Col>
                  <Col className="bg-info w-33 rounded-1 px-1">
                    {parseFloat(
                      perSecondToPerMonth(
                        (totalMatching * dataset[2][grantee]) / 100
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
