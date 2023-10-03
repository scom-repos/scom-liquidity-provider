import { IAllocation, ProviderGroupQueue, toWeiInv } from '../global/index';
import { BigNumber, Wallet, Utils } from '@ijstech/eth-wallet';
import {
  State,
  coreAddress,
  getChainNativeToken,
} from '../store/index';
import { Contracts } from "@scom/oswap-openswap-contract";
import { DefaultERC20Tokens, ITokenObject, WETHByChainId, tokenStore } from '@scom/scom-token-list';
import { nullAddress } from '@ijstech/eth-contract';

const ConfigStore = 'OSWAP_ConfigStore';

const getAddressFromCore = (chainId: number, key: string) => {
  let Address = getAddresses(chainId);
  return Address[key];
}

export function getAddresses(chainId: number) {
  return coreAddress[chainId] || {};
}

const getAddressByKey = (chainId: number, key: string) => {
  return getAddressFromCore(chainId, key);
}

function toTokenAmount(token: ITokenObject, amount: string | number) {
  return (BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount.toString())).shiftedBy(Number(token.decimals)).decimalPlaces(0, BigNumber.ROUND_FLOOR);
}

function toWei(amount: string | number) {
  return (BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount.toString())).shiftedBy(18).decimalPlaces(0);
}

const getQueueStakeToken = (chainId: number): ITokenObject | null => {
  if (!DefaultERC20Tokens[chainId]) return null;
  let stakeToken = DefaultERC20Tokens[chainId].find(v => v.symbol == 'OSWAP');
  return stakeToken ? { ...stakeToken, address: stakeToken.address!.toLowerCase() } : null;
}

const mapTokenObjectSet = (chainId: number, obj: any) => {
  const WETH9 = getWETH(chainId);
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (!obj[key]?.address) obj[key] = WETH9;
    }
  }
  return obj;
}

const getTokenObjectByAddress = (chainId: number, address: string) => {
  if (address.toLowerCase() === getAddressByKey(chainId, 'WETH9').toLowerCase()) {
    return getWETH(chainId);
  }
  let tokenMap = tokenStore.getTokenMapByChainId(chainId);
  return tokenMap[address.toLowerCase()];
}

const getWETH = (chainId: number): ITokenObject => {
  let wrappedToken = WETHByChainId[chainId];
  return wrappedToken;
}

const getFactoryAddress = (chainId: number) => {
  try {
    return getAddressFromCore(chainId, "OSWAP_RestrictedFactory");
  } catch (error) {
    console.log(`It seems that there are no factory in this network yet`);
  }
  return null;
}

const getLiquidityProviderAddress = (chainId: number) => {
  return getAddressByKey(chainId, "OSWAP_RestrictedLiquidityProvider");
}

const getPair = async (state: State, tokenA: ITokenObject, tokenB: ITokenObject) => {
  let pairAddress = '';
  try {
    const wallet = state.getRpcWallet();
    const chainId = state.getChainId();
    let tokens = mapTokenObjectSet(chainId, { tokenA, tokenB });
    let params = { param1: tokens.tokenA.address, param2: tokens.tokenB.address };
    let factoryAddress = getFactoryAddress(chainId);
    let groupQ = new Contracts.OSWAP_RestrictedFactory(wallet, factoryAddress);
    pairAddress = await groupQ.getPair({ ...params, param3: 0 });
  } catch (err) {}
  return pairAddress;
}

interface GroupQOffers {
  index: BigNumber[];
  provider: string[];
  lockedAndAllowAll: boolean[];
  receiving: BigNumber[];
  amountAndPrice: BigNumber[];
  startDateAndExpire: BigNumber[];
}

function breakDownGroupQOffers(offer: GroupQOffers) {
  //let {indexes, providers, lockeds, allowAlls, receivings, amounts, prices, startDates, endDates} = breakDownGroupQOffers(rawOffers);
  let amounts = offer.amountAndPrice.slice(0, offer.amountAndPrice.length / 2);
  let prices = offer.amountAndPrice.slice(offer.amountAndPrice.length / 2, offer.amountAndPrice.length);
  let startDates = offer.startDateAndExpire.slice(0, offer.startDateAndExpire.length / 2);
  let endDates = offer.startDateAndExpire.slice(offer.startDateAndExpire.length / 2, offer.startDateAndExpire.length);
  let lockeds = offer.lockedAndAllowAll.slice(0, offer.lockedAndAllowAll.length / 2);
  let allowAlls = offer.lockedAndAllowAll.slice(offer.lockedAndAllowAll.length / 2, offer.lockedAndAllowAll.length);
  return {
    indexes: offer.index,
    providers: offer.provider,
    lockeds,
    allowAlls,
    receivings: offer.receiving,
    amounts,
    prices,
    startDates,
    endDates,
  }
}

