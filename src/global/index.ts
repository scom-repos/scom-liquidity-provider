import { Wallet } from '@ijstech/eth-wallet';

export * from './utils/index';

export const isAddressValid = async (address: string) => {
  let wallet: any = Wallet.getClientInstance();
  const isValid = wallet.web3.utils.isAddress(address);
  return isValid;
}

