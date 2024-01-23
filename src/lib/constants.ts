export const MS_PER_SECOND = 1000;
export const VIZ_ANIMATION_DURATION = MS_PER_SECOND * 3;
export const VIZ_CARD_WIDTH_SOURCE = 200;
export const VIZ_CARD_WIDTH_GRANTEE = 250;
export const IPFS_GATEWAY = "https://gateway.ipfs.io/ipfs";
export const WALLET_CONNECT_PROJECT_ID = import.meta.env
  .VITE_WALLET_CONNECT_PROJECT_ID;
export const ALCHEMY_ID = import.meta.env.VITE_ALCHEMY_ID;
export const DAIX_ADDRESS = import.meta.env.VITE_DAIX_ADDRESS;
export const DAI_ADDRESS = import.meta.env.VITE_DAI_ADDRESS;
export const ETHX_ADDRESS = import.meta.env.VITE_ETHX_ADDRESS;
export const ALLO_CONTRACT_ADDRESS = import.meta.env.VITE_ALLO_CONTRACT_ADDRESS;
export const SUPERFLUID_HOST_ADDRESS = import.meta.env
  .VITE_SUPERFLUID_HOST_ADDRESS;
export const SUPERFLUID_RESOLVER_ADDRESS = import.meta.env
  .VITE_SUPERFLUID_RESOLVER_ADDRESS;
export const GDA_CONTRACT_ADDRESS = import.meta.env.VITE_GDA_CONTRACT_ADDRESS;
export const SQF_STRATEGY_ADDRESS = import.meta.env.VITE_SQF_STRATEGY_ADDRESS;
export const ALLO_POOL_ID = import.meta.env.VITE_ALLO_POOL_ID;
export const RPC_URLS_HTTP: Record<number, string> = {
  10: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`,
  11155420: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`,
};
