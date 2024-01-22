import { useState, useEffect } from "react";
import {
  Framework,
  NativeAssetSuperToken,
  WrapperSuperToken,
  Operation,
  Host,
} from "@superfluid-finance/sdk-core";
import { useNetwork } from "wagmi";
import { encodeFunctionData, hexToBigInt, Address } from "viem";
import { useEthersSigner, useEthersProvider } from "./ethersAdapters";
import useAllo from "./allo";
import { gdaAbi } from "../lib/abi/gda";
import {
  SUPERFLUID_HOST_ADDRESS,
  USDCX_ADDRESS,
  GDA_CONTRACT_ADDRESS,
} from "../lib/constants";

export default function useSuperfluid(
  tokenAddress: string,
  accountAddress?: string
) {
  const [sfFramework, setSfFramework] = useState<Framework>();
  const [superToken, setSuperToken] = useState<
    NativeAssetSuperToken | WrapperSuperToken
  >();
  const [accountFlowRate, setAccountFlowRate] = useState("0");
  const [underlyingTokenAllowance, setUnderlyingTokenAllowance] = useState("0");
  const [startingSuperTokenBalance, setStartingSuperTokenBalance] = useState({
    availableBalance: "0",
    timestamp: 0,
  });

  const signer = useEthersSigner();
  const provider = useEthersProvider();
  const { chain } = useNetwork();
  const { gdaPool } = useAllo();

  const host = new Host(SUPERFLUID_HOST_ADDRESS);

  useEffect(() => {
    (async () => {
      if (!chain || !accountAddress) {
        return;
      }

      let superToken: NativeAssetSuperToken | WrapperSuperToken | null = null;

      const sfFramework = await Framework.create({
        chainId: chain.id,
        provider,
      });

      if (tokenAddress === "ETHx") {
        superToken = await sfFramework.loadNativeAssetSuperToken(tokenAddress);
      } else {
        superToken = await sfFramework.loadWrapperSuperToken(tokenAddress);
      }

      updateSfAccountInfo(superToken);

      setSuperToken(superToken);
      setSfFramework(sfFramework);
    })();
  }, [chain, accountAddress]);

  const updateSfAccountInfo = async (
    superToken: NativeAssetSuperToken | WrapperSuperToken
  ) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    if (!accountAddress) {
      throw Error("Could not find the account address");
    }

    const accountFlowRate = await superToken.getNetFlow({
      account: accountAddress,
      providerOrSigner: provider,
    });
    const timestamp = (Date.now() / 1000) | 0;
    const { availableBalance, timestamp: startingDate } =
      await superToken.realtimeBalanceOf({
        account: accountAddress,
        timestamp,
        providerOrSigner: provider,
      });

    const underlyingToken = superToken.underlyingToken;
    const underlyingTokenAllowance = await underlyingToken?.allowance({
      owner: accountAddress,
      spender: USDCX_ADDRESS,
      providerOrSigner: provider,
    });

    setAccountFlowRate(accountFlowRate);
    setUnderlyingTokenAllowance(underlyingTokenAllowance ?? "0");
    setStartingSuperTokenBalance({
      availableBalance,
      timestamp: (new Date(startingDate).getTime() / 1000) | 0,
    });
  };

  const getFlow = async (
    superToken: NativeAssetSuperToken | WrapperSuperToken,
    sender: string,
    receiver: string
  ) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    const flow = await superToken.getFlow({
      sender,
      receiver,
      providerOrSigner: provider,
    });

    return flow;
  };

  const getAllowance = async (owner: string, spender: string) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    const allowance = superToken.allowance({
      owner,
      spender,
      providerOrSigner: provider,
    });

    return allowance;
  };

  const wrap = async (amount: bigint) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    const op = superToken.upgrade({ amount: amount.toString() });

    await execTransaction(op);
  };

  const createFlow = async (
    sender: string,
    receiver: string,
    flowRate: string
  ) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    const op = superToken.createFlow({
      sender,
      receiver,
      flowRate,
    });

    await execTransaction(op);
  };

  const updateFlow = async (
    sender: string,
    receiver: string,
    flowRate: string
  ) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    const op = superToken.updateFlow({
      sender,
      receiver,
      flowRate,
    });

    await execTransaction(op);
  };

  const underlyingTokenApprove = async (amount: string) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    const underlyingToken = superToken.underlyingToken;

    if (!underlyingToken) {
      throw Error("Underlying token was not found");
    }

    const op = underlyingToken.approve({
      receiver: superToken.address,
      amount,
    });

    await execTransaction(op);
  };

  const execTransaction = async (op: Operation) => {
    if (!signer) {
      throw Error("No signer was found");
    }

    const tx = await op.exec(signer);

    await tx.wait();
  };

  const updatePermissions = async (
    flowOperator: string,
    flowRateAllowance: string
  ) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    const op = superToken.updateFlowOperatorPermissions({
      flowOperator,
      permissions: 7, // Create or update or delete
      flowRateAllowance,
    });

    await execTransaction(op);
  };

  const gdaGetFlowRate = async (account: Address) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    if (!gdaPool) {
      throw Error("Could not find GDA pool address");
    }

    const getFlowRateData = encodeFunctionData({
      abi: gdaAbi,
      functionName: "getFlowRate",
      args: [superToken.address as Address, account, gdaPool],
    });
    const res = await provider.call({
      to: GDA_CONTRACT_ADDRESS,
      data: getFlowRateData,
    });
    const flowRate = res ? hexToBigInt(res as `0x${string}`).toString() : "0";

    return flowRate;
  };

  const gdaDistributeFlow = async (flowRate: string) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    if (!accountAddress) {
      throw Error("Could not find the account address");
    }

    if (!gdaPool) {
      throw Error("Could not find GDA pool address");
    }

    const distributeFlowData = encodeFunctionData({
      abi: gdaAbi,
      functionName: "distributeFlow",
      args: [
        superToken.address as Address,
        accountAddress as Address,
        gdaPool,
        BigInt(flowRate),
        "0x",
      ],
    });
    const op = host.callAgreement(
      GDA_CONTRACT_ADDRESS,
      distributeFlowData,
      "0x",
      {}
    );

    await execTransaction(op);
  };

  return {
    sfFramework,
    superToken,
    startingSuperTokenBalance,
    accountFlowRate,
    underlyingTokenAllowance,
    updateSfAccountInfo,
    updatePermissions,
    gdaDistributeFlow,
    gdaGetFlowRate,
    getFlow,
    getAllowance,
    wrap,
    createFlow,
    updateFlow,
    underlyingTokenApprove,
  };
}
