import { toWeiInv } from '../global/index';
import { BigNumber, Wallet, Utils } from '@ijstech/eth-wallet';
import {
  State,
  coreAddress,
  getChainNativeToken,
} from '../store/index';
import { Contracts } from "@scom/oswap-openswap-contract";
import { Contracts as SolidityContracts } from "@scom/oswap-chainlink-contract"
import { DefaultERC20Tokens, ITokenObject, ToUSDPriceFeedAddressesMap, WETHByChainId, tokenPriceAMMReference, tokenStore } from '@scom/scom-token-list';
import { nullAddress } from '@ijstech/eth-contract';

const ConfigStore = 'OSWAP_ConfigStore';
const INFINITE = new BigNumber("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

export interface AllocationMap { address: string, allocation: string }

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

function toTokenAmount(token: any, amount: any) {
  return (BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount.toString())).shiftedBy(Number(token.decimals)).decimalPlaces(0, BigNumber.ROUND_FLOOR);
}

function toWei(amount: any) {
  return (BigNumber.isBigNumber(amount) ? amount : new BigNumber(amount.toString())).shiftedBy(18).decimalPlaces(0);
}

const getTokenPrice = async (chainId: number, token: string) => { // in USD value
  const wallet = Wallet.getClientInstance();
  let tokenPrice: number | string;

  // get price from price feed 
  let tokenPriceFeedAddress = ToUSDPriceFeedAddressesMap[chainId][token.toLowerCase()];
  if (tokenPriceFeedAddress) {
    const aggregatorProxy = new SolidityContracts.AggregatorProxy(wallet, tokenPriceFeedAddress);
    let tokenLatestRoundData = await aggregatorProxy.latestRoundData();
    let tokenPriceFeedDecimals = await aggregatorProxy.decimals();
    return new BigNumber(tokenLatestRoundData.answer).shiftedBy(-tokenPriceFeedDecimals).toFixed();
  }

  // get price from AMM
  let referencePair = tokenPriceAMMReference[chainId] && tokenPriceAMMReference[chainId][token.toLowerCase()]
  if (!referencePair) return null
  const pairContract = new Contracts.OSWAP_Pair(wallet, referencePair);
  let token0 = await pairContract.token0();
  let token1 = await pairContract.token1();
  let reserves = await pairContract.getReserves();
  let token0PriceFeedAddress = ToUSDPriceFeedAddressesMap[chainId] && ToUSDPriceFeedAddressesMap[chainId][token0.toLowerCase()];
  let token1PriceFeedAddress = ToUSDPriceFeedAddressesMap[chainId] && ToUSDPriceFeedAddressesMap[chainId][token1.toLowerCase()];

  if (token0PriceFeedAddress || token1PriceFeedAddress) {
    if (token0PriceFeedAddress) {
      const aggregatorProxy = new SolidityContracts.AggregatorProxy(wallet, token0PriceFeedAddress);
      let token0LatestRoundData = await aggregatorProxy.latestRoundData();
      let token0PriceFeedDecimals = await aggregatorProxy.decimals();
      let token0USDPrice = new BigNumber(token0LatestRoundData.answer).shiftedBy(-token0PriceFeedDecimals).toFixed();
      if (new BigNumber(token.toLowerCase()).lt(token0.toLowerCase())) {
        tokenPrice = new BigNumber(reserves.reserve1).div(reserves.reserve0).times(token0USDPrice).toFixed()
      } else {
        tokenPrice = new BigNumber(reserves.reserve0).div(reserves.reserve1).times(token0USDPrice).toFixed()
      }
    } else {
      const aggregatorProxy = new SolidityContracts.AggregatorProxy(wallet, token1PriceFeedAddress);
      let token1LatestRoundData = await aggregatorProxy.latestRoundData();
      let token1PriceFeedDecimals = await aggregatorProxy.decimals();
      let token1USDPrice = new BigNumber(token1LatestRoundData.answer).shiftedBy(-token1PriceFeedDecimals).toFixed();
      if (new BigNumber(token.toLowerCase()).lt(token1.toLowerCase())) {
        tokenPrice = new BigNumber(reserves.reserve1).div(reserves.reserve0).times(token1USDPrice).toFixed();
      } else {
        tokenPrice = new BigNumber(reserves.reserve0).div(reserves.reserve1).times(token1USDPrice).toFixed();
      }
    }
  } else {
    if (token0.toLowerCase() == token.toLowerCase()) {//for other reference pair
      let token1Price: string = await getTokenPrice(chainId, token1) || '';
      tokenPrice = new BigNumber(token1Price).times(reserves.reserve1).div(reserves.reserve0).toFixed();
    } else {
      let token0Price: string = await getTokenPrice(chainId, token0) || '';
      tokenPrice = new BigNumber(token0Price).times(reserves.reserve0).div(reserves.reserve1).toFixed();
    }
  }
  return tokenPrice
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
};

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

