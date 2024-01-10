import { useState, useEffect } from "react";
import {
  Framework,
  NativeAssetSuperToken,
  WrapperSuperToken,
  Operation,
} from "@superfluid-finance/sdk-core";
import { useNetwork } from "wagmi";
import { useEthersSigner, useEthersProvider } from "./ethersAdapters";
import { USDCX_ADDRESS } from "../lib/constants";

export default function useSuperfluid(
  tokenAddress: string,
  accountAdress?: string
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

  const { chain } = useNetwork();
  const signer = useEthersSigner();
  const provider = useEthersProvider();

  useEffect(() => {
    (async () => {
      if (!chain || !accountAdress) {
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
  }, [chain, accountAdress]);

  const updateSfAccountInfo = async (
    superToken: NativeAssetSuperToken | WrapperSuperToken
  ) => {
    if (!superToken) {
      throw Error("Super Token was not initialized");
    }

    if (!accountAdress) {
      throw Error("Could not find the account address");
    }

    const accountFlowRate = await superToken.getNetFlow({
      account: accountAdress,
      providerOrSigner: provider,
    });
    const timestamp = (Date.now() / 1000) | 0;
    const { availableBalance, timestamp: startingDate } =
      await superToken.realtimeBalanceOf({
        account: accountAdress,
        timestamp,
        providerOrSigner: provider,
      });

    const underlyingToken = superToken.underlyingToken;
    const underlyingTokenAllowance = await underlyingToken?.allowance({
      owner: accountAdress,
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

  return {
    sfFramework,
    superToken,
    startingSuperTokenBalance,
    accountFlowRate,
    underlyingTokenAllowance,
    updateSfAccountInfo,
    updatePermissions,
    getFlow,
    wrap,
    createFlow,
    updateFlow,
    underlyingTokenApprove,
  };
}
