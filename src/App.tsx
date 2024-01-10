import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { optimismGoerli, baseGoerli } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import Layout from "./components/Layout";
import StreamingQuadraticFunding from "./components/StreamingQuadraticFunding";
import { AlloContextProvider } from "./context/Allo";
import "@rainbow-me/rainbowkit/styles.css";
import "./App.scss";

const { chains, publicClient } = configureChains(
  [optimismGoerli, baseGoerli],
  [alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_ID })]
);

const { connectors } = getDefaultWallets({
  appName: "Streaming Quadratic Funding",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

function App() {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          chains={chains}
          modalSize="compact"
          theme={darkTheme()}
        >
          <AlloContextProvider>
            <Layout>
              <StreamingQuadraticFunding />
            </Layout>
          </AlloContextProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}

export default App;
