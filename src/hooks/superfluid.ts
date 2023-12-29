import { useState, useEffect } from "react";
import {
  Framework,
  NativeAssetSuperToken,
  WrapperSuperToken,
  Operation,
} from "@superfluid-finance/sdk-core";
import { useAccount, useNetwork } from "wagmi";
import { useEthersSigner, useEthersProvider } from "./ethersAdapters";

export default function useSuperfluid(tokenAddress: string) {
  const [sfFramework, setSfFramework] = useState<Framework>();
  const [superToken, setSuperToken] = useState<
    NativeAssetSuperToken | WrapperSuperToken
  >();
  const [flowRate, setFlowRate] = useState("0");
  const [startingSuperTokenBalance, setStartingSuperTokenBalance] = useState({
    availableBalance: "0",
    timestamp: 0,
  });

  const { chain } = useNetwork();
  const { address } = useAccount();
  const signer = useEthersSigner();
  const provider = useEthersProvider();

  useEffect(() => {
    (async () => {
      if (!address || !chain) {
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
      const flowInfo = await superToken.getAccountFlowInfo({
        account: address,
        providerOrSigner: provider,
      });
      const timestamp = (Date.now() / 1000) | 0;
      const { availableBalance, timestamp: startingDate } =
        await superToken.realtimeBalanceOf({
          account: address,
          providerOrSigner: provider,
          timestamp,
        });

      setSuperToken(superToken);
      setSfFramework(sfFramework);
      setFlowRate(flowInfo.flowRate);
      setStartingSuperTokenBalance({
        availableBalance,
        timestamp: (new Date(startingDate).getTime() / 1000) | 0,
      });
    })();
  }, []);

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

  const execTransaction = async (op: Operation) => {
    if (!signer) {
      throw Error("No signer was found");
    }

    const tx = await op.exec(signer);

    await tx.wait();
  };

  return {
    sfFramework,
    startingSuperTokenBalance,
    flowRate,
    wrap,
    createFlow,
    updateFlow,
  };
}