const getPair = async (chainId: number, tokenA: ITokenObject, tokenB: ITokenObject) => {
  const wallet = Wallet.getClientInstance();
  let tokens = mapTokenObjectSet(chainId, { tokenA, tokenB });
  let params = { param1: tokens.tokenA.address, param2: tokens.tokenB.address };
  let factoryAddress = getFactoryAddress(chainId);
  let groupQ = new Contracts.OSWAP_RestrictedFactory(wallet, factoryAddress);
  return await groupQ.getPair({ ...params, param3: 0 });
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

const getRestrictedPairCustomParams = async (chainId: number) => {
  const FEE_PER_ORDER = "RestrictedPair.feePerOrder";
  const FEE_PER_TRADER = "RestrictedPair.feePerTrader";
  const MAX_DUR = "RestrictedPair.maxDur";
  let wallet = Wallet.getClientInstance();
  const address = getAddressByKey(chainId, ConfigStore);
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

const getGroupQueuePairInfo = async (state: State, pairAddress: string, tokenAddress: string, provider?: string, offerIndex?: number) => {
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

  let customParams = await getRestrictedPairCustomParams(chainId);

  let returnObj = {
    pairAddress: pairAddress.toLowerCase(),
    fromTokenAddress: token.address?.toLowerCase() == WETH9Address.toLowerCase() ? nativeToken.symbol : token.address?.toLowerCase(),
    toTokenAddress: againstToken.address?.toLowerCase() == WETH9Address.toLowerCase() ? nativeToken.symbol : againstToken.address?.toLowerCase(),
    pairIndex: pairIndex,
    ...customParams
  };


  if (provider && offerIndex) {
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

const approveLPMax = async (chainId: number, tokenObj: ITokenObject, callback: any, confirmationCallback: any) => {
  let amount = INFINITE;
  let receipt = await new Contracts.ERC20(Wallet.getClientInstance(), tokenObj.address).approve({ spender: getLiquidityProviderAddress(chainId), amount });
  return receipt;
}

const getEstimatedAmountInUSD = async (chainId: number, tokenObj: ITokenObject, amount: string) => {
  let tokens = mapTokenObjectSet(chainId, { tokenObj });
  let tokenPrice = await getTokenPrice(chainId, tokens.tokenObj.address.toLowerCase())
  return tokenPrice != null ? new BigNumber(amount).times(tokenPrice).toFixed() : new BigNumber(amount).toFixed();
}

const approvePairMax = async (chainId: number, pairAddress: string, callback: any, confirmationCallback: any) => {
  let amount = INFINITE;
  let StakeToken = getQueueStakeToken(chainId);
  let receipt = await new Contracts.ERC20(Wallet.getClientInstance(), StakeToken!.address).approve({ spender: pairAddress, amount });
  return receipt;
}

const addLiquidityToGroupQueue = async (chainId: number, tokenA: ITokenObject, tokenB: ITokenObject, tokenIn: ITokenObject, pairIndex: number, offerIndex: number, amountIn: number, allowAll: boolean, restrictedPrice: string, startDate: number, expire: number, deadline: number, whitelistAddress: any[]) => {
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

export interface QueueBasicInfo {
  firstToken: string,
  secondToken: string,
  queueSize: BigNumber,
  topStake: BigNumber | undefined,
  totalOrder: BigNumber,
  totalStake: BigNumber | undefined,
  pairAddress: string,
  isOdd: boolean,
}

const convertGroupQueueWhitelistedAddresses = (inputText: string): { address: string, allocation: number }[] => {

  function splitByMultipleSeparator(input: string, separators: any[]): string[] {
    for (let i = 1; i < separators.length; i++) {
      input = input.replace(separators[i], separators[0])
    }
    return input.split(separators[0]).filter(text => text != "").map(v => v.trim())
  }

  let data: { address: string, allocation: number }[] = []
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
  let allo: AllocationMap[] = [];

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
  let oracleAddress = await new Contracts.OSWAP_RestrictedFactory(state.getRpcWallet(), getFactoryAddress(state.getChainId())).oracles({ param1: tokenA, param2: tokenB });
  return oracleAddress != nullAddress
}

export {
  getPair,
  isPairRegistered,
  getGroupQueuePairInfo,
  getToBeApprovedTokens,
  approveLPMax,
  getLiquidityProviderAddress,
  getEstimatedAmountInUSD,
  approvePairMax,
  addLiquidityToGroupQueue,
  getQueueStakeToken,
  convertGroupQueueWhitelistedAddresses
}