const getRestrictedPairCustomParams = async (state: State) => {
  const FEE_PER_ORDER = "RestrictedPair.feePerOrder";
  const FEE_PER_TRADER = "RestrictedPair.feePerTrader";
  const MAX_DUR = "RestrictedPair.maxDur";
  let wallet = state.getRpcWallet();
  const address = getAddressByKey(state.getChainId(), ConfigStore);
  const configStoreContract = new Contracts.OSWAP_ConfigStore(wallet, address);
  let feePerOrderRaw = await configStoreContract.customParam(Utils.stringToBytes32(FEE_PER_ORDER).toString());
  let feePerOrder = Utils.fromDecimals(feePerOrderRaw).toString();
  let feePerTraderRaw = await configStoreContract.customParam(Utils.stringToBytes32(FEE_PER_TRADER).toString());
  let feePerTrader = Utils.fromDecimals(feePerTraderRaw).toString();
  let maxDur = await configStoreContract.customParam(Utils.stringToBytes32(MAX_DUR).toString());
  maxDur = parseInt(maxDur, 16).toString();
  return {
    feePerOrder,
    feePerTrader,
    maxDur
  }
}

const getPairInfo = async (state: State, pairAddress: string, tokenAddress: string, offerIndex?: number) => {
  const wallet = state.getRpcWallet();
  const chainId = state.getChainId();
  const nativeToken = getChainNativeToken(chainId);
  const WETH9Address = getAddressByKey(chainId, 'WETH9');
  const _offerIndex = offerIndex ? new BigNumber(offerIndex) : new BigNumber(0)

  if (tokenAddress == nativeToken.symbol) tokenAddress = WETH9Address;
  const factoryAddress = getFactoryAddress(chainId);
  const factoryContract = new Contracts.OSWAP_RestrictedFactory(wallet, factoryAddress);
  const groupPair = new Contracts.OSWAP_RestrictedPair(wallet, pairAddress);
  let [token0Address, token1Address, pairIndex] = await Promise.all([
    groupPair.token0(),
    groupPair.token1(),
    factoryContract.pairIdx(pairAddress)
  ]);
  let token0 = getTokenObjectByAddress(chainId, token0Address);
  let token1 = getTokenObjectByAddress(chainId, token1Address);
  let token = getTokenObjectByAddress(chainId, tokenAddress);
  let directDirection = !(new BigNumber(token0Address.toLowerCase()).lt(token1Address.toLowerCase()));
  let direction = directDirection ? token1Address.toLowerCase() != tokenAddress.toLowerCase() : token0Address.toLowerCase() != tokenAddress.toLowerCase();
  let queueSize = (await groupPair.counter(direction)).toNumber();
  let rawOffers = await groupPair.getOffers({ direction, start: 0, length: queueSize });
  let { amounts, endDates } = breakDownGroupQOffers(rawOffers);


  let tokenDecimals = token.decimals;
  let now = new Date().getTime();
  let totalAmount = new BigNumber("0");

  let againstToken = (token0Address.toLowerCase() == tokenAddress.toLowerCase()) ? token1 : token0;
  for (let i = 0; i < amounts.length; i++) {
    if (now >= new Date(endDates[i].toNumber() * 1000).getTime()) continue;
    totalAmount = totalAmount.plus(amounts[i]);
  }

  let customParams = await getRestrictedPairCustomParams(state);

  let returnObj = {
    pairAddress: pairAddress.toLowerCase(),
    fromTokenAddress: token.address?.toLowerCase() == WETH9Address.toLowerCase() ? nativeToken.symbol : token.address?.toLowerCase(),
    toTokenAddress: againstToken.address?.toLowerCase() == WETH9Address.toLowerCase() ? nativeToken.symbol : againstToken.address?.toLowerCase(),
    pairIndex: pairIndex,
    ...customParams
  };


  if (offerIndex) {
    const getProviderQueuePairInfo = async function () {
      let againstTokenDecimals = againstToken.decimals;
      let [addresses, offer] = await Promise.all([
        getTradersAllocation(groupPair, direction, _offerIndex, tokenDecimals),
        groupPair.offers({ param1: direction, param2: _offerIndex })
      ]);
      const restrictedPrice = new BigNumber(offer.restrictedPrice).shiftedBy(-18).toFixed();
      return {
        amount: new BigNumber(offer.amount).shiftedBy(-Number(tokenDecimals)).toFixed(),
        reserve: new BigNumber(offer.receiving).shiftedBy(-Number(againstTokenDecimals)).toFixed(),
        startDate: new Date(offer.startDate.toNumber() * 1000),
        expire: new Date(offer.expire.toNumber() * 1000),
        locked: offer.locked,
        allowAll: offer.allowAll,
        offerPrice: toWeiInv(restrictedPrice).shiftedBy(-18).toFixed(),
        addresses
      }
    }
    let providerQueuePairInfo = await getProviderQueuePairInfo();
    returnObj = { ...returnObj, ...providerQueuePairInfo };
  }

  return returnObj;
}

