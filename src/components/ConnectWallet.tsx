import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";

export default function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    className="text-white fw-bold w-100"
                    onClick={openConnectModal}
                  >
                    Connect Wallet
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button variant="danger fw-bold" onClick={openChainModal}>
                    Wrong network
                  </Button>
                );
              }
              return (
                <div className="d-flex align-items-center">
                  <Button
                    variant="purple"
                    onClick={openChainModal}
                    className="d-flex align-items-center rounded-3 rounded-end-0 p-2"
                  >
                    {chain.iconUrl && (
                      <Image
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                        width={24}
                      />
                    )}
                  </Button>
                  <Button
                    variant="purple"
                    className="rounded-3 rounded-start-0 p-2"
                    onClick={openAccountModal}
                  >
                    {account.displayName}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
