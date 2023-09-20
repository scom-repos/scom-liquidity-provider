import { INetworkConfig } from "@scom/scom-network-picker";
import { IWalletPlugin } from "@scom/scom-wallet-modal";

export interface ICommissionInfo {
  chainId: number;
  walletAddress: string;
  share: string;
}

export interface ILiquidityProvider {
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  wallets: IWalletPlugin[];
  networks: INetworkConfig[];
  showHeader?: boolean;
}

export interface IAllocation {
  address: string;
  allocation: string | number;
  oldAllocation?: string | number;
  allocationVal?: string | number;
  isOld?: boolean;
  isDuplicated?: boolean;
  invalid?: boolean;
}