async function getGroupQueueInfo(state: State, pairAddress: string, token0: ITokenObject, token1: ITokenObject, offerIndex: number) {
  const wallet = state.getRpcWallet();
  const chainId = state.getChainId();
  const WETH9Address = getAddressByKey(chainId, 'WETH9');
  const nativeToken = getChainNativeToken(chainId);
  const groupPair = new Contracts.OSWAP_RestrictedPair(wallet, pairAddress);
  let inverseDirection = new BigNumber(token0.address.toLowerCase()).lt(token1.address.toLowerCase());
  let direction = !inverseDirection;
  const offer = await groupPair.offers({ param1: direction, param2: offerIndex});
  let totalAllocation = new BigNumber('0');
  let addresses: IAllocation[] = await getTradersAllocation(groupPair, direction, offerIndex, token0.decimals, (address: string, allocation: string) => {
    totalAllocation = totalAllocation.plus(allocation);
  });
  let price = toWeiInv(new BigNumber(offer.restrictedPrice).shiftedBy(-18).toFixed()).shiftedBy(-18).toFixed();
  let data = {
    pairAddress: pairAddress.toLowerCase(),
    fromTokenAddress: token0.address.toLowerCase() == WETH9Address.toLowerCase() ? nativeToken.symbol : token0.address.toLowerCase(),
    toTokenAddress: token1.address.toLowerCase() == WETH9Address.toLowerCase() ? nativeToken.symbol : token1.address.toLowerCase(),
    amount: new BigNumber(offer.amount).shiftedBy(-token0.decimals).toFixed(),
    offerPrice: price,
    startDate: offer.startDate.toNumber() * 1000,
    endDate: offer.expire.toNumber() * 1000,
    state: offer.locked ? 'Locked' : 'Unlocked',
    allowAll: offer.allowAll,
    direct: true,
    offerIndex: offerIndex,
    addresses,
    allocation: totalAllocation.toFixed(),
    willGet: new BigNumber(offer.amount).times(new BigNumber(price)).shiftedBy(-Number(token0.decimals)).toFixed()
  };
  return data;
}

const getToBeApprovedTokens = async (chainId: number, tokenObj: ITokenObject, amount: string, stake: string) => {
  const WETH9Address = getAddressByKey(chainId, 'WETH9');
  let tokens = mapTokenObjectSet(chainId, { tokenObj });
  let tokenList: string[] = [];
  const liqProviderAddress = getLiquidityProviderAddress(chainId);
  // Check token in allowance
  if (tokens.tokenObj.address.toLowerCase() != WETH9Address.toLowerCase()) {
    let allowance = await getTokenAllowance(tokens.tokenObj.address, tokens.tokenObj.decimals, liqProviderAddress);
    if (new BigNumber(amount).gt(allowance)) tokenList.push(tokens.tokenObj.address.toLowerCase());
  }

  // Check stake token allowance
  if (new BigNumber(stake).gt(0)) {
    let StakeToken = getQueueStakeToken(chainId);
    if (!StakeToken || !StakeToken.address) return tokenList;
    let allowance = await getTokenAllowance(StakeToken.address, StakeToken.decimals, liqProviderAddress);
    if (new BigNumber(stake).gt(allowance)) tokenList.push(StakeToken.address.toLowerCase());

    // If stake token is also token in
    if (tokens.tokenObj.address.toLowerCase() == StakeToken.address.toLowerCase()) {
      if (new BigNumber(stake).plus(amount).gt(allowance)) tokenList.push(StakeToken.address.toLowerCase());
    }
  }
  return tokenList;
}

