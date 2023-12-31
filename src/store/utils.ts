import { ERC20ApprovalModel, IERC20ApprovalEventOptions, INetwork, Wallet } from '@ijstech/eth-wallet';
import getNetworkList from '@scom/scom-network-list';
import { application } from '@ijstech/components';
import { ChainNativeTokenByChainId, ITokenObject, tokenStore, WETHByChainId } from '@scom/scom-token-list';

export type ProxyAddresses = { [key: number]: string };
export class State {
  slippageTolerance: number = 0.5;
  transactionDeadline: number = 30;
  networkMap: { [key: number]: INetwork } = {};
  infuraId: string = '';
  proxyAddresses: ProxyAddresses = {};
  embedderCommissionFee: string = '0';
  rpcWalletId: string = '';
  approvalModel: ERC20ApprovalModel;
  customTokens?: Record<number, ITokenObject[]>;
  handleNextFlowStep:  (data: any) => Promise<void>;
  handleAddTransactions: (data: any) => Promise<void>;
  handleJumpToStep: (data: any) => Promise<void>;
  handleUpdateStepStatus: (data: any) => Promise<void>;

  constructor(options: any) {
    this.networkMap = getNetworkList();
    this.initData(options);
  }

  initRpcWallet(chainId: number) {
    if (this.rpcWalletId) {
      return this.rpcWalletId;
    }
    const clientWallet = Wallet.getClientInstance();
    const networkList: INetwork[] = Object.values(application.store?.networkMap || []);
    const instanceId = clientWallet.initRpcWallet({
      networks: networkList,
      defaultChainId: chainId,
      infuraId: application.store?.infuraId,
      multicalls: application.store?.multicalls
    });
    this.rpcWalletId = instanceId;
    if (clientWallet.address) {
      const rpcWallet = Wallet.getRpcWalletInstance(instanceId);
      rpcWallet.address = clientWallet.address;
    }
    return instanceId;
  }

  private initData(options: any) {
    if (options.infuraId) {
      this.infuraId = options.infuraId;
    }
    if (options.networks) {
      this.setNetworkList(options.networks, options.infuraId);
    }
    if (options.proxyAddresses) {
      this.proxyAddresses = options.proxyAddresses;
    }
    if (options.embedderCommissionFee) {
      this.embedderCommissionFee = options.embedderCommissionFee;
    }
  }

  private setNetworkList(networkList: INetwork[], infuraId?: string) {
    const wallet = Wallet.getClientInstance();
    this.networkMap = {};
    const defaultNetworkList = getNetworkList();
    const defaultNetworkMap = defaultNetworkList.reduce((acc, cur) => {
      acc[cur.chainId] = cur;
      return acc;
    }, {});
    for (let network of networkList) {
      const networkInfo = defaultNetworkMap[network.chainId];
      if (!networkInfo) continue;
      if (infuraId && network.rpcUrls && network.rpcUrls.length > 0) {
        for (let i = 0; i < network.rpcUrls.length; i++) {
          network.rpcUrls[i] = network.rpcUrls[i].replace(/{InfuraId}/g, infuraId);
        }
      }
      this.networkMap[network.chainId] = {
        ...networkInfo,
        ...network
      };
      wallet.setNetworkInfo(this.networkMap[network.chainId]);
    }
  }

  getProxyAddress(chainId?: number) {
    const _chainId = chainId || Wallet.getInstance().chainId;
    const proxyAddresses = this.proxyAddresses;
    if (proxyAddresses) {
      return proxyAddresses[_chainId];
    }
    return null;
  }

  getRpcWallet() {
    return this.rpcWalletId ? Wallet.getRpcWalletInstance(this.rpcWalletId) : null;
  }

  isRpcWalletConnected() {
    const wallet = this.getRpcWallet();
    return wallet?.isConnected;
  }

  getChainId() {
    const rpcWallet = this.getRpcWallet();
    return rpcWallet?.chainId;
  }

  async setApprovalModelAction(options: IERC20ApprovalEventOptions) {
    const approvalOptions = {
      ...options,
      spenderAddress: ''
    };
    let wallet = this.getRpcWallet();
    this.approvalModel = new ERC20ApprovalModel(wallet, approvalOptions);
    let approvalModelAction = this.approvalModel.getAction();
    return approvalModelAction;
  }

  setCustomTokens(tokens?: Record<number, ITokenObject[]>) {
    this.customTokens = tokens;
  }
  
  getTokenMapByChainId(chainId: number) {
    let tokenMap = tokenStore.getTokenMapByChainId(chainId);
    const customTokens = this.customTokens?.[chainId];
    if (customTokens) {
      customTokens.forEach(v => tokenMap[v.address.toLowerCase()] = { ...v });
    }
    return tokenMap;
  }

  getTokenDecimals(chainId: number, address: string) {
    const ChainNativeToken = ChainNativeTokenByChainId[chainId];
    const tokenMap = this.getTokenMapByChainId(chainId);
    const tokenObject = (!address || address.toLowerCase() === WETHByChainId[chainId].address.toLowerCase()) ? ChainNativeToken : tokenMap[address.toLowerCase()];
    return tokenObject ? tokenObject.decimals : 18;
  }
  
  tokenSymbol(chainId: number, address: string) {
    if (!address) return '';
    const tokenMap = this.getTokenMapByChainId(chainId);
    let tokenObject = tokenMap[address.toLowerCase()];
    if (!tokenObject) {
      tokenObject = tokenMap[address];
    }
    return tokenObject ? tokenObject.symbol : '';
  }
}

export function isClientWalletConnected() {
  const wallet = Wallet.getClientInstance();
  return wallet.isConnected;
}