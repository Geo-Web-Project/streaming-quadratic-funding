import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "react-bootstrap/Button";

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
                    className="rounded-4 px-3 py-2"
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
