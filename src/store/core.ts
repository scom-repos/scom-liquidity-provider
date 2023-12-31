export interface CoreAddress {
    WETH9: string;
    OSWAP_ConfigStore: string;
    OSWAP_RestrictedLiquidityProvider: string;
    OSWAP_RestrictedFactory: string;
    OSWAP_HybridRouterRegistry: string;
}
export const coreAddress: { [chainId: number]: CoreAddress } = {
    56: { // BSC
        WETH9: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        OSWAP_ConfigStore: "0xE07526f892af09acb84E9bC5f32Df575750DaE3b",
        OSWAP_RestrictedLiquidityProvider: "0x1c8682435DB14502857834139cB2710E902485b2",
        OSWAP_RestrictedFactory: "0x91d137464b93caC7E2c2d4444a9D8609E4473B70",
        OSWAP_HybridRouterRegistry: "0xcc44c3617e46b2e946d61499ff8f4cda721ff178"
    },
    97: { // BSC Testnet
        WETH9: "0xae13d989dac2f0debff460ac112a837c89baa7cd",
        OSWAP_ConfigStore: "0x3349184B0b3e84094ad78176407D627F0A29bEFC",
        OSWAP_RestrictedLiquidityProvider: "0xdBE2111327D60DbB5376db10dD0F484E98b7d40e",
        OSWAP_RestrictedFactory: "0xa158FB71cA5EF59f707c6F8D0b9CC5765F97Fd60",
        OSWAP_HybridRouterRegistry: "0x8e5Afed779B56888ca267284494f23aFe158EA0B"
    },
    137: { // Polygon
        WETH9: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        OSWAP_ConfigStore: "0x408aAf94BD851eb991dA146dFc7C290aA42BA70f",
        OSWAP_RestrictedFactory: "0xF879576c2D674C5D22f256083DC8fD019a3f33A1",
        OSWAP_RestrictedLiquidityProvider: "0x2d7BB250595db7D588D32A0f3582BB73CD902060",
        OSWAP_HybridRouterRegistry: "0x728DbD968341eb7aD11bDabFE775A13aF901d6ac"
    },
    80001: {// Polygon testnet
        WETH9: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
        OSWAP_ConfigStore: "0xDd990869da18631a583F8c4503866d23406F79D8",
        OSWAP_RestrictedFactory: "0x6D2b196aBf09CF97612a5c062bF14EC278F6D677",
        OSWAP_RestrictedLiquidityProvider: "0xa1254f0bE9e90ad23ED96CA3623b29465C5c3106",
        OSWAP_HybridRouterRegistry: "0x68C229a3772dFebD0fD51df36B7029fcF75424F7"
    },
    43113: { // AVAX Testnet
        WETH9: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
        OSWAP_ConfigStore: "0x258A5309486310398Ee078217729db2f65367a92",
        OSWAP_RestrictedFactory: "0x6C99c8E2c587706281a5B66bA7617DA7e2Ba6e48",
        OSWAP_RestrictedLiquidityProvider: "0x6Ad6dE48e1bdBb7caD656D80fFDcA863B4614741",
        OSWAP_HybridRouterRegistry: "0xCd370BBbC84AB66a9e0Ff9F533E11DeC87704736"
    },
    43114: { // AVAX
        WETH9: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
        OSWAP_ConfigStore: "0x8Ae51f1A62c4Bc0715C367bFe812c53e583aEE2f",
        OSWAP_RestrictedFactory: "0x739f0BBcdAd415127FE8d5d6ED053e9D817BdAdb",
        OSWAP_RestrictedLiquidityProvider: "0x629cF4235c0f6b9954698EF0aF779b9502e4853E",
        OSWAP_HybridRouterRegistry: "0xEA6A56086e66622208fa8e7B743Bad3FF47aD40c"
    },
    42161: { // Arbitrum One
        WETH9: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        OSWAP_ConfigStore: "0x5A9C508ee45d417d176CddADFb151DDC1Fcd21D9",
        OSWAP_RestrictedFactory: "0x408aAf94BD851eb991dA146dFc7C290aA42BA70f",
        OSWAP_RestrictedLiquidityProvider: "0x3B7a91F387C42CA040bf96B734bc20DC3d43cC2A",
        OSWAP_HybridRouterRegistry: "0xD5f2e1bb65d7AA483547D1eDF1B59edCa296F6D3"
    },
    421613: { // Arbitrum Goerli Testnet
        WETH9: "0xEe01c0CD76354C383B8c7B4e65EA88D00B06f36f",
        OSWAP_ConfigStore: "0x689200913Ca40C8c89102A3441D62d51282eAA3f",
        OSWAP_RestrictedFactory: "0x6f641f4F5948954F7cd675f3D874Ac60b193bA0d",
        OSWAP_RestrictedLiquidityProvider: "0x93baA37dA23d507dF3F075F660584969e68ec5eb",
        OSWAP_HybridRouterRegistry: "0x7422408d5211a512f18fd55c49d5483d24c9ed6a"
    }
}