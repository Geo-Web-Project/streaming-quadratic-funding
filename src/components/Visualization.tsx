// @ts-nocheck
import * as d3 from "d3";
import { useRef, useMemo, useLayoutEffect, useState } from "react";
import Card from "react-bootstrap/Card";
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
  width: 550,
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
  const [symbolsPerSecond, setSymbolsPerSecond] = useState(60);
  const [totalYou, setTotalYou] = useState(0.12); // USDC
  const [totalDirect, setTotalDirect] = useState(3 - totalYou); // USDC

  const ethPrice = 2000;
  const totalUsdc = totalYou + totalDirect;
  const totalMatching = 0.0015; // ETH
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

  const [legend, setLegend] = useState({
    usdc: symbolsPerSecondToUsdc(symbolsPerSecond),
    eth: symbolsPerSecondToEth(symbolsPerSecond),
  });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const symbolsGroup = useRef(null);

  const symbolEnterInterval = MS_PER_SECOND / symbolsPerSecond;

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
      .style(
        "transform",
        `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
      );
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

    setTimerStarted(d3.now());
    _timerId = d3.interval(
      (elapsed) => enterSymbols(elapsed, dataset),
      symbolEnterInterval
    );
    setTimerId(_timerId);
    d3.timer(updateSymbols);

    //  setTimeout(() => setDoUpdate(true), 6000);

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

  const perSecondToPerMonth = (amount) => amount * 60 * 60 * 24 * 30.4166666;

  return (
    <>
      <div className="d-flex">
        <div className="text-white" style={{ marginTop: 145, width: 160 }}>
          <div
            className="bg-primary border-0 rounded-start-2 p-1"
            style={{ height: dimensions.pathHeight }}
          >
            You
            <p className="fs-6">
              {parseFloat(perSecondToPerMonth(totalYou).toFixed(2))} USDC
              monthly
              <br />
              {parseFloat((perSecondToPerMonth(totalYou) * 12).toFixed(2))} USDC
              total
            </p>
          </div>
          <div
            className="bg-secondary border-0 rounded-start-2 border p-1"
            style={{ height: dimensions.pathHeight, marginTop: 105 }}
          >
            Direct
            <p className="fs-6">
              {parseFloat(perSecondToPerMonth(totalDirect).toFixed(2))} USDC
              monthly
              <br />
              {parseFloat(
                (perSecondToPerMonth(totalDirect) * 12).toFixed(2)
              )}{" "}
              USDC total
            </p>
          </div>
          <div
            className="bg-info border-0 rounded-start-2 p-1"
            style={{ height: dimensions.pathHeight, marginTop: 105 }}
          >
            Quadratic Matching
            <p className="fs-6">
              {parseFloat(perSecondToPerMonth(totalMatching).toFixed(2))} ETH
              monthly
              <br />
              {parseFloat(
                (perSecondToPerMonth(totalMatching) * 12).toFixed(2)
              )}{" "}
              ETH total
            </p>
          </div>
          <Card className="bg-blue text-white mt-4 px-2" style={{ width: 300 }}>
            <Card.Header className="text-secondary border-purple px-0 py-1">
              Legend
            </Card.Header>
            <Card.Body className="d-flex align-items-center px-0 py-2 fs-5">
              <Card.Img
                variant="start"
                src={usdcWhite}
                width={32}
                className="pe-1"
              />
              <Card.Text className="mb-0 me-3">
                = {symbolsPerSecondToUsdc(symbolsPerSecond)} USDCx
              </Card.Text>
              <Card.Img
                variant="start"
                className="m-0 p-0 pe-2"
                src={ethWhite}
                width={20}
              />
              <Card.Text className="mb-0">
                = {symbolsPerSecondToEth(symbolsPerSecond)} ETHx
              </Card.Text>
            </Card.Body>
          </Card>
        </div>
        <svg width={dimensions.width} height={dimensions.height} ref={svgRef} />
        <div
          className="d-flex flex-column text-white"
          style={{ marginTop: 66, width: 220 }}
        >
          {grantees.map((grantee, i) => (
            <div
              className="border bg-blue border-0 rounded-end-2 px-1 py-1"
              style={{
                height: dimensions.pathHeight,
                marginTop: i === 0 ? 0 : 25 + i / 4,
              }}
              key={i}
            >
              {grantee}
              <div className="d-flex align-items-center  gap-1 fs-6">
                <div className="bg-primary w-33 rounded-1 px-1">
                  {parseFloat(
                    perSecondToPerMonth(
                      (totalYou * dataset[0][grantee]) / 100
                    ).toFixed(2)
                  )}{" "}
                </div>
                <div className="bg-secondary w-33 rounded-1 px-1">
                  {parseFloat(
                    perSecondToPerMonth(
                      (totalDirect * dataset[1][grantee]) / 100
                    ).toFixed(2)
                  )}{" "}
                </div>
                <div className="bg-info w-33 rounded-1 px-1">
                  {parseFloat(
                    perSecondToPerMonth(
                      (totalMatching * dataset[2][grantee]) / 100
                    ).toFixed(2)
                  )}{" "}
                </div>
                monthly
              </div>
              {/*
              <form
                action="#"
                className="d-flex mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = Number(e.target[1].value);
                  const _dataset = [...dataset];
                  _dataset.forEach((d) => console.log(d[grantees[i]]));
                }}
              >
                <button>+</button>
                <input className="w-50" type="text" />
              </form>
                */}
            </div>
          ))}
        </div>
      </div>
      <div className="d-flex flex-column text-white">
        <label>Symbol per second</label>
        <input
          type="number"
          min="1"
          max="60"
          value={symbolsPerSecond}
          onChange={(e) => {
            const value = Number(e.target.value);
            const msInterval = MS_PER_SECOND / value;
            timerId.stop();
            setTimerId(
              d3.interval(
                (elapsed) => enterSymbols(elapsed, dataset),
                msInterval,
                timerStarted
              )
            );
            setSymbolsPerSecond(value);
            setLegend({
              usdc: symbolsPerSecondToUsdc(value),
              eth: symbolsPerSecondToEth(value),
            });
          }}
        />
        <label>USDC per symbol</label>
        <input
          type="number"
          min="66"
          max="4000"
          value={legend.usdc}
          onChange={(e) => {
            const value = Number(e.target.value);
            const symbolsPerSecond = usdcToSymbolsPerSecond(value);
            const msInterval = MS_PER_SECOND / symbolsPerSecond;
            timerId.stop();
            setTimerId(
              d3.interval(
                (elapsed) => enterSymbols(elapsed, dataset),
                msInterval,
                timerStarted
              )
            );
            setSymbolsPerSecond(symbolsPerSecond);
            setLegend({
              usdc: value,
              eth: symbolsPerSecondToEth(symbolsPerSecond),
            });
          }}
        />
        <label>ETH per symbol</label>
        <input
          type="number"
          min="0.016"
          max="2"
          step="0.001"
          value={legend.eth}
          onChange={(e) => {
            const value = Number(e.target.value);
            const symbolsPerSecond = ethToSymbolsPerSecond(value);
            const msInterval = MS_PER_SECOND / symbolsPerSecond;
            timerId.stop();
            setTimerId(
              d3.interval(
                (elapsed) => enterSymbols(elapsed, dataset),
                msInterval,
                timerStarted
              )
            );
            setSymbolsPerSecond(symbolsPerSecond);
            setLegend({
              usdc: symbolsPerSecondToUsdc(symbolsPerSecond),
              eth: value,
            });
          }}
        />
        <label>You (%)</label>
        <input
          type="number"
          min="0.1"
          max="100"
          value={dataset[0].weight}
          onChange={(e) => {
            const value = Number(e.target.value);
            const d = [...dataset];
            d[0].weight = value;
            d[1].weight = 100 - value;
            d[2].you = value * 2;
            timerId.stop();
            setTimerId(
              d3.interval(
                (elapsed) => enterSymbols(elapsed, d),
                symbolEnterInterval,
                timerStarted
              )
            );
            const _totalYou = totalNormalizedUsdc * (value / 100);
            setTotalYou(_totalYou);
            setTotalDirect(totalUsdc - _totalYou);
            setDataset(d);
          }}
        />
      </div>
    </>
  );
}
