export interface CoreAddress {
    WETH9: string;
    OSWAP_ConfigStore: string;
    OSWAP_RestrictedLiquidityProvider: string;
    OSWAP_RestrictedFactory: string;
}
export const coreAddress: { [chainId: number]: CoreAddress } = {
    56: { // BSC
        WETH9: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        OSWAP_ConfigStore: "0xE07526f892af09acb84E9bC5f32Df575750DaE3b",
        OSWAP_RestrictedLiquidityProvider: "0x1c8682435DB14502857834139cB2710E902485b2",
        OSWAP_RestrictedFactory: "0x91d137464b93caC7E2c2d4444a9D8609E4473B70"
    },
    97: { // BSC Testnet
        WETH9: "0xae13d989dac2f0debff460ac112a837c89baa7cd",
        OSWAP_ConfigStore: "0x3349184B0b3e84094ad78176407D627F0A29bEFC",
        OSWAP_RestrictedLiquidityProvider: "0xdBE2111327D60DbB5376db10dD0F484E98b7d40e",
        OSWAP_RestrictedFactory: "0xa158FB71cA5EF59f707c6F8D0b9CC5765F97Fd60"
    },
    43113: { // AVAX Testnet
        WETH9: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
        OSWAP_ConfigStore: "0x258A5309486310398Ee078217729db2f65367a92",
        OSWAP_RestrictedFactory: "0x6C99c8E2c587706281a5B66bA7617DA7e2Ba6e48",
        OSWAP_RestrictedLiquidityProvider: "0x6Ad6dE48e1bdBb7caD656D80fFDcA863B4614741"
    },
    43114: { // AVAX
        WETH9: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
        OSWAP_ConfigStore: "0x8Ae51f1A62c4Bc0715C367bFe812c53e583aEE2f",
        OSWAP_RestrictedFactory: "0x739f0BBcdAd415127FE8d5d6ED053e9D817BdAdb",
        OSWAP_RestrictedLiquidityProvider: "0x629cF4235c0f6b9954698EF0aF779b9502e4853E"
    },
    42161: { // Arbitrum One
        WETH9: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        OSWAP_ConfigStore: "0x5A9C508ee45d417d176CddADFb151DDC1Fcd21D9",
        OSWAP_RestrictedFactory: "0x408aAf94BD851eb991dA146dFc7C290aA42BA70f",
        OSWAP_RestrictedLiquidityProvider: "0x3B7a91F387C42CA040bf96B734bc20DC3d43cC2A"
    },
    421613: { // Arbitrum Goerli Testnet
        WETH9: "0xEe01c0CD76354C383B8c7B4e65EA88D00B06f36f",
        OSWAP_ConfigStore: "0x689200913Ca40C8c89102A3441D62d51282eAA3f",
        OSWAP_RestrictedFactory: "0x6f641f4F5948954F7cd675f3D874Ac60b193bA0d",
        OSWAP_RestrictedLiquidityProvider: "0x93baA37dA23d507dF3F075F660584969e68ec5eb"
    }
}