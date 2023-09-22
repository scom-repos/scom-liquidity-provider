import Assets from '../assets';
import { tokenStore, ITokenObject, ChainNativeTokenByChainId, WETHByChainId } from '@scom/scom-token-list';
import { application } from '@ijstech/components';

export const fallbackUrl = Assets.fullPath('img/token-placeholder.svg');

export const getChainNativeToken = (chainId: number): ITokenObject => {
  return ChainNativeTokenByChainId[chainId];
}

export const getNetworkInfo = (chainId: number) => {
  const networkMap = application.store['networkMap'];
  return networkMap[chainId];
}

export const viewOnExplorerByAddress = (chainId: number, address: string) => {
  let network = getNetworkInfo(chainId);
  if (network && network.explorerAddressUrl) {
    let url = `${network.explorerAddressUrl}${address}`;
    window.open(url);
  }
}

export const getTokenDecimals = (chainId: number, address: string) => {
  const ChainNativeToken = getChainNativeToken(chainId);
  const tokenMap = tokenStore.getTokenMapByChainId(chainId);
  const tokenObject = (!address || address.toLowerCase() === WETHByChainId[chainId].address.toLowerCase()) ? ChainNativeToken : tokenMap[address.toLowerCase()];
  return tokenObject ? tokenObject.decimals : 18;
}

export const tokenSymbol = (chainId: number, address: string) => {
  if (!address) return '';
  const tokenMap = tokenStore.getTokenMapByChainId(chainId);
  let tokenObject = tokenMap[address.toLowerCase()];
  if (!tokenObject) {
    tokenObject = tokenMap[address];
  }
  return tokenObject ? tokenObject.symbol : '';
}

export * from './utils';
export * from './core';