const getTokenAllowance = async (tokenAddress: string, tokenDecimals: number, contractAddress: string) => {
  let wallet = Wallet.getClientInstance();
  const selectedAddress = wallet.address;
  const ERC20 = new Contracts.ERC20(wallet, tokenAddress);
  let allowance = await ERC20.allowance({ owner: selectedAddress, spender: contractAddress });
  return allowance.shiftedBy(-tokenDecimals);
}

const addLiquidity = async (chainId: number, tokenA: ITokenObject, tokenB: ITokenObject, tokenIn: ITokenObject, pairIndex: number, offerIndex: number, amountIn: number, allowAll: boolean, restrictedPrice: string, startDate: number, expire: number, deadline: number, whitelistAddress: IAllocation[]) => {
  let receipt;
  let trader: string[] = []
  let allocation: BigNumber[] = []
  type AddLiquidityETHParam = {
    tokenA: string;
    addingTokenA: boolean;
    pairIndex: number | BigNumber;
    offerIndex: number | BigNumber;
    amountAIn: number | BigNumber;
    allowAll: boolean;
    restrictedPrice: number | BigNumber;
    startDate: number | BigNumber;
    expire: number | BigNumber;
    deadline: number | BigNumber;
  }

  whitelistAddress.map(v => {
    if (v.allocation != v.oldAllocation) {
      trader.push(v.address)
      allocation.push(toTokenAmount(tokenIn, v.allocation))
    }
  })

  // Only add traders for gas efficiency
  /*if (new BigNumber(amountIn).eq(0) && offerIndex != 0 ) {
    let restrictedPair = new Contracts.OSWAP_RestrictedPair(wallet, pairAddress)
    let erc20 = new Erc20(wallet , await restrictedPair.govToken())
    let feePerTrader = (await getRestrictedPairCustomParams()).feePerTrader
    let govAmount = new BigNumber(feePerTrader).times(trader.length).shiftedBy(18)
    let allowance = await erc20.allowance({owner: wallet.address, spender: pairAddress})
    if (allowance.gte(govAmount)){
      let addingTokenA = tokenA.address == tokenIn.address
      let direction = (new BigNumber(tokenA).lt(tokenB)) ? addingTokenA : !addingTokenA;
      console.log("checking", addingTokenA, direction, offerIndex, trader, allocation)
      receipt = await restrictedPair.setMultipleApprovedTraders({direction, offerIndex, trader, allocation})
      return receipt
    }
  }*/

  const liquidityContract = new Contracts.OSWAP_RestrictedLiquidityProvider1(Wallet.getClientInstance(), getLiquidityProviderAddress(chainId));

  const getReceipt = async (param: AddLiquidityETHParam, value?: number | BigNumber) => {
    if (trader.length == 0) {
      receipt = value !== undefined ? await liquidityContract.addLiquidityETH(param, value) : await liquidityContract.addLiquidityETH(param, 0);
    } else {
      const params: {
        param: (number | BigNumber)[];
        /* Liq Provider Contract
        function addLiquidityETH(
        address tokenA,
        bool addingTokenA,
        uint256 pairIndex,
        uint256 offerIndex,
        uint256 amountAIn,
        bool allowAll,
        uint256 restrictedPrice,
        uint256 startDate,
        uint256 expire,
        uint256 deadline)*/
        trader: string[];
        allocation: (number | BigNumber)[];
      } = {
        param: [
          new BigNumber(param.tokenA.toLowerCase()),
          param.addingTokenA ? 1 : 0,
          param.pairIndex,
          param.offerIndex,
          param.amountAIn,
          param.allowAll ? 1 : 0,
          param.restrictedPrice,
          param.startDate,
          param.expire,
          param.deadline
        ],
        trader,
        allocation
      };
      receipt = value !== undefined ? await liquidityContract.addLiquidityETHAndTrader(params, value) : await liquidityContract.addLiquidityETHAndTrader(params, 0);
    }
  }

  if (!tokenA.address || !tokenB.address) { // if the pair contain a native token
    let erc20Token = tokenA.address ? tokenA : tokenB;
    if (!tokenIn.address) { // if the incoming token is native
      getReceipt({
        tokenA: erc20Token.address!,
        addingTokenA: false,
        pairIndex,
        offerIndex,
        amountAIn: toWei(amountIn),
        allowAll,
        restrictedPrice: toWei(restrictedPrice),
        startDate,
        expire,
        deadline
      }, toWei(amountIn));
    } else {  // if the incoming token is not native
      getReceipt({
        tokenA: erc20Token.address!,
        addingTokenA: true,
        pairIndex,
        offerIndex,
        amountAIn: toTokenAmount(tokenIn, amountIn),
        allowAll: allowAll,
        restrictedPrice: toWei(restrictedPrice),
        startDate,
        expire,
        deadline
      });
    }
  } else {// if the pair does not contain a native token
    const paramObj = {
      tokenA: tokenA.address,
      tokenB: tokenB.address,
      addingTokenA: tokenA.address == tokenIn.address,
      pairIndex,
      offerIndex,
      amountIn: toTokenAmount(tokenIn, amountIn),
      allowAll,
      restrictedPrice: toWei(restrictedPrice),
      startDate,
      expire,
      deadline
    }
    if (trader.length == 0) {
      receipt = await liquidityContract.addLiquidity(paramObj);
    } else {
      const paramObj = {
        tokenA: tokenA.address,
        tokenB: tokenB.address,
        addingTokenA: tokenA.address == tokenIn.address ? 1 : 0,
        pairIndex,
        offerIndex,
        amountIn: toTokenAmount(tokenIn, amountIn),
        allowAll: allowAll ? 1 : 0,
        restrictedPrice: toWei(restrictedPrice),
        startDate,
        expire,
        deadline
      }
      const param: any = Object.values(paramObj);
      const params = { param, trader, allocation };
      receipt = await liquidityContract.addLiquidityAndTrader(params);
    }
  }
  return receipt;
}

