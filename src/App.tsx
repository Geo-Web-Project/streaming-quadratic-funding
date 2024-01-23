import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { optimism, optimismSepolia } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import Layout from "./components/Layout";
import StreamingQuadraticFunding from "./components/StreamingQuadraticFunding";
import { AlloContextProvider } from "./context/Allo";
import { RPC_URLS_HTTP, WALLET_CONNECT_PROJECT_ID } from "./lib/constants";
import "@rainbow-me/rainbowkit/styles.css";
import "./App.scss";

const { chains, publicClient } = configureChains(
  [import.meta.env.MODE === "mainnet" ? optimism : optimismSepolia],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: RPC_URLS_HTTP[chain.id],
      }),
    }),
  ]
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
  uri:
    import.meta.env.MODE === "mainnet"
      ? "https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-optimism-mainnet"
      : "https://optimism-sepolia.subgraph.x.superfluid.dev",
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
