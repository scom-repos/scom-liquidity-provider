export interface CoreAddress {
    OSWAP_RestrictedLiquidityProvider:string
    OSWAP_RestrictedFactory:string
}
export const coreAddress: {[chainId: number]: CoreAddress} = {
    56: { // BSC
        OSWAP_RestrictedLiquidityProvider:"0x1c8682435DB14502857834139cB2710E902485b2",
        OSWAP_RestrictedFactory:"0x91d137464b93caC7E2c2d4444a9D8609E4473B70",
    },
    97: { // BSC Testnet
        OSWAP_RestrictedLiquidityProvider:"0xdBE2111327D60DbB5376db10dD0F484E98b7d40e",
        OSWAP_RestrictedFactory:"0xa158FB71cA5EF59f707c6F8D0b9CC5765F97Fd60",
    }
}