const removeLiquidity = async (chainId: number, tokenA: ITokenObject, tokenB: ITokenObject, tokenOut: ITokenObject, amountOut: string, receivingOut: string, orderIndex: any, deadline: number) => {
  let address = getLiquidityProviderAddress(chainId);
  const toAddress = Wallet.getClientInstance().address;
  const liquidityProviderContract = new Contracts.OSWAP_RestrictedLiquidityProvider1(Wallet.getClientInstance(), address)
  let receivingToken = tokenA.address == tokenOut.address ? tokenB : tokenA;
  if (!amountOut) amountOut = '0';
  if (!receivingOut) receivingOut = '0';
  if (!tokenA.address || !tokenB.address) {
    let erc20Token = tokenA.address ? tokenA : tokenB;
    var receipt = await liquidityProviderContract.removeLiquidityETH({
      tokenA: erc20Token.address as string,
      removingTokenA: erc20Token == tokenOut,
      to: toAddress,
      pairIndex: 0, //TODO
      offerIndex: orderIndex,
      amountOut: toTokenAmount(tokenOut, amountOut),
      receivingOut: toTokenAmount(receivingToken, receivingOut),
      deadline
    });
  } else {
    var receipt = await liquidityProviderContract.removeLiquidity({
      tokenA: tokenA.address,
      tokenB: tokenB.address,
      removingTokenA: tokenA == tokenOut,
      to: toAddress,
      pairIndex: 0,
      offerIndex: orderIndex,
      amountOut: toTokenAmount(tokenOut, amountOut),
      receivingOut: toTokenAmount(receivingToken, receivingOut),
      deadline
    });
  }
  return receipt;
}


