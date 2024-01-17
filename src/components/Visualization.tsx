import { useRef, useState, useMemo, useLayoutEffect, useEffect } from "react";
import {
  range,
  scaleLinear,
  line,
  select,
  selectAll,
  curveMonotoneX,
  merge,
  now,
  timer,
  interval,
  Timer,
} from "d3";
import { formatEther } from "viem";
import Stack from "react-bootstrap/Stack";
import FundingSources from "./FundingSources";
import Grantees from "./Grantees";
import ethLight from "../assets/eth-light.svg";
import ethDark from "../assets/eth-dark.svg";
import usdcLight from "../assets/usdc-light.svg";
import usdcDark from "../assets/usdc-dark.svg";
import {
  TransactionPanelState,
  Grantee,
  AllocationData,
  MatchingData,
} from "./StreamingQuadraticFunding";
import { weightedPick, getRandomNumberInRange, sqrtBigInt } from "../lib/utils";
import {
  MS_PER_SECOND,
  VIZ_ANIMATION_DURATION,
  VIZ_CARD_WIDTH_SOURCE,
  VIZ_CARD_WIDTH_GRANTEE,
} from "../lib/constants";

export interface VisualizationProps {
  transactionPanelState: TransactionPanelState;
  setTransactionPanelState: React.Dispatch<
    React.SetStateAction<TransactionPanelState>
  >;
  poolYou: Grantee[];
  poolDirect: Grantee[];
  poolMatching: Grantee[];
  userAllocationData: AllocationData[];
  directAllocationData: AllocationData[];
  matchingData: MatchingData;
}

export interface Dimensions {
  width: number;
  height: number;
  pathHeight: number;
}

interface Range {
  start: number;
  end: number;
}

interface Symbol {
  id: number;
  token: Token;
  you: boolean;
  source: Source;
  grantee: string;
  startTime: number;
  yJitter: number;
}

interface Dataset {
  token: Token;
  source: Source;
  weight: number;
  [key: string]: number;
}

enum Source {
  YOU,
  DIRECT,
  MATCHING,
}

enum Token {
  USDC,
  ETH,
}

const MAX_SYMBOLS = 512;
const MIN_SYMBOLS_PER_SECOND = 20;
const MAX_SYMBOLS_PER_SECOND = 60;
const symbols: Symbol[] = [];
const sources = ["you", "direct", "matching"];
const grantees = [
  "Gov4Git",
  "Open Source Observer",
  "Avelous Hacking",
  "OpSci",
  "OpenCann",
  "Blockscout",
];
const granteeIndexes = range(grantees.length);
const sourceIndexes = range(sources.length);

let lastSymbolId = 0;

