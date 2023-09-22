import { BigNumber } from "@ijstech/eth-contract";
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
  offerIndex?: number;
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

export interface ProviderGroupQueue {
  pairAddress: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  offerPrice: string;
  startDate: number;
  endDate: number;
  state: string;
  allowAll: boolean;
  direct: boolean;
  offerIndex: BigNumber;
  addresses: IAllocation[];
  allocation: string;
  willGet: string;
}