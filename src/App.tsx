import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { optimism, optimismGoerli } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import Layout from "./components/Layout";
import StreamingQuadraticFunding from "./components/StreamingQuadraticFunding";
import { AlloContextProvider } from "./context/Allo";
import { ALCHEMY_ID, WALLET_CONNECT_PROJECT_ID } from "./lib/constants";
import "@rainbow-me/rainbowkit/styles.css";
import "./App.scss";

const { chains, publicClient } = configureChains(
  [import.meta.env.MODE === "mainnet" ? optimism : optimismGoerli],
  [alchemyProvider({ apiKey: ALCHEMY_ID })]
);

const { connectors } = getDefaultWallets({
  appName: "Streaming Quadratic Funding",
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const apolloClient = new ApolloClient({
  uri: `https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-optimism-${
    import.meta.env.MODE === "mainnet" ? "mainnet" : "goerli"
  }`,

  cache: new InMemoryCache(),
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
          <ApolloProvider client={apolloClient}>
            <AlloContextProvider>
              <Layout>
                <StreamingQuadraticFunding />
              </Layout>
            </AlloContextProvider>
          </ApolloProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}

export default App;