export default function Visualization(props: VisualizationProps) {
  const {
    transactionPanelState,
    poolYou,
    poolDirect,
    poolMatching,
    userAllocationData,
    directAllocationData,
    matchingData,
  } = props;

  const [datasetUsdc, setDatasetUsdc] = useState<Dataset[] | null>(null);
  const [datasetEth, setDatasetEth] = useState<Dataset[] | null>(null);
  const [timerSymbolsEth, setTimerSymbolsEth] = useState<Timer | null>(null);
  const [timerSymbolsUsdc, setTimerSymbolsUsdc] = useState<Timer | null>(null);
  const [timerUpdateSymbols, setTimerUpdateSymbols] = useState<Timer | null>(
    null
  );
  const [timerStarted, setTimerStarted] = useState<number>();
  const [symbolsPerSecondUsdc, setSymbolsPerSecondUsdc] = useState(0);
  const [symbolsPerSecondEth, setSymbolsPerSecondEth] = useState(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const symbolsGroup = useRef<any>();

  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const dimensions: Dimensions = {
    width:
      transactionPanelState.show && screenWidth > 1980
        ? screenWidth / 2
        : transactionPanelState.show
        ? screenWidth / 2.5
        : screenWidth - (VIZ_CARD_WIDTH_SOURCE + VIZ_CARD_WIDTH_GRANTEE),
    height: screenHeight > 1080 ? 1000 : 750,
    pathHeight: 90,
  };

  const { xScale, startYScale, endYScale, yTransitionProgressScale } =
    useMemo(() => {
      const xScale = scaleLinear()
        .domain([0, 1])
        .range([0, dimensions.width])
        .clamp(true);
      const startYScale = scaleLinear()
        .domain([-1, sourceIndexes.length])
        .range([0, dimensions.height]);
      const endYScale = scaleLinear()
        .domain([-1, granteeIndexes.length])
        .range([0, dimensions.height]);
      const yTransitionProgressScale = scaleLinear()
        .domain([0.45, 0.55])
        .range([0, 1])
        .clamp(true);

      return {
        xScale,
        startYScale,
        endYScale,
        yTransitionProgressScale,
      };
    }, [transactionPanelState.show]);

  useLayoutEffect(() => {
    const svgElement = select(svgRef.current);
    const bounds = svgElement
      .append("g")
      .style("transform", `translateY(-60px)`);
    const linkLineGenerator = line()
      .x((_d, i) => i * (dimensions.width / 5))
      .y((d, i) => (i <= 2 ? startYScale(d[0]) : endYScale(d[1])))
      .curve(curveMonotoneX);
    const linkOptions = merge(
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
      .attr("d", (d: any) => linkLineGenerator(d))
      .attr("stroke-width", dimensions.pathHeight);

    symbolsGroup.current = bounds.append("g").attr("class", "symbols-group");

    return () => {
      bounds.remove();
    };
  }, [transactionPanelState.show]);

  useEffect(() => {
    let _timerSymbolsUsdc: Timer | null = null;
    let _timerSymbolsEth: Timer | null = null;
    let _timerUpdateSymbols: Timer | null = null;

    const flowRateUserAllocation = calcTotalFlowRate(
      userAllocationData.map((elem: AllocationData) => elem.flowRate)
    );
    const flowRateDirectAllocation =
      calcTotalFlowRate(
        directAllocationData.map((elem: AllocationData) => elem.flowRate)
      ) - flowRateUserAllocation;
    const flowRateMatching = calcTotalFlowRate([matchingData.flowRate]);

    const totalUsdc = flowRateUserAllocation + flowRateDirectAllocation;
    const datasetUsdc: Dataset[] = [
      {
        token: Token.USDC,
        source: Source.YOU,
        weight: flowRateUserAllocation / totalUsdc,
      },
      {
        token: Token.USDC,
        source: Source.DIRECT,
        weight: flowRateDirectAllocation / totalUsdc,
      },
    ];
    const datasetEth: Dataset[] = [
      {
        token: Token.ETH,
        source: Source.YOU,
        weight: 0,
      },
      {
        token: Token.ETH,
        source: Source.MATCHING,
        weight: 0,
      },
    ];

    for (const i in userAllocationData) {
      const weight =
        Number(formatEther(BigInt(userAllocationData[i].flowRate))) /
        flowRateUserAllocation;

      datasetUsdc[0][poolYou[i].name] = weight;
    }

    for (const i in directAllocationData) {
      const weight =
        Number(
          formatEther(
            BigInt(directAllocationData[i].flowRate) -
              BigInt(userAllocationData[i].flowRate)
          )
        ) / flowRateDirectAllocation;

      datasetUsdc[1][poolDirect[i].name] = weight;
    }

    let totalUserImpact = 0;

    for (const i in matchingData.members) {
      const userImpact = Number(
        formatEther(
          calcContributionImpactOnMatching(
            BigInt(userAllocationData[i].flowRate),
            BigInt(matchingData.flowRate),
            BigInt(matchingData.members[i].units),
            BigInt(matchingData.totalUnits)
          )
        )
      );

      const userWeight = userImpact / flowRateMatching;
      const directWeight =
        (Number(formatEther(BigInt(matchingData.members[i].flowRate))) -
          userImpact) /
        flowRateMatching;

      datasetEth[0][poolYou[i].name] = userWeight;
      datasetEth[1][poolDirect[i].name] = directWeight;
      totalUserImpact += userImpact;
    }

    datasetEth[0].weight = totalUserImpact / flowRateMatching;
    datasetEth[1].weight =
      (flowRateMatching - totalUserImpact) / flowRateMatching;

    const symbolsPerSecondUsdc = amountToSymbolsPerSecond(totalUsdc);
    const symbolsPerSecondEth = amountToSymbolsPerSecond(flowRateMatching);

    if (timerSymbolsUsdc && timerSymbolsEth && timerUpdateSymbols) {
      timerSymbolsUsdc.restart(
        (elapsed) => enterSymbol(elapsed, datasetUsdc, Token.USDC),
        MS_PER_SECOND / symbolsPerSecondUsdc,
        timerStarted
      );
      timerSymbolsEth.restart(
        (elapsed) => enterSymbol(elapsed, datasetEth, Token.ETH),
        MS_PER_SECOND / symbolsPerSecondEth,
        timerStarted
      );
      timerUpdateSymbols.restart(
        (elapsed) => updateSymbols(elapsed),
        0,
        timerStarted
      );
    } else {
      _timerSymbolsUsdc = interval(
        (elapsed) => enterSymbol(elapsed, datasetUsdc, Token.USDC),
        MS_PER_SECOND / symbolsPerSecondUsdc
      );
      _timerSymbolsEth = interval(
        (elapsed) => enterSymbol(elapsed, datasetEth, Token.ETH),
        MS_PER_SECOND / symbolsPerSecondEth
      );
      _timerUpdateSymbols = timer(updateSymbols);

      setTimerStarted(now());
      setTimerUpdateSymbols(_timerUpdateSymbols);
      setTimerSymbolsUsdc(_timerSymbolsUsdc);
      setTimerSymbolsEth(_timerSymbolsEth);
    }

    setDatasetUsdc(datasetUsdc);
    setDatasetEth(datasetEth);
    setSymbolsPerSecondUsdc(symbolsPerSecondUsdc);
    setSymbolsPerSecondEth(symbolsPerSecondEth);

    return () => {
      if (_timerSymbolsUsdc) {
        _timerSymbolsUsdc.stop();
      }

      if (_timerSymbolsEth) {
        _timerSymbolsEth.stop();
      }

      if (_timerUpdateSymbols) {
        _timerUpdateSymbols.stop();
      }
    };
  }, [
    poolYou,
    poolDirect,
    poolMatching,
    directAllocationData,
    userAllocationData,
    matchingData,
    transactionPanelState.show,
  ]);

  const generateSymbol = (
    elapsed: number,
    dataset: Dataset[],
    token: Token
  ) => {
    const pick = weightedPick(
      dataset,
      dataset.map((d: any) => d.weight)
    );
    const source =
      token === Token.USDC && pick.source === Source.YOU
        ? Source.YOU
        : token === Token.USDC
        ? Source.DIRECT
        : Source.MATCHING;
    const weights = grantees.map((grantee: string) => pick[grantee]);
    const grantee = weightedPick(granteeIndexes, weights);
    const symbol = {
      id: lastSymbolId,
      token,
      you: token === Token.ETH && pick.source === Source.YOU,
      source,
      grantee,
      startTime: elapsed + getRandomNumberInRange(-0.1, 0.1),
      yJitter: getRandomNumberInRange(-15, 15),
    };

    lastSymbolId = ++lastSymbolId & (MAX_SYMBOLS - 1);

    return symbol;
  };

  const updateSymbols = (elapsed: number) => {
    const xProgressAccessor = (symbol: Symbol) =>
      (elapsed - symbol.startTime) / VIZ_ANIMATION_DURATION;
    const symbolsUsdc = symbolsGroup.current.selectAll(".usdc-symbol").data(
      symbols.filter((d) => xProgressAccessor(d) < 1 && d.token === Token.USDC),
      (symbol: Symbol) => symbol.id
    );
    const symbolsEth = symbolsGroup.current.selectAll(".eth-symbol").data(
      symbols.filter((d) => xProgressAccessor(d) < 1 && d.token === Token.ETH),
      (symbol: Symbol) => symbol.id
    );

    symbolsUsdc.exit().remove();
    symbolsEth.exit().remove();

    selectAll(".symbol")
      .style("transform", (d: any) => {
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
      .style("opacity", (d: any) =>
        xScale(xProgressAccessor(d)) < 10 ? 0 : 1
      );
  };

  const enterSymbol = (elapsed: number, dataset: Dataset[], token: Token) => {
    symbols.push(generateSymbol(elapsed, dataset, token));

    const symbol = symbols[symbols.length - 1];
    const entries = symbolsGroup.current
      .selectAll(token === Token.USDC ? ".usdc-symbol" : ".eth-symbol")
      .data(
        symbols.filter((d: any) => d.token === token),
        (d: any) => d.id
      );

    entries
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

    if (symbols.length > MAX_SYMBOLS) {
      symbols.splice(0, MAX_SYMBOLS / 2);
    }
  };

  const mapAmountInRange = (
    amount: number,
    ranges: {
      input: Range;
      output: Range;
    }
  ) => {
    const { output, input } = ranges;
    const slope = (output.end - output.start) / (input.end - input.start);

    return output.start + slope * (amount - input.start);
  };

  const amountToSymbolsPerSecond = (amount: number) => {
    const startRange = findStartRange(amount);
    const endRange = startRange * 10;
    const symbolsPerSecond = mapAmountInRange(amount, {
      input: { start: startRange, end: endRange },
      output: {
        start: MIN_SYMBOLS_PER_SECOND / 2,
        end: MAX_SYMBOLS_PER_SECOND / 2,
      },
    });

    return symbolsPerSecond;
  };

  const findStartRange = (amount: number) =>
    Math.pow(10, Math.floor(Math.log10(amount)));

  const calcTotalFlowRate = (flowRates: `${number}`[]) =>
    flowRates.reduce(
      (acc: number, flowRate: string) =>
        acc + Number(formatEther(BigInt(flowRate))),
      0
    );

  const calcContributionImpactOnMatching = (
    contributionFlowRate: bigint,
    poolFlowRate: bigint,
    granteeUnits: bigint,
    totalUnits: bigint
  ) => {
    if (contributionFlowRate === BigInt(0)) {
      return BigInt(0);
    }

    const granteeUnitsWithoutContribution =
      (sqrtBigInt(granteeUnits * BigInt(1000)) -
        sqrtBigInt(contributionFlowRate)) **
        BigInt(2) /
      BigInt(1000);
    const userUnits = granteeUnits - granteeUnitsWithoutContribution;
    const contributionImpactOnMatching =
      (userUnits * poolFlowRate) / totalUnits;

    return contributionImpactOnMatching;
  };

  return (
    <>
      <Stack direction="horizontal">
        <FundingSources
          dimensions={dimensions}
          startYScale={startYScale}
          symbolsPerSecondAllocation={symbolsPerSecondUsdc}
          symbolsPerSecondMatching={symbolsPerSecondEth}
          {...props}
        />
        <svg width={dimensions.width} height={dimensions.height} ref={svgRef} />
        {datasetUsdc && datasetEth && (
          <Grantees
            dimensions={dimensions}
            endYScale={endYScale}
            grantees={grantees}
            descriptions={poolDirect.map((elem) => elem.description ?? "")}
            {...props}
          />
        )}
      </Stack>
    </>
  );
}
