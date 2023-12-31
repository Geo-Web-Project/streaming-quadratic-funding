import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { optimism, optimismGoerli } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import Layout from "./components/Layout";
import StreamingQuadraticFunding from "./components/StreamingQuadraticFunding";
import "@rainbow-me/rainbowkit/styles.css";
import "./App.scss";

const { chains, publicClient } = configureChains(
  [optimism, optimismGoerli],
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
          <Layout>
            <StreamingQuadraticFunding />
          </Layout>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}

export default App;