const lockGroupQueueOffer = async (chainId: number, pairAddress: string, tokenA: ITokenObject, tokenB: ITokenObject, offerIndex: number | BigNumber) => {
  const wallet = Wallet.getClientInstance();
  const WETH9Address = getAddressByKey(chainId, 'WETH9');

  // BigNumber constructor, only string values in hexadecimal literal form, e.g. '0xff' or '0xFF' (but not '0xfF') are valid
  const tokenInAddress = (tokenA?.address ?? WETH9Address).toLowerCase();
  const tokenOutAddress = (tokenB?.address ?? WETH9Address).toLowerCase();
  const direction = (new BigNumber(tokenInAddress).lt(tokenOutAddress)) ? false : true;
  const oraclePairContract = new Contracts.OSWAP_RestrictedPair(wallet, pairAddress);
  const receipt = await oraclePairContract.lockOffer({ direction, index: offerIndex });
  return receipt;
}

const convertWhitelistedAddresses = (inputText: string): IAllocation[] => {

  function splitByMultipleSeparator(input: string, separators: any[]): string[] {
    for (let i = 1; i < separators.length; i++) {
      input = input.replace(separators[i], separators[0])
    }
    return input.split(separators[0]).filter(text => text != "").map(v => v.trim())
  }

  let data: IAllocation[] = []
  let textArray = splitByMultipleSeparator(inputText, [",", /\s/g, ":", "="])

  if (textArray.length % 2 != 0) return []

  for (let i = 0; i < textArray.length; i += 2) {
    data.push({
      address: textArray[i],
      allocation: Number(textArray[i + 1])
    })
  }
  return data
}

async function getTradersAllocation(pair: Contracts.OSWAP_RestrictedPair, direction: boolean, offerIndex: number | BigNumber, allocationTokenDecimals: number, callbackPerRecord?: (address: string, allocation: string) => void) {
  let traderLength = (await pair.getApprovedTraderLength({ direction, offerIndex })).toNumber();
  let tasks: Promise<void>[] = [];
  let allo: IAllocation[] = [];

  for (let i = 0; i < traderLength; i += 100) {//get trader allocation
    tasks.push(
      (async () => {
        try {
          let approvedTrader = await pair.getApprovedTrader({ direction, offerIndex, start: i, length: 100 });
          allo.push(...approvedTrader.trader.map((address, i) => {
            let allocation = new BigNumber(approvedTrader.allocation[i]).shiftedBy(-allocationTokenDecimals).toFixed();
            if (callbackPerRecord) callbackPerRecord(address, allocation);
            return { address, allocation };
          }));
        } catch (error) {
          console.log("getTradersAllocation", error);
          return;
        }
      })());
  }
  await Promise.all(tasks);
  return allo;
}

async function isPairRegistered(state: State, tokenA: string, tokenB: string) {
  try {
    let oracleAddress = await new Contracts.OSWAP_RestrictedFactory(state.getRpcWallet(), getFactoryAddress(state.getChainId())).oracles({ param1: tokenA, param2: tokenB });
    return oracleAddress != nullAddress
  } catch (err) {}
  return false;
}

async function getOfferIndexes(state: State, pairAddress: string, tokenA: string, tokenB: string) {
  let indexes: BigNumber[] = [];
  try {
    const wallet = state.getRpcWallet();
    const chainId = state.getChainId();
    const provider = wallet.address;
    const pairContract = new Contracts.OSWAP_RestrictedPair(wallet, pairAddress);
    const WETH9Address = getAddressByKey(chainId, 'WETH9');
    let token0Address = tokenA.startsWith('0x') ? tokenA : WETH9Address;
    let token1Address = tokenB.startsWith('0x') ? tokenB : WETH9Address;
  
    let inverseDirection = new BigNumber(token0Address.toLowerCase()).lt(token1Address.toLowerCase());
    let direction = !inverseDirection;
    let rawOffers = await pairContract.getProviderOffer({ provider, direction, start: 0, length: 100 });
    indexes = rawOffers.index;
  } catch (err) {}
  return indexes;
}

export {
  getPair,
  isPairRegistered,
  getPairInfo,
  getToBeApprovedTokens,
  getLiquidityProviderAddress,
  addLiquidity,
  removeLiquidity,
  lockGroupQueueOffer,
  getQueueStakeToken,
  convertWhitelistedAddresses,
  getOfferIndexes,
  getGroupQueueInfo
}
