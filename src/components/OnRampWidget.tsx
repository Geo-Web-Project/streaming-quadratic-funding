import { Transak } from "@transak/transak-sdk";
import { useAccount } from "wagmi";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import CreditCardIcon from "../assets/credit-card.svg";
import { TRANSAK_API_KEY } from "../lib/constants";

export default function OnRampWidget() {
  const { address } = useAccount();

  return (
    <Button
      onClick={() => {
        const transak = new Transak({
          apiKey: TRANSAK_API_KEY,
          environment: Transak.ENVIRONMENTS.PRODUCTION,
          widgetHeight: "570px",
          network: "optimism",
          defaultFiatAmount: 30,
          fiatCurrency: "USD",
          countryCode: "US",
          walletAddress: address,
        });
        transak.init();
      }}
      className="d-flex justify-content-center gap-1 rounded-3 text-white fs-4"
    >
      <Image src={CreditCardIcon} alt="card" width={24} />
      Buy ETH
    </Button>
  );
}
