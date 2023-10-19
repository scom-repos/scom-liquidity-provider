import { Wallet, BigNumber } from "@ijstech/eth-wallet";
import { Contracts } from "@scom/oswap-openswap-contract";
import { State, coreAddress } from "./store";

const nativeTokenDecimals = 18;

export async function doAddLiquidity(
    wallet:Wallet,
    liqProvider:string,
    tokenA: string,
    tokenB: string,
    tokenInDecimals: number,
    addingTokenA: boolean,
    pairIndex: number | BigNumber,
    offerIndex: number | BigNumber,
    amountIn: number | BigNumber,
    allowAll: boolean,
    restrictedPrice: number | BigNumber,
    startDate: number | BigNumber,
    expire: number | BigNumber,
    deadline: number | BigNumber,
) {
    let amountInWei = new BigNumber(amountIn).shiftedBy(tokenInDecimals);
    let liqProviderContracts = new Contracts.OSWAP_RestrictedLiquidityProvider1(wallet,liqProvider);
    let receipt = await liqProviderContracts.addLiquidity({
        tokenA, 
        tokenB, 
        addingTokenA, 
        pairIndex,
        offerIndex,
        amountIn:amountInWei,
        allowAll,
        restrictedPrice,
        startDate,
        expire,
        deadline,
    });
    return receipt;
}

export async function doAddLiquidityETH(
    wallet:Wallet,
    liqProvider:string,
    tokenA: string,
    tokenADecimals: number,
    addingTokenA: boolean,
    pairIndex: number | BigNumber,
    offerIndex: number | BigNumber,
    amountIn: number | BigNumber,
    allowAll: boolean,
    restrictedPrice: number | BigNumber,
    startDate: number | BigNumber,
    expire: number | BigNumber,
    deadline: number | BigNumber,
) {
    let ethAmount = new BigNumber("0");
    let amountAIn = new BigNumber("0");
    if (addingTokenA) {
        amountAIn = new BigNumber(amountIn).shiftedBy(tokenADecimals);
    } else {
        ethAmount = new BigNumber(amountIn).shiftedBy(nativeTokenDecimals);
    }
    let liqProviderContracts = new Contracts.OSWAP_RestrictedLiquidityProvider1(wallet,liqProvider);
    let receipt = await liqProviderContracts.addLiquidityETH({
        tokenA, 
        addingTokenA, 
        pairIndex,
        offerIndex,
        amountAIn,
        allowAll,
        restrictedPrice,
        startDate,
        expire,
        deadline,
    }, ethAmount);
    return receipt;
}

export async function doAddLiquidityAndTrader(
    wallet:Wallet,
    liqProvider:string,
    tokenA: string,
    tokenB: string,
    tokenInDecimals: number,
    addingTokenA: boolean,
    pairIndex: number | BigNumber,
    offerIndex: number | BigNumber,
    amountIn: number | BigNumber,
    allowAll: boolean,
    restrictedPrice: number | BigNumber,
    startDate: number | BigNumber,
    expire: number | BigNumber,
    deadline: number | BigNumber,
    whitelistAddress:[{address:string,allocation:BigNumber,oldAllocation:BigNumber}]
) {
    let trader: string[] = [];
    let allocation: BigNumber[] = [];
    whitelistAddress.map(v => {
        if (!v.allocation.eq(v.oldAllocation)) {
          trader.push(v.address);
          allocation.push(v.allocation.shiftedBy(tokenInDecimals));
        }
    });
    let amountInWei = new BigNumber(amountIn).shiftedBy(tokenInDecimals);
    let liqProviderContracts = new Contracts.OSWAP_RestrictedLiquidityProvider1(wallet,liqProvider);
    let receipt = await liqProviderContracts.addLiquidityAndTrader({
        param:[
            new BigNumber(tokenA.toLowerCase()),
            new BigNumber(tokenB.toLowerCase()),
            addingTokenA?1:0,
            pairIndex,
            offerIndex,
            amountInWei,
            allowAll?1:0,
            restrictedPrice,
            startDate,
            expire,
            deadline
        ],
    trader,
    allocation
    });
    
    return receipt;
}

export async function doAddLiquidityETHAndTrader(
    wallet:Wallet,
    liqProvider:string,
    tokenA: string,
    tokenADecimals: number,
    addingTokenA: boolean,
    pairIndex: number | BigNumber,
    offerIndex: number | BigNumber,
    amountIn: number | BigNumber,
    allowAll: boolean,
    restrictedPrice: number | BigNumber,
    startDate: number | BigNumber,
    expire: number | BigNumber,
    deadline: number | BigNumber,
    whitelistAddress:[{address:string,allocation:BigNumber,oldAllocation:BigNumber}]
) {
    let tokenInDecimals = nativeTokenDecimals;
    let ethAmount = new BigNumber("0");
    let amountAIn = new BigNumber("0");
    if (addingTokenA) {
        amountAIn = new BigNumber(amountIn).shiftedBy(tokenADecimals);
        tokenInDecimals = tokenADecimals;
    } else {
        ethAmount = new BigNumber(amountIn).shiftedBy(nativeTokenDecimals);
    }
    let trader: string[] = [];
    let allocation: BigNumber[] = [];
    whitelistAddress.map(v => {
        if (!v.allocation.eq(v.oldAllocation)) {
          trader.push(v.address);
          allocation.push(v.allocation.shiftedBy(tokenInDecimals));
        }
    });
    let liqProviderContracts = new Contracts.OSWAP_RestrictedLiquidityProvider1(wallet,liqProvider);
    let receipt = await liqProviderContracts.addLiquidityETHAndTrader({
        param:[
            new BigNumber(tokenA.toLowerCase()),
            addingTokenA?1:0,
            pairIndex,
            offerIndex,
            amountAIn,
            allowAll?1:0,
            restrictedPrice,
            startDate,
            expire,
            deadline
        ],
    trader,
    allocation
    },ethAmount);
    
    return receipt;
}

export async function doRegisterPair(state: State, token0: string, token1: string) {
    //register group queue pair to HybridRouterRegistry
    const wallet = state.getRpcWallet();
    const chainId = state.getChainId();
    try {
        const core = coreAddress[chainId];
        if (!core) throw new Error(`This chain (${chainId}) is not supported`);
        const registry = new Contracts.OSWAP_HybridRouterRegistry(wallet,core.OSWAP_HybridRouterRegistry)
        const receipt = await registry.registerPairByTokensV3({
            factory: core.OSWAP_RestrictedFactory,
            token0,
            token1,
            pairIndex: 0
        });
        return receipt;
    } catch (error) {
        console.log("doRegisterPair", error);
    }
}