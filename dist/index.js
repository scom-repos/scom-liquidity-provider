var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("@scom/scom-liquidity-provider/assets.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let moduleDir = components_1.application.currentModuleDir;
    function fullPath(path) {
        if (path.indexOf('://') > 0)
            return path;
        return `${moduleDir}/${path}`;
    }
    exports.default = {
        fullPath
    };
});
define("@scom/scom-liquidity-provider/store/utils.ts", ["require", "exports", "@ijstech/eth-wallet", "@scom/scom-network-list", "@ijstech/components", "@scom/scom-token-list"], function (require, exports, eth_wallet_1, scom_network_list_1, components_2, scom_token_list_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isClientWalletConnected = exports.State = void 0;
    class State {
        constructor(options) {
            this.slippageTolerance = 0.5;
            this.transactionDeadline = 30;
            this.networkMap = {};
            this.infuraId = '';
            this.proxyAddresses = {};
            this.embedderCommissionFee = '0';
            this.rpcWalletId = '';
            this.networkMap = (0, scom_network_list_1.default)();
            this.initData(options);
        }
        initRpcWallet(chainId) {
            if (this.rpcWalletId) {
                return this.rpcWalletId;
            }
            const clientWallet = eth_wallet_1.Wallet.getClientInstance();
            const networkList = Object.values(components_2.application.store?.networkMap || []);
            const instanceId = clientWallet.initRpcWallet({
                networks: networkList,
                defaultChainId: chainId,
                infuraId: components_2.application.store?.infuraId,
                multicalls: components_2.application.store?.multicalls
            });
            this.rpcWalletId = instanceId;
            if (clientWallet.address) {
                const rpcWallet = eth_wallet_1.Wallet.getRpcWalletInstance(instanceId);
                rpcWallet.address = clientWallet.address;
            }
            return instanceId;
        }
        initData(options) {
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
        setNetworkList(networkList, infuraId) {
            const wallet = eth_wallet_1.Wallet.getClientInstance();
            this.networkMap = {};
            const defaultNetworkList = (0, scom_network_list_1.default)();
            const defaultNetworkMap = defaultNetworkList.reduce((acc, cur) => {
                acc[cur.chainId] = cur;
                return acc;
            }, {});
            for (let network of networkList) {
                const networkInfo = defaultNetworkMap[network.chainId];
                if (!networkInfo)
                    continue;
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
        getProxyAddress(chainId) {
            const _chainId = chainId || eth_wallet_1.Wallet.getInstance().chainId;
            const proxyAddresses = this.proxyAddresses;
            if (proxyAddresses) {
                return proxyAddresses[_chainId];
            }
            return null;
        }
        getRpcWallet() {
            return this.rpcWalletId ? eth_wallet_1.Wallet.getRpcWalletInstance(this.rpcWalletId) : null;
        }
        isRpcWalletConnected() {
            const wallet = this.getRpcWallet();
            return wallet?.isConnected;
        }
        getChainId() {
            const rpcWallet = this.getRpcWallet();
            return rpcWallet?.chainId;
        }
        async setApprovalModelAction(options) {
            const approvalOptions = {
                ...options,
                spenderAddress: ''
            };
            let wallet = this.getRpcWallet();
            this.approvalModel = new eth_wallet_1.ERC20ApprovalModel(wallet, approvalOptions);
            let approvalModelAction = this.approvalModel.getAction();
            return approvalModelAction;
        }
        setCustomTokens(tokens) {
            this.customTokens = tokens;
        }
        getTokenMapByChainId(chainId) {
            let tokenMap = scom_token_list_1.tokenStore.getTokenMapByChainId(chainId);
            const customTokens = this.customTokens?.[chainId];
            if (customTokens) {
                customTokens.forEach(v => tokenMap[v.address.toLowerCase()] = { ...v });
            }
            return tokenMap;
        }
        getTokenDecimals(chainId, address) {
            const ChainNativeToken = scom_token_list_1.ChainNativeTokenByChainId[chainId];
            const tokenMap = this.getTokenMapByChainId(chainId);
            const tokenObject = (!address || address.toLowerCase() === scom_token_list_1.WETHByChainId[chainId].address.toLowerCase()) ? ChainNativeToken : tokenMap[address.toLowerCase()];
            return tokenObject ? tokenObject.decimals : 18;
        }
        tokenSymbol(chainId, address) {
            if (!address)
                return '';
            const tokenMap = this.getTokenMapByChainId(chainId);
            let tokenObject = tokenMap[address.toLowerCase()];
            if (!tokenObject) {
                tokenObject = tokenMap[address];
            }
            return tokenObject ? tokenObject.symbol : '';
        }
    }
    exports.State = State;
    function isClientWalletConnected() {
        const wallet = eth_wallet_1.Wallet.getClientInstance();
        return wallet.isConnected;
    }
    exports.isClientWalletConnected = isClientWalletConnected;
});
define("@scom/scom-liquidity-provider/store/core.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.coreAddress = void 0;
    exports.coreAddress = {
        56: {
            WETH9: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
            OSWAP_ConfigStore: "0xE07526f892af09acb84E9bC5f32Df575750DaE3b",
            OSWAP_RestrictedLiquidityProvider: "0x1c8682435DB14502857834139cB2710E902485b2",
            OSWAP_RestrictedFactory: "0x91d137464b93caC7E2c2d4444a9D8609E4473B70",
            OSWAP_HybridRouterRegistry: "0xcc44c3617e46b2e946d61499ff8f4cda721ff178"
        },
        97: {
            WETH9: "0xae13d989dac2f0debff460ac112a837c89baa7cd",
            OSWAP_ConfigStore: "0x3349184B0b3e84094ad78176407D627F0A29bEFC",
            OSWAP_RestrictedLiquidityProvider: "0xdBE2111327D60DbB5376db10dD0F484E98b7d40e",
            OSWAP_RestrictedFactory: "0xa158FB71cA5EF59f707c6F8D0b9CC5765F97Fd60",
            OSWAP_HybridRouterRegistry: "0x8e5Afed779B56888ca267284494f23aFe158EA0B"
        },
        137: {
            WETH9: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
            OSWAP_ConfigStore: "0x408aAf94BD851eb991dA146dFc7C290aA42BA70f",
            OSWAP_RestrictedFactory: "0xF879576c2D674C5D22f256083DC8fD019a3f33A1",
            OSWAP_RestrictedLiquidityProvider: "0x2d7BB250595db7D588D32A0f3582BB73CD902060",
            OSWAP_HybridRouterRegistry: "0x728DbD968341eb7aD11bDabFE775A13aF901d6ac"
        },
        80001: {
            WETH9: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
            OSWAP_ConfigStore: "0xDd990869da18631a583F8c4503866d23406F79D8",
            OSWAP_RestrictedFactory: "0x6D2b196aBf09CF97612a5c062bF14EC278F6D677",
            OSWAP_RestrictedLiquidityProvider: "0xa1254f0bE9e90ad23ED96CA3623b29465C5c3106",
            OSWAP_HybridRouterRegistry: "0x68C229a3772dFebD0fD51df36B7029fcF75424F7"
        },
        43113: {
            WETH9: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
            OSWAP_ConfigStore: "0x258A5309486310398Ee078217729db2f65367a92",
            OSWAP_RestrictedFactory: "0x6C99c8E2c587706281a5B66bA7617DA7e2Ba6e48",
            OSWAP_RestrictedLiquidityProvider: "0x6Ad6dE48e1bdBb7caD656D80fFDcA863B4614741",
            OSWAP_HybridRouterRegistry: "0xCd370BBbC84AB66a9e0Ff9F533E11DeC87704736"
        },
        43114: {
            WETH9: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
            OSWAP_ConfigStore: "0x8Ae51f1A62c4Bc0715C367bFe812c53e583aEE2f",
            OSWAP_RestrictedFactory: "0x739f0BBcdAd415127FE8d5d6ED053e9D817BdAdb",
            OSWAP_RestrictedLiquidityProvider: "0x629cF4235c0f6b9954698EF0aF779b9502e4853E",
            OSWAP_HybridRouterRegistry: "0xEA6A56086e66622208fa8e7B743Bad3FF47aD40c"
        },
        42161: {
            WETH9: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
            OSWAP_ConfigStore: "0x5A9C508ee45d417d176CddADFb151DDC1Fcd21D9",
            OSWAP_RestrictedFactory: "0x408aAf94BD851eb991dA146dFc7C290aA42BA70f",
            OSWAP_RestrictedLiquidityProvider: "0x3B7a91F387C42CA040bf96B734bc20DC3d43cC2A",
            OSWAP_HybridRouterRegistry: "0xD5f2e1bb65d7AA483547D1eDF1B59edCa296F6D3"
        },
        421613: {
            WETH9: "0xEe01c0CD76354C383B8c7B4e65EA88D00B06f36f",
            OSWAP_ConfigStore: "0x689200913Ca40C8c89102A3441D62d51282eAA3f",
            OSWAP_RestrictedFactory: "0x6f641f4F5948954F7cd675f3D874Ac60b193bA0d",
            OSWAP_RestrictedLiquidityProvider: "0x93baA37dA23d507dF3F075F660584969e68ec5eb",
            OSWAP_HybridRouterRegistry: "0x7422408d5211a512f18fd55c49d5483d24c9ed6a"
        }
    };
});
define("@scom/scom-liquidity-provider/store/index.ts", ["require", "exports", "@scom/scom-liquidity-provider/assets.ts", "@scom/scom-token-list", "@ijstech/components", "@scom/scom-liquidity-provider/store/utils.ts", "@scom/scom-liquidity-provider/store/core.ts"], function (require, exports, assets_1, scom_token_list_2, components_3, utils_1, core_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.viewOnExplorerByAddress = exports.getNetworkInfo = exports.getChainNativeToken = exports.fallbackUrl = void 0;
    exports.fallbackUrl = assets_1.default.fullPath('img/token-placeholder.svg');
    const getChainNativeToken = (chainId) => {
        return scom_token_list_2.ChainNativeTokenByChainId[chainId];
    };
    exports.getChainNativeToken = getChainNativeToken;
    const getNetworkInfo = (chainId) => {
        const networkMap = components_3.application.store['networkMap'];
        return networkMap[chainId];
    };
    exports.getNetworkInfo = getNetworkInfo;
    const viewOnExplorerByAddress = (chainId, address) => {
        let network = (0, exports.getNetworkInfo)(chainId);
        if (network && network.explorerAddressUrl) {
            let url = `${network.explorerAddressUrl}${address}`;
            window.open(url);
        }
    };
    exports.viewOnExplorerByAddress = viewOnExplorerByAddress;
    __exportStar(utils_1, exports);
    __exportStar(core_1, exports);
});
define("@scom/scom-liquidity-provider/data.json.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name='@scom/scom-liquidity-provider/data.json.ts'/> 
    exports.default = {
        "defaultBuilderData": {
            "chainId": 43113,
            "tokenIn": "0xb9C31Ea1D475c25E58a1bE1a46221db55E5A7C6e",
            "tokenOut": "0x78d9D80E67bC80A11efbf84B7c8A65Da51a8EF3C",
            "networks": [
                {
                    "chainId": 43113
                },
                {
                    "chainId": 97
                },
                {
                    "chainId": 56
                },
                {
                    "chainId": 43114
                },
                {
                    "chainId": 42161
                },
                {
                    "chainId": 421613
                }
            ],
            "wallets": [
                {
                    "name": "metamask"
                }
            ]
        }
    };
});
define("@scom/scom-liquidity-provider/index.css.ts", ["require", "exports", "@ijstech/components", "@scom/scom-liquidity-provider/assets.ts"], function (require, exports, components_4, assets_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.modalStyle = exports.liquidityProviderForm = exports.liquidityProviderComponent = exports.liquidityProviderContainer = void 0;
    const Theme = components_4.Styles.Theme.ThemeVars;
    const colorVar = {
        primaryButton: 'transparent linear-gradient(90deg, #AC1D78 0%, #E04862 100%) 0% 0% no-repeat padding-box',
        primaryGradient: 'linear-gradient(255deg,#f15e61,#b52082)',
        primaryDisabled: 'transparent linear-gradient(270deg,#351f52,#552a42) 0% 0% no-repeat padding-box !important'
    };
    exports.liquidityProviderContainer = components_4.Styles.style({
        $nest: {
            'dapp-container-body': {
                $nest: {
                    '&::-webkit-scrollbar': {
                        width: '6px',
                        height: '6px'
                    },
                    '&::-webkit-scrollbar-track': {
                        borderRadius: '10px',
                        border: '1px solid transparent',
                        background: `${Theme.divider} !important`
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: `${Theme.colors.primary.main} !important`,
                        borderRadius: '10px',
                        outline: '1px solid transparent'
                    }
                }
            }
        }
    });
    exports.liquidityProviderComponent = components_4.Styles.style({
        padding: '1rem',
        $nest: {
            'span': {
                letterSpacing: '0.15px',
            },
            '.i-loading-overlay': {
                background: Theme.background.main,
            },
            '.btn-os': {
                background: colorVar.primaryButton,
                height: 'auto !important',
                color: '#fff',
                // color: Theme.colors.primary.contrastText,
                transition: 'background .3s ease',
                fontSize: '1rem',
                fontWeight: 'bold',
                $nest: {
                    'i-icon.loading-icon': {
                        marginInline: '0.25rem',
                        width: '16px !important',
                        height: '16px !important',
                    },
                    'svg': {
                        // fill: `${Theme.colors.primary.contrastText} !important`
                        fill: `#fff !important`
                    }
                },
            },
            '.btn-os:not(.disabled):not(.is-spinning):hover, .btn-os:not(.disabled):not(.is-spinning):focus': {
                background: colorVar.primaryGradient,
                backgroundColor: 'transparent',
                boxShadow: 'none',
                opacity: .9
            },
            '.btn-os:not(.disabled):not(.is-spinning):focus': {
                boxShadow: '0 0 0 0.2rem rgb(0 123 255 / 25%)'
            },
            '.btn-os.disabled, .btn-os.is-spinning': {
                background: colorVar.primaryDisabled,
                opacity: 1
            },
            '.hidden': {
                display: 'none !important'
            },
            'i-modal .modal': {
                background: Theme.background.modal,
            },
            '#lockModal': {
                $nest: {
                    '.modal': {
                        width: 480,
                        maxWidth: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '1rem',
                        color: Theme.text.primary
                    },
                    '.i-modal_header': {
                        marginBottom: '1.5rem',
                        paddingBottom: '0.5rem',
                        borderBottom: `2px solid ${Theme.input.background}`,
                        color: Theme.colors.primary.main,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                    },
                    '.i-modal_header > i-icon': {
                        fill: `${Theme.colors.primary.main} !important`
                    },
                    '.i-modal_header ~ i-icon': {
                        display: 'inline-block',
                        margin: '0.75rem 0',
                        border: '2px solid transparent',
                        borderRadius: '50%',
                        padding: '0.25rem'
                    },
                    'i-button': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '150px',
                        height: '50px !important',
                        fontWeight: 600,
                        borderRadius: 5,
                        margin: '0.5rem',
                    },
                    '.btn-cancel': {
                        background: `${Theme.text.primary} !important`,
                        color: `${Theme.background.main} !important`,
                    },
                    '.i-checkbox': {
                        cursor: 'pointer',
                    },
                    'i-checkbox .checkmark': {
                        backgroundColor: '#fff',
                        height: '18px',
                        width: '18px',
                        $nest: {
                            '&::after': {
                                top: '2px',
                                left: '6px',
                                borderColor: '#fff',
                            },
                        },
                    },
                    'i-checkbox.is-checked .checkmark': {
                        backgroundColor: Theme.colors.primary.main
                    }
                }
            }
        }
    });
    exports.liquidityProviderForm = components_4.Styles.style({
        maxWidth: 920,
        margin: '0 auto',
        $nest: {
            '.hidden': {
                display: 'none !important'
            },
            '.w-100': {
                width: '100%'
            },
            '.red-color i-label *': {
                color: '#f15e61'
            },
            '.green-color *': {
                color: '#77D394'
            },
            'i-icon': {
                display: 'inline-block'
            },
            'i-button i-icon.loading-icon': {
                display: 'inline-flex'
            },
            '.text--primary *': {
                color: Theme.colors.primary.main
            },
            '.back-section i-link a': {
                display: 'flex',
                alignItems: 'center'
            },
            '.custom-container': {
                width: 'calc(50% - 10px)',
                minWidth: 320,
                marginInline: 'auto'
            },
            '.icon-left': {
                transform: 'translate(10px, 0)',
            },
            '.detail-col': {
                font: `normal normal 700 1.5rem/1.5rem ${Theme.typography.fontFamily}`,
                background: 'hsla(0,0%,100%,0.10196078431372549)',
                borderRadius: '1em',
                border: `1px solid ${Theme.divider}`,
                padding: '0 1rem 1rem',
                marginBottom: '1.5rem',
                fontWeight: 'normal',
                $nest: {
                    '.icon-right': {
                        display: 'inline-block',
                        marginRight: '1rem'
                    },
                    '.detail-col_header': {
                        borderBottom: `2px solid ${Theme.divider}`,
                        padding: '1rem 1rem 1rem 0'
                    },
                    '.detail-col_header i-label *': {
                        fontWeight: 700,
                        fontSize: '1.25rem'
                    },
                    '.detail-col_header i-label.small-label *': {
                        fontSize: '0.9rem'
                    },
                    '.input--token-container': {
                        padding: '0.5rem 0',
                    },
                    '.btn-max': {
                        borderRadius: '0.5rem',
                        marginLeft: '0.5rem',
                        opacity: 0.8,
                        color: '#fff',
                        padding: '.2rem .5rem'
                    },
                    '.bg-box': {
                        margin: '0.5rem 0'
                    },
                    '.input--token-box': {
                        padding: '0.25rem 0.5rem',
                        background: Theme.input.background,
                        border: `2px solid ${Theme.input.background}`,
                        borderRadius: '0.75rem',
                        $nest: {
                            '&.bordered': {
                                border: `2px solid ${Theme.colors.primary.main}`
                            },
                            'i-button': {
                                padding: '0.3rem 0.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 700,
                                lineHeight: 1.5,
                                alignSelf: 'center',
                                textAlign: 'center',
                                opacity: 1
                            },
                            '.text-value': {
                                display: 'block',
                                $nest: {
                                    '> *': {
                                        fontSize: '1.25rem',
                                        paddingRight: '0.25rem'
                                    }
                                }
                            },
                            'i-input': {
                                width: '100%',
                                height: '100% !important'
                            },
                            'i-input > input': {
                                width: '100%',
                                height: '100% !important',
                                padding: '.375rem .75rem',
                                paddingRight: '0.25rem',
                                paddingLeft: 0,
                                borderRadius: '0.25rem',
                                border: 'none',
                                background: 'transparent',
                                color: Theme.input.fontColor,
                                fontSize: '1.25rem'
                            },
                            'i-icon svg': {
                                verticalAlign: 'top'
                            },
                            '#gridTokenInput': {
                                paddingInline: '0 !important',
                                background: 'transparent !important'
                            }
                        }
                    },
                    '.custom-question-icon': {
                        display: 'flex !important',
                        marginTop: '4px',
                    },
                    '#datePanel': {
                        $nest: {
                            '.input--token-container': {
                                width: 'auto',
                                maxWidth: 'calc(50% - 5px)',
                            },
                            '.input--token-box': {
                                padding: 0,
                            },
                        },
                    },
                    '.toggle-icon': {
                        display: 'inline-block',
                        padding: '3px',
                        marginLeft: 'auto',
                        border: '2px solid transparent',
                        borderRadius: '50%',
                        transform: 'rotate(90deg)',
                        cursor: 'pointer'
                    },
                    '.custom-datepicker': {
                        $nest: {
                            'input[type="text"]': {
                                background: 'transparent',
                                height: '60px !important',
                                width: '100% !important',
                                border: 'none',
                                padding: '1rem 0.75rem',
                                fontSize: '1.25rem',
                                color: Theme.input.fontColor,
                                $nest: {
                                    '&::placeholder': {
                                        color: Theme.input.fontColor,
                                        opacity: 0.8
                                    },
                                }
                            },
                            '.datepicker-toggle': {
                                display: 'flex',
                                width: '100% !important',
                                height: '100% !important',
                                padding: 0,
                                position: 'absolute',
                                top: 0,
                                margin: 0,
                                background: 'transparent',
                                border: 'none'
                            },
                            'i-icon': {
                                width: '100%',
                            },
                            'svg': {
                                display: 'none',
                            }
                        },
                    },
                    '.input--token-container.disabled *, .token-box.disabled *': {
                        cursor: 'default !important',
                    },
                    '.btn-address': {
                        padding: '0.25rem .75rem',
                    },
                    '.btn-next': {
                        width: '100%',
                        padding: '.75rem',
                        marginTop: 10,
                        marginBottom: 25,
                        textAlign: 'center',
                    },
                    '.progress-number': {
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: Theme.colors.primary.main,
                        fontSize: '.9rem',
                        color: Theme.text.primary,
                        textAlign: 'center',
                        lineHeight: '20px'
                    },
                    '.progress-complete': {
                        background: `url(${assets_2.default.fullPath('img/complete.svg')})`,
                        backgroundSize: 'cover',
                        width: 20,
                        height: 20,
                        borderRadius: '50%'
                    },
                    '.item-status': {
                        alignItems: 'center',
                        fontSize: '1rem',
                        $nest: {
                            'i-icon': {
                                width: '24px',
                                height: '24px',
                                marginRight: '0.25rem',
                            },
                        },
                    },
                    '.btn-dropdown': {
                        paddingInline: '0.25rem',
                        width: '100%',
                        $nest: {
                            '.caption': {
                                justifyContent: 'start',
                                cursor: 'pointer'
                            },
                            '> i-button': {
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 0,
                                boxShadow: 'none',
                                height: '2.5rem',
                                justifyContent: 'flex-start'
                            },
                            '.modal': {
                                padding: '0.25rem 0',
                                marginTop: 0,
                                border: `2px solid ${Theme.colors.primary.main}`,
                                background: Theme.background.modal,
                                borderRadius: 4,
                                minWidth: 0,
                                width: '100%',
                                maxWidth: 410,
                                $nest: {
                                    'i-button': {
                                        display: 'block',
                                        padding: '0.5rem 1rem',
                                        background: 'transparent',
                                        borderRadius: '0',
                                        border: 'none',
                                        boxShadow: 'none',
                                        fontSize: '0.875rem',
                                        height: 'auto',
                                        textAlign: 'left',
                                        $nest: {
                                            '&:hover': {
                                                opacity: 0.8,
                                            },
                                            'i-image': {
                                                display: 'flex',
                                                flexDirection: 'row-reverse',
                                                justifyContent: 'flex-end',
                                                alignItems: 'center',
                                            },
                                            'img': {
                                                width: '24px',
                                                height: '24px',
                                                marginRight: '0.25rem',
                                            },
                                        },
                                    },
                                    'i-button:last-child': {
                                        marginBottom: 0
                                    }
                                }
                            }
                        }
                    },
                    '.status-combobox': {
                        width: '100%',
                        $nest: {
                            '.icon-btn': {
                                background: 'transparent',
                                border: 'none'
                            },
                            'input': {
                                backgroundColor: 'transparent',
                                border: 'none',
                                fontSize: '1.125rem',
                                width: '100%',
                                color: Theme.text.primary,
                                $nest: {
                                    '&:focus': {
                                        outline: 0
                                    }
                                }
                            }
                        }
                    },
                    '.summary': {
                        padding: '0 1rem'
                    },
                    '.summary-row': {
                        marginTop: '1rem',
                        flexWrap: 'nowrap',
                        $nest: {
                            '&:last-child': {
                                marginBottom: '1rem'
                            },
                            '&.row-right': {
                                flexWrap: 'wrap',
                            },
                            'i-label *': {
                                font: `normal normal bold 1rem/1rem ${Theme.typography.fontFamily}`,
                                fontSize: '.9rem',
                                lineHeight: '1.5rem',
                                opacity: 0.8
                            },
                            '.summary-row_body i-label *': {
                                color: Theme.text.primary,
                                opacity: 1
                            },
                            '&.highlight-row .summary-row_body i-label.highlight-value *': {
                                color: Theme.colors.primary.main
                            },
                            '&.summary-row--one': {
                                display: 'flex',
                                justifyContent: 'space-between',
                                flexDirection: 'column',
                                $nest: {
                                    '.summary-inner': {
                                        display: 'flex',
                                        textAlign: 'right',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between'
                                    },
                                    '.second-data *': {
                                        opacity: 0.8,
                                        fontSize: '.9rem'
                                    }
                                }
                            },
                            '.summary-inner': {
                                display: 'flex',
                                justifyContent: 'space-between'
                            }
                        }
                    },
                    '.flex-col': {
                        flexDirection: 'column',
                    },
                    '.row-right i-panel:last-child': {
                        marginLeft: 'auto',
                    },
                    '.float-right': {
                        display: 'flex',
                        justifyContent: 'flex-end'
                    },
                    '.text-underline > *': {
                        textDecoration: 'underline',
                    },
                    '.i-progress': {
                        display: 'flex'
                    }
                }
            },
            '.custom-group--icon': {
                $nest: {
                    'i-icon': {
                        display: 'flex'
                    },
                    '#settingLb > i-icon': {
                        marginLeft: '1rem !important',
                    }
                }
            },
            '#confirmationModal': {
                $nest: {
                    '.modal': {
                        background: Theme.background.modal,
                        width: 600,
                        maxWidth: '95%',
                        padding: '0.75rem 1rem',
                        borderRadius: '1rem',
                        color: Theme.text.primary
                    },
                    '.i-modal_header': {
                        display: 'none',
                    },
                    '.header': {
                        marginTop: '0.5rem',
                        marginBottom: 0,
                        paddingBottom: 0,
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        $nest: {
                            'i-icon': {
                                fill: Theme.colors.primary.main,
                            }
                        }
                    },
                    '.text-warning *': {
                        color: Theme.colors.primary.main,
                    },
                    '.i-modal_content': {
                        padding: '0 1rem 1rem',
                    },
                    'i-button': {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '150px',
                        height: '50px !important',
                        fontWeight: 600,
                        borderRadius: 5,
                        margin: '0.5rem',
                    },
                    '.btn-cancel': {
                        background: `${Theme.text.primary} !important`,
                        color: `${Theme.background.main} !important`,
                    }
                }
            },
            '@media screen and (max-width: 768px)': {
                $nest: {
                    '.custom-container': {
                        width: '480px',
                        maxWidth: '100%'
                    }
                },
            },
        }
    });
    exports.modalStyle = components_4.Styles.style({
        $nest: {
            '.modal': {
                padding: '1rem 1.5rem',
                borderRadius: '0.5rem'
            },
            '.modal .i-modal_header': {
                paddingBottom: '1.5rem'
            }
        }
    });
});
define("@scom/scom-liquidity-provider/global/utils/helper.ts", ["require", "exports", "@ijstech/eth-wallet", "@ijstech/components"], function (require, exports, eth_wallet_2, components_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toWeiInv = exports.limitDecimals = exports.limitInputNumber = exports.isInvalidInput = exports.formatNumberValue = exports.renderBalanceTooltip = exports.formatNumber = exports.formatDate = exports.DefaultDateFormat = exports.DefaultDateTimeFormat = void 0;
    ;
    exports.DefaultDateTimeFormat = 'DD/MM/YYYY HH:mm:ss';
    exports.DefaultDateFormat = 'DD/MM/YYYY';
    const formatDate = (date, customType, showTimezone) => {
        const formatType = customType || exports.DefaultDateFormat;
        const formatted = (0, components_5.moment)(date).format(formatType);
        if (showTimezone) {
            let offsetHour = (0, components_5.moment)().utcOffset() / 60;
            //will look like UTC-2 UTC+2 UTC+0
            return `${formatted} (UTC${offsetHour >= 0 ? "+" : ""}${offsetHour})`;
        }
        return formatted;
    };
    exports.formatDate = formatDate;
    const formatNumber = (value, decimals) => {
        let val = value;
        const minValue = '0.0000001';
        if (typeof value === 'string') {
            val = new eth_wallet_2.BigNumber(value).toNumber();
        }
        else if (typeof value === 'object') {
            val = value.toNumber();
        }
        if (val != 0 && new eth_wallet_2.BigNumber(val).lt(minValue)) {
            return `<${minValue}`;
        }
        return components_5.FormatUtils.formatNumber(val, { decimalFigures: decimals || 4 });
    };
    exports.formatNumber = formatNumber;
    const renderBalanceTooltip = (params, tokenMap, isBold) => {
        const data = (0, exports.formatNumberValue)(params, tokenMap);
        if (typeof data === "object") {
            const { result, tooltip } = data;
            if (isBold) {
                return `<i-label class="bold" tooltip='${JSON.stringify({ content: tooltip })}'>${result}</i-label>`;
            }
            return `<i-label tooltip='${JSON.stringify({ content: tooltip })}'>${result}</i-label>`;
        }
        return data;
    };
    exports.renderBalanceTooltip = renderBalanceTooltip;
    const formatNumberValue = (data, tokenMap) => {
        const { title, value, symbol, icon, prefix, isWrapped, allowZero } = data;
        try {
            let limitDecimals = 18;
            if (symbol) {
                let symb = symbol;
                if (symb.includes('/')) {
                    symb = symb.split('/')[0];
                }
                if (symbol === 'USD') {
                    limitDecimals = 2;
                }
                else {
                    const tokenObj = Object.values(tokenMap).find((token) => token.symbol === symb);
                    if (tokenObj) {
                        limitDecimals = tokenObj.decimals || 18;
                    }
                }
            }
            const val = parseFloat(value);
            const minValue = 0.0001;
            let result;
            let tooltip = `${value}`;
            if (val === 0) {
                result = `0`;
            }
            else if (val < minValue) {
                if (prefix === '$') {
                    result = `< ${prefix}${minValue}`;
                }
                else if (prefix) {
                    result = `${prefix.replace('=', '')} < ${minValue}`;
                }
                else {
                    result = `< ${minValue}`;
                }
                tooltip = val.toLocaleString('en-US', { maximumFractionDigits: limitDecimals });
            }
            else {
                const stringValue = value.toString();
                const decimalsIndex = stringValue.indexOf('.');
                const length = decimalsIndex < 0 ? stringValue.length : stringValue.length - 1;
                let valueFormatted = val.toLocaleString('en-US', { maximumFractionDigits: limitDecimals });
                const arr = valueFormatted.split('.');
                valueFormatted = arr[0];
                if (arr[1]) {
                    valueFormatted = `${arr[0]}.${arr[1].substr(0, 4)}`;
                }
                if (length <= 7) {
                    result = valueFormatted;
                }
                else if (decimalsIndex > 7) {
                    result = `${valueFormatted.substr(0, 9)}...`;
                }
                else if (decimalsIndex > -1) {
                    result = valueFormatted;
                }
                else {
                    const finalVal = valueFormatted.substr(0, 13);
                    result = `${finalVal}${length > 10 ? '...' : ''}`;
                }
                if (result.length > 20 && !result.includes('...')) {
                    result = `${result.substr(0, 13)}...`;
                }
                // Format value for the tooltip
                const parts = stringValue.split('.');
                const intVal = parseInt(parts[0]).toLocaleString('en-US');
                tooltip = `${intVal}`;
                if (parts[1]) {
                    let decVal = parts[1];
                    if (parts[1].length > limitDecimals) {
                        decVal = parseFloat(`0.${parts[1]}`).toLocaleString('en-US', { maximumFractionDigits: limitDecimals });
                        if (decVal == 1) {
                            decVal = parts[1].substr(0, limitDecimals);
                        }
                        else {
                            decVal = decVal.substr(2);
                        }
                    }
                    tooltip += `.${decVal}`;
                }
            }
            if (icon) {
                result += ` <img width="20" src="${icon}" style="padding-bottom: 0.15rem" />`;
            }
            if (symbol) {
                result += ` ${symbol}`;
                tooltip += ` ${symbol}`;
            }
            if (prefix) {
                result = `${(val < minValue && !allowZero) ? '' : prefix}${result}`;
                tooltip = `${prefix}${tooltip}`;
            }
            if (title) {
                result = `${title}: ${result}`;
            }
            if (isWrapped) {
                result = `(${result})`;
            }
            if (symbol === 'USD') {
                return result;
            }
            return { result, tooltip };
        }
        catch {
            return '-';
        }
    };
    exports.formatNumberValue = formatNumberValue;
    const isInvalidInput = (val) => {
        const value = new eth_wallet_2.BigNumber(val);
        if (value.lt(0))
            return true;
        return (val || '').toString().substring(0, 2) === '00' || val === '-';
    };
    exports.isInvalidInput = isInvalidInput;
    const limitInputNumber = (input, decimals) => {
        const amount = input.value;
        if ((0, exports.isInvalidInput)(amount)) {
            input.value = '0';
            return;
        }
        if (!new eth_wallet_2.BigNumber(amount).isNaN()) {
            input.value = (0, exports.limitDecimals)(amount, decimals || 18);
        }
    };
    exports.limitInputNumber = limitInputNumber;
    const limitDecimals = (value, decimals) => {
        let val = value;
        if (typeof value !== 'string') {
            val = val.toString();
        }
        let chart;
        if (val.includes('.')) {
            chart = '.';
        }
        else if (val.includes(',')) {
            chart = ',';
        }
        else {
            return value;
        }
        const parts = val.split(chart);
        let decimalsPart = parts[1];
        if (decimalsPart && decimalsPart.length > decimals) {
            parts[1] = decimalsPart.substr(0, decimals);
        }
        return parts.join(chart);
    };
    exports.limitDecimals = limitDecimals;
    const toWeiInv = (n, unit) => {
        if (new eth_wallet_2.BigNumber(n).eq(0))
            return new eth_wallet_2.BigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        return new eth_wallet_2.BigNumber('1').shiftedBy((unit || 18) * 2).idiv(new eth_wallet_2.BigNumber(n).shiftedBy(unit || 18));
    };
    exports.toWeiInv = toWeiInv;
});
define("@scom/scom-liquidity-provider/global/utils/interfaces.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("@scom/scom-liquidity-provider/global/utils/common.ts", ["require", "exports", "@ijstech/eth-wallet"], function (require, exports, eth_wallet_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerSendTxEvents = void 0;
    const registerSendTxEvents = (sendTxEventHandlers) => {
        const wallet = eth_wallet_3.Wallet.getClientInstance();
        wallet.registerSendTxEvents({
            transactionHash: (error, receipt) => {
                if (sendTxEventHandlers.transactionHash) {
                    sendTxEventHandlers.transactionHash(error, receipt);
                }
            },
            confirmation: (receipt) => {
                if (sendTxEventHandlers.confirmation) {
                    sendTxEventHandlers.confirmation(receipt);
                }
            },
        });
    };
    exports.registerSendTxEvents = registerSendTxEvents;
});
define("@scom/scom-liquidity-provider/global/utils/index.ts", ["require", "exports", "@scom/scom-liquidity-provider/global/utils/helper.ts", "@scom/scom-liquidity-provider/global/utils/interfaces.ts", "@scom/scom-liquidity-provider/global/utils/common.ts"], function (require, exports, helper_1, interfaces_1, common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name='@scom/scom-liquidity-provider/global/utils/index.ts'/> 
    __exportStar(helper_1, exports);
    __exportStar(interfaces_1, exports);
    __exportStar(common_1, exports);
});
define("@scom/scom-liquidity-provider/global/index.ts", ["require", "exports", "@ijstech/eth-wallet", "@scom/scom-liquidity-provider/global/utils/index.ts"], function (require, exports, eth_wallet_4, index_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAddressValid = void 0;
    __exportStar(index_1, exports);
    const isAddressValid = async (address) => {
        let wallet = eth_wallet_4.Wallet.getClientInstance();
        const isValid = wallet.web3.utils.isAddress(address);
        return isValid;
    };
    exports.isAddressValid = isAddressValid;
});
define("@scom/scom-liquidity-provider/liquidity-utils/API.ts", ["require", "exports", "@scom/scom-liquidity-provider/global/index.ts", "@ijstech/eth-wallet", "@scom/scom-liquidity-provider/store/index.ts", "@scom/oswap-openswap-contract", "@scom/scom-token-list", "@ijstech/eth-contract"], function (require, exports, index_2, eth_wallet_5, index_3, oswap_openswap_contract_1, scom_token_list_3, eth_contract_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getGroupQueueInfo = exports.getOfferIndexes = exports.convertWhitelistedAddresses = exports.getQueueStakeToken = exports.lockGroupQueueOffer = exports.removeLiquidity = exports.addLiquidity = exports.getLiquidityProviderAddress = exports.getToBeApprovedTokens = exports.getPairInfo = exports.isPairRegistered = exports.getPair = exports.getAddresses = void 0;
    const ConfigStore = 'OSWAP_ConfigStore';
    const getAddressFromCore = (chainId, key) => {
        let Address = getAddresses(chainId);
        return Address[key];
    };
    function getAddresses(chainId) {
        return index_3.coreAddress[chainId] || {};
    }
    exports.getAddresses = getAddresses;
    const getAddressByKey = (chainId, key) => {
        return getAddressFromCore(chainId, key);
    };
    function toTokenAmount(token, amount) {
        return (eth_wallet_5.BigNumber.isBigNumber(amount) ? amount : new eth_wallet_5.BigNumber(amount.toString())).shiftedBy(Number(token.decimals)).decimalPlaces(0, eth_wallet_5.BigNumber.ROUND_FLOOR);
    }
    function toWei(amount) {
        return (eth_wallet_5.BigNumber.isBigNumber(amount) ? amount : new eth_wallet_5.BigNumber(amount.toString())).shiftedBy(18).decimalPlaces(0);
    }
    const getQueueStakeToken = (chainId) => {
        if (!scom_token_list_3.DefaultERC20Tokens[chainId])
            return null;
        let stakeToken = scom_token_list_3.DefaultERC20Tokens[chainId].find(v => v.symbol == 'OSWAP');
        return stakeToken ? { ...stakeToken, address: stakeToken.address.toLowerCase() } : null;
    };
    exports.getQueueStakeToken = getQueueStakeToken;
    const mapTokenObjectSet = (chainId, obj) => {
        const WETH9 = getWETH(chainId);
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (!obj[key]?.address)
                    obj[key] = WETH9;
            }
        }
        return obj;
    };
    const getTokenObjectByAddress = (state, chainId, address) => {
        if (address.toLowerCase() === getAddressByKey(chainId, 'WETH9').toLowerCase()) {
            return getWETH(chainId);
        }
        let tokenMap = state.getTokenMapByChainId(chainId);
        return tokenMap[address.toLowerCase()];
    };
    const getWETH = (chainId) => {
        let wrappedToken = scom_token_list_3.WETHByChainId[chainId];
        return wrappedToken;
    };
    const getFactoryAddress = (chainId) => {
        try {
            return getAddressFromCore(chainId, "OSWAP_RestrictedFactory");
        }
        catch (error) {
            console.log(`It seems that there are no factory in this network yet`);
        }
        return null;
    };
    const getLiquidityProviderAddress = (chainId) => {
        return getAddressByKey(chainId, "OSWAP_RestrictedLiquidityProvider");
    };
    exports.getLiquidityProviderAddress = getLiquidityProviderAddress;
    const getPair = async (state, tokenA, tokenB) => {
        let pairAddress = '';
        try {
            const wallet = state.getRpcWallet();
            const chainId = state.getChainId();
            let tokens = mapTokenObjectSet(chainId, { tokenA, tokenB });
            let params = { param1: tokens.tokenA.address, param2: tokens.tokenB.address };
            let factoryAddress = getFactoryAddress(chainId);
            let groupQ = new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedFactory(wallet, factoryAddress);
            pairAddress = await groupQ.getPair({ ...params, param3: 0 });
        }
        catch (err) { }
        return pairAddress;
    };
    exports.getPair = getPair;
    function breakDownGroupQOffers(offer) {
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
        };
    }
    const getRestrictedPairCustomParams = async (state) => {
        const FEE_PER_ORDER = "RestrictedPair.feePerOrder";
        const FEE_PER_TRADER = "RestrictedPair.feePerTrader";
        const MAX_DUR = "RestrictedPair.maxDur";
        let wallet = state.getRpcWallet();
        const address = getAddressByKey(state.getChainId(), ConfigStore);
        const configStoreContract = new oswap_openswap_contract_1.Contracts.OSWAP_ConfigStore(wallet, address);
        let feePerOrderRaw = await configStoreContract.customParam(eth_wallet_5.Utils.stringToBytes32(FEE_PER_ORDER).toString());
        let feePerOrder = eth_wallet_5.Utils.fromDecimals(feePerOrderRaw).toString();
        let feePerTraderRaw = await configStoreContract.customParam(eth_wallet_5.Utils.stringToBytes32(FEE_PER_TRADER).toString());
        let feePerTrader = eth_wallet_5.Utils.fromDecimals(feePerTraderRaw).toString();
        let maxDur = await configStoreContract.customParam(eth_wallet_5.Utils.stringToBytes32(MAX_DUR).toString());
        maxDur = parseInt(maxDur, 16).toString();
        return {
            feePerOrder,
            feePerTrader,
            maxDur
        };
    };
    const getPairInfo = async (state, pairAddress, tokenAddress, offerIndex) => {
        const wallet = state.getRpcWallet();
        const chainId = state.getChainId();
        const nativeToken = (0, index_3.getChainNativeToken)(chainId);
        const WETH9Address = getAddressByKey(chainId, 'WETH9');
        const _offerIndex = offerIndex ? new eth_wallet_5.BigNumber(offerIndex) : new eth_wallet_5.BigNumber(0);
        if (tokenAddress == nativeToken.symbol)
            tokenAddress = WETH9Address;
        const factoryAddress = getFactoryAddress(chainId);
        const factoryContract = new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedFactory(wallet, factoryAddress);
        const groupPair = new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedPair(wallet, pairAddress);
        let [token0Address, token1Address, pairIndex] = await Promise.all([
            groupPair.token0(),
            groupPair.token1(),
            factoryContract.pairIdx(pairAddress)
        ]);
        let token0 = getTokenObjectByAddress(state, chainId, token0Address);
        let token1 = getTokenObjectByAddress(state, chainId, token1Address);
        let token = getTokenObjectByAddress(state, chainId, tokenAddress);
        let directDirection = !(new eth_wallet_5.BigNumber(token0Address.toLowerCase()).lt(token1Address.toLowerCase()));
        let direction = directDirection ? token1Address.toLowerCase() != tokenAddress.toLowerCase() : token0Address.toLowerCase() != tokenAddress.toLowerCase();
        let queueSize = (await groupPair.counter(direction)).toNumber();
        let rawOffers = await groupPair.getOffers({ direction, start: 0, length: queueSize });
        let { amounts, endDates } = breakDownGroupQOffers(rawOffers);
        let tokenDecimals = token.decimals;
        let now = new Date().getTime();
        let totalAmount = new eth_wallet_5.BigNumber("0");
        let againstToken = (token0Address.toLowerCase() == tokenAddress.toLowerCase()) ? token1 : token0;
        for (let i = 0; i < amounts.length; i++) {
            if (now >= new Date(endDates[i].toNumber() * 1000).getTime())
                continue;
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
                const restrictedPrice = new eth_wallet_5.BigNumber(offer.restrictedPrice).shiftedBy(-18).toFixed();
                return {
                    amount: new eth_wallet_5.BigNumber(offer.amount).shiftedBy(-Number(tokenDecimals)).toFixed(),
                    reserve: new eth_wallet_5.BigNumber(offer.receiving).shiftedBy(-Number(againstTokenDecimals)).toFixed(),
                    startDate: new Date(offer.startDate.toNumber() * 1000),
                    expire: new Date(offer.expire.toNumber() * 1000),
                    locked: offer.locked,
                    allowAll: offer.allowAll,
                    offerPrice: (0, index_2.toWeiInv)(restrictedPrice).shiftedBy(-18).toFixed(),
                    addresses
                };
            };
            let providerQueuePairInfo = await getProviderQueuePairInfo();
            returnObj = { ...returnObj, ...providerQueuePairInfo };
        }
        return returnObj;
    };
    exports.getPairInfo = getPairInfo;
    async function getGroupQueueInfo(state, pairAddress, token0, token1, offerIndex) {
        const wallet = state.getRpcWallet();
        const chainId = state.getChainId();
        const WETH9Address = getAddressByKey(chainId, 'WETH9');
        const nativeToken = (0, index_3.getChainNativeToken)(chainId);
        const groupPair = new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedPair(wallet, pairAddress);
        let inverseDirection = new eth_wallet_5.BigNumber(token0.address.toLowerCase()).lt(token1.address.toLowerCase());
        let direction = !inverseDirection;
        const offer = await groupPair.offers({ param1: direction, param2: offerIndex });
        let totalAllocation = new eth_wallet_5.BigNumber('0');
        let addresses = await getTradersAllocation(groupPair, direction, offerIndex, token0.decimals, (address, allocation) => {
            totalAllocation = totalAllocation.plus(allocation);
        });
        let price = (0, index_2.toWeiInv)(new eth_wallet_5.BigNumber(offer.restrictedPrice).shiftedBy(-18).toFixed()).shiftedBy(-18).toFixed();
        let data = {
            pairAddress: pairAddress.toLowerCase(),
            fromTokenAddress: token0.address.toLowerCase() == WETH9Address.toLowerCase() ? nativeToken.symbol : token0.address.toLowerCase(),
            toTokenAddress: token1.address.toLowerCase() == WETH9Address.toLowerCase() ? nativeToken.symbol : token1.address.toLowerCase(),
            amount: new eth_wallet_5.BigNumber(offer.amount).shiftedBy(-token0.decimals).toFixed(),
            offerPrice: price,
            startDate: offer.startDate.toNumber() * 1000,
            endDate: offer.expire.toNumber() * 1000,
            state: offer.locked ? 'Locked' : 'Unlocked',
            allowAll: offer.allowAll,
            direct: true,
            offerIndex: offerIndex,
            addresses,
            allocation: totalAllocation.toFixed(),
            willGet: new eth_wallet_5.BigNumber(offer.amount).times(new eth_wallet_5.BigNumber(price)).shiftedBy(-Number(token0.decimals)).toFixed()
        };
        return data;
    }
    exports.getGroupQueueInfo = getGroupQueueInfo;
    const getToBeApprovedTokens = async (chainId, tokenObj, amount, stake) => {
        const WETH9Address = getAddressByKey(chainId, 'WETH9');
        let tokens = mapTokenObjectSet(chainId, { tokenObj });
        let tokenList = [];
        const liqProviderAddress = getLiquidityProviderAddress(chainId);
        // Check token in allowance
        if (tokens.tokenObj.address.toLowerCase() != WETH9Address.toLowerCase()) {
            let allowance = await getTokenAllowance(tokens.tokenObj.address, tokens.tokenObj.decimals, liqProviderAddress);
            if (new eth_wallet_5.BigNumber(amount).gt(allowance))
                tokenList.push(tokens.tokenObj.address.toLowerCase());
        }
        // Check stake token allowance
        if (new eth_wallet_5.BigNumber(stake).gt(0)) {
            let StakeToken = getQueueStakeToken(chainId);
            if (!StakeToken || !StakeToken.address)
                return tokenList;
            let allowance = await getTokenAllowance(StakeToken.address, StakeToken.decimals, liqProviderAddress);
            if (new eth_wallet_5.BigNumber(stake).gt(allowance))
                tokenList.push(StakeToken.address.toLowerCase());
            // If stake token is also token in
            if (tokens.tokenObj.address.toLowerCase() == StakeToken.address.toLowerCase()) {
                if (new eth_wallet_5.BigNumber(stake).plus(amount).gt(allowance))
                    tokenList.push(StakeToken.address.toLowerCase());
            }
        }
        return tokenList;
    };
    exports.getToBeApprovedTokens = getToBeApprovedTokens;
    const getTokenAllowance = async (tokenAddress, tokenDecimals, contractAddress) => {
        let wallet = eth_wallet_5.Wallet.getClientInstance();
        const selectedAddress = wallet.address;
        const ERC20 = new oswap_openswap_contract_1.Contracts.ERC20(wallet, tokenAddress);
        let allowance = await ERC20.allowance({ owner: selectedAddress, spender: contractAddress });
        return allowance.shiftedBy(-tokenDecimals);
    };
    const addLiquidity = async (chainId, tokenA, tokenB, tokenIn, pairIndex, offerIndex, amountIn, allowAll, restrictedPrice, startDate, expire, deadline, whitelistAddress) => {
        let receipt;
        let trader = [];
        let allocation = [];
        whitelistAddress.map(v => {
            if (v.allocation != v.oldAllocation) {
                trader.push(v.address);
                allocation.push(toTokenAmount(tokenIn, v.allocation));
            }
        });
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
        const liquidityContract = new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedLiquidityProvider1(eth_wallet_5.Wallet.getClientInstance(), getLiquidityProviderAddress(chainId));
        const getReceipt = async (param, value) => {
            if (trader.length == 0) {
                receipt = value !== undefined ? await liquidityContract.addLiquidityETH(param, value) : await liquidityContract.addLiquidityETH(param, 0);
            }
            else {
                const params = {
                    param: [
                        new eth_wallet_5.BigNumber(param.tokenA.toLowerCase()),
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
        };
        if (!tokenA.address || !tokenB.address) { // if the pair contain a native token
            let erc20Token = tokenA.address ? tokenA : tokenB;
            if (!tokenIn.address) { // if the incoming token is native
                getReceipt({
                    tokenA: erc20Token.address,
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
            }
            else { // if the incoming token is not native
                getReceipt({
                    tokenA: erc20Token.address,
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
        }
        else { // if the pair does not contain a native token
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
            };
            if (trader.length == 0) {
                receipt = await liquidityContract.addLiquidity(paramObj);
            }
            else {
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
                };
                const param = Object.values(paramObj);
                const params = { param, trader, allocation };
                receipt = await liquidityContract.addLiquidityAndTrader(params);
            }
        }
        return receipt;
    };
    exports.addLiquidity = addLiquidity;
    const removeLiquidity = async (chainId, tokenA, tokenB, tokenOut, amountOut, receivingOut, orderIndex, deadline) => {
        let address = getLiquidityProviderAddress(chainId);
        const toAddress = eth_wallet_5.Wallet.getClientInstance().address;
        const liquidityProviderContract = new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedLiquidityProvider1(eth_wallet_5.Wallet.getClientInstance(), address);
        let receivingToken = tokenA.address == tokenOut.address ? tokenB : tokenA;
        if (!amountOut)
            amountOut = '0';
        if (!receivingOut)
            receivingOut = '0';
        if (!tokenA.address || !tokenB.address) {
            let erc20Token = tokenA.address ? tokenA : tokenB;
            var receipt = await liquidityProviderContract.removeLiquidityETH({
                tokenA: erc20Token.address,
                removingTokenA: erc20Token == tokenOut,
                to: toAddress,
                pairIndex: 0,
                offerIndex: orderIndex,
                amountOut: toTokenAmount(tokenOut, amountOut),
                receivingOut: toTokenAmount(receivingToken, receivingOut),
                deadline
            });
        }
        else {
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
    };
    exports.removeLiquidity = removeLiquidity;
    const lockGroupQueueOffer = async (chainId, pairAddress, tokenA, tokenB, offerIndex) => {
        const wallet = eth_wallet_5.Wallet.getClientInstance();
        const WETH9Address = getAddressByKey(chainId, 'WETH9');
        // BigNumber constructor, only string values in hexadecimal literal form, e.g. '0xff' or '0xFF' (but not '0xfF') are valid
        const tokenInAddress = (tokenA?.address ?? WETH9Address).toLowerCase();
        const tokenOutAddress = (tokenB?.address ?? WETH9Address).toLowerCase();
        const direction = (new eth_wallet_5.BigNumber(tokenInAddress).lt(tokenOutAddress)) ? false : true;
        const oraclePairContract = new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedPair(wallet, pairAddress);
        const receipt = await oraclePairContract.lockOffer({ direction, index: offerIndex });
        return receipt;
    };
    exports.lockGroupQueueOffer = lockGroupQueueOffer;
    const convertWhitelistedAddresses = (inputText) => {
        function splitByMultipleSeparator(input, separators) {
            for (let i = 1; i < separators.length; i++) {
                input = input.replace(separators[i], separators[0]);
            }
            return input.split(separators[0]).filter(text => text != "").map(v => v.trim());
        }
        let data = [];
        let textArray = splitByMultipleSeparator(inputText, [",", /\s/g, ":", "="]);
        if (textArray.length % 2 != 0)
            return [];
        for (let i = 0; i < textArray.length; i += 2) {
            data.push({
                address: textArray[i],
                allocation: Number(textArray[i + 1])
            });
        }
        return data;
    };
    exports.convertWhitelistedAddresses = convertWhitelistedAddresses;
    async function getTradersAllocation(pair, direction, offerIndex, allocationTokenDecimals, callbackPerRecord) {
        let traderLength = (await pair.getApprovedTraderLength({ direction, offerIndex })).toNumber();
        let tasks = [];
        let allo = [];
        if (traderLength > 0) {
            const wallet = eth_wallet_5.Wallet.getClientInstance();
            let calls = [];
            for (let i = 0; i < traderLength; i += 100) {
                calls.push({
                    contract: pair,
                    methodName: 'getApprovedTrader',
                    params: [direction ? 'true' : 'false', offerIndex.toString(), i.toString(), '100'],
                    to: pair.address
                });
            }
            const multicallResult = await wallet.doMulticall(calls);
            for (let i = 0; i < multicallResult.length; i++) {
                let approvedTrader = multicallResult[i];
                let approvedTraderTrader = approvedTrader[0];
                let approvedTraderAllocation = approvedTrader[1];
                allo.push(...approvedTraderTrader.map((address, i) => {
                    let allocation = new eth_wallet_5.BigNumber(approvedTraderAllocation[i]).shiftedBy(-allocationTokenDecimals).toFixed();
                    if (callbackPerRecord)
                        callbackPerRecord(address, allocation);
                    return { address, allocation };
                }));
            }
        }
        return allo;
    }
    async function isPairRegistered(state, tokenA, tokenB) {
        try {
            let oracleAddress = await new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedFactory(state.getRpcWallet(), getFactoryAddress(state.getChainId())).oracles({ param1: tokenA, param2: tokenB });
            return oracleAddress != eth_contract_1.nullAddress;
        }
        catch (err) { }
        return false;
    }
    exports.isPairRegistered = isPairRegistered;
    async function getOfferIndexes(state, pairAddress, tokenA, tokenB) {
        let indexes = [];
        try {
            const wallet = state.getRpcWallet();
            const chainId = state.getChainId();
            const provider = wallet.address;
            const pairContract = new oswap_openswap_contract_1.Contracts.OSWAP_RestrictedPair(wallet, pairAddress);
            const WETH9Address = getAddressByKey(chainId, 'WETH9');
            let token0Address = tokenA.startsWith('0x') ? tokenA : WETH9Address;
            let token1Address = tokenB.startsWith('0x') ? tokenB : WETH9Address;
            let inverseDirection = new eth_wallet_5.BigNumber(token0Address.toLowerCase()).lt(token1Address.toLowerCase());
            let direction = !inverseDirection;
            let rawOffers = await pairContract.getProviderOffer({ provider, direction, start: 0, length: 100 });
            indexes = rawOffers.index;
        }
        catch (err) { }
        return indexes;
    }
    exports.getOfferIndexes = getOfferIndexes;
});
define("@scom/scom-liquidity-provider/liquidity-utils/model.ts", ["require", "exports", "@ijstech/eth-wallet", "@scom/scom-liquidity-provider/global/index.ts", "@scom/scom-liquidity-provider/liquidity-utils/API.ts", "@ijstech/components", "@scom/scom-token-list", "@scom/oswap-openswap-contract"], function (require, exports, eth_wallet_6, index_4, API_1, components_6, scom_token_list_4, oswap_openswap_contract_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Model = exports.toLastSecond = exports.LockState = exports.OfferState = exports.Action = exports.Stage = void 0;
    const Theme = components_6.Styles.Theme.ThemeVars;
    var Stage;
    (function (Stage) {
        Stage[Stage["NONE"] = 0] = "NONE";
        Stage[Stage["SET_AMOUNT"] = 1] = "SET_AMOUNT";
        Stage[Stage["SET_OFFER_PRICE"] = 2] = "SET_OFFER_PRICE";
        Stage[Stage["SET_START_DATE"] = 3] = "SET_START_DATE";
        Stage[Stage["SET_END_DATE"] = 4] = "SET_END_DATE";
        Stage[Stage["SET_OFFER_TO"] = 5] = "SET_OFFER_TO";
        Stage[Stage["SET_LOCKED"] = 6] = "SET_LOCKED";
        Stage[Stage["SET_ADDRESS"] = 7] = "SET_ADDRESS";
        Stage[Stage["FIRST_TOKEN_APPROVAL"] = 8] = "FIRST_TOKEN_APPROVAL";
        Stage[Stage["WAITING_FOR_FIRST_TOKEN_APPROVAL"] = 9] = "WAITING_FOR_FIRST_TOKEN_APPROVAL";
        Stage[Stage["GOV_TOKEN_APPROVAL"] = 10] = "GOV_TOKEN_APPROVAL";
        Stage[Stage["WAITING_FOR_GOV_TOKEN_APPROVAL"] = 11] = "WAITING_FOR_GOV_TOKEN_APPROVAL";
        Stage[Stage["SUBMIT"] = 12] = "SUBMIT";
    })(Stage = exports.Stage || (exports.Stage = {}));
    var Action;
    (function (Action) {
        Action[Action["CREATE"] = 0] = "CREATE";
        Action[Action["ADD"] = 1] = "ADD";
        Action[Action["REMOVE"] = 2] = "REMOVE";
        Action[Action["LOCK"] = 3] = "LOCK";
    })(Action = exports.Action || (exports.Action = {}));
    var OfferState;
    (function (OfferState) {
        OfferState["Everyone"] = "Everyone";
        OfferState["Whitelist"] = "Whitelist Addresses";
    })(OfferState = exports.OfferState || (exports.OfferState = {}));
    var LockState;
    (function (LockState) {
        LockState["Locked"] = "Locked";
        LockState["Unlocked"] = "Unlocked";
    })(LockState = exports.LockState || (exports.LockState = {}));
    const toLastSecond = (datetime) => {
        return (0, components_6.moment)(datetime).endOf('day');
    };
    exports.toLastSecond = toLastSecond;
    class Model {
        get fromTokenObject() {
            const tokenMap = this.state.getTokenMapByChainId(this.state.getChainId());
            return tokenMap[this.fromTokenAddress];
        }
        get toTokenObject() {
            const tokenMap = this.state.getTokenMapByChainId(this.state.getChainId());
            return tokenMap[this.toTokenAddress];
        }
        get fromTokenSymbol() {
            return this.fromTokenObject ? this.fromTokenObject.symbol : '';
        }
        get enableApproveAllowance() {
            if (this.actionType !== Action.CREATE)
                return true;
            return this.fromTokenInputValid;
        }
        get fromTokenInputValid() {
            const allowZero = [Action.CREATE, Action.ADD].some(n => n === this.actionType);
            if (allowZero && this.fromTokenInputText === '') {
                return false;
            }
            return (this.fromTokenInput.gt(0) || allowZero) && this.fromTokenInput.lte(this.fromTokenBalanceExact);
        }
        get offerPriceInputValid() {
            return this.offerPriceText && new eth_wallet_6.BigNumber(this.offerPriceText).gt(0);
        }
        get fromTokenBalanceExact() {
            const tokenBalances = scom_token_list_4.tokenStore.getTokenBalancesByChainId(this.state.getChainId()) || {};
            if ([Action.CREATE, Action.ADD].some(n => n === this.actionType)) {
                return tokenBalances[this.fromTokenAddress]
                    ? new eth_wallet_6.BigNumber(tokenBalances[this.fromTokenAddress])
                    : new eth_wallet_6.BigNumber(0);
            }
            if (this.actionType === Action.REMOVE) {
                return new eth_wallet_6.BigNumber(this.summaryData.amount);
            }
        }
        get govTokenBalanceExact() {
            const chainId = this.state.getChainId();
            let stakeToken = (0, API_1.getQueueStakeToken)(chainId);
            if (!stakeToken)
                return new eth_wallet_6.BigNumber(0);
            const tokenBalances = scom_token_list_4.tokenStore.getTokenBalancesByChainId(this.state.getChainId()) || {};
            return tokenBalances[stakeToken.address]
                ? new eth_wallet_6.BigNumber(tokenBalances[stakeToken.address])
                : new eth_wallet_6.BigNumber(0);
        }
        get getJoinValidation() {
            switch (this.currentStage) {
                case Stage.SET_AMOUNT:
                    return this.fromTokenInputValid;
                case Stage.SET_OFFER_PRICE:
                    return this.offerPriceInputValid;
                case Stage.SET_START_DATE:
                case Stage.SET_END_DATE:
                    return this.startDate && this.endDate &&
                        this.startDate.isSameOrAfter((0, components_6.moment)()) && this.startDate.isSameOrBefore(this.endDate) &&
                        this.endDate.isSameOrBefore((0, components_6.moment)().add(this.summaryData.maxDur, 'seconds'));
                default:
                    return true;
            }
        }
        get proceedButtonText() {
            if (!this.state.isRpcWalletConnected()) {
                return 'Switch Network';
            }
            const stakeToken = (0, API_1.getQueueStakeToken)(this.state.getChainId());
            if (!stakeToken)
                return '';
            if (this.fromTokenInput.gt(this.fromTokenBalanceExact)) {
                return `Insufficient ${this.fromTokenSymbol} balance`;
            }
            if (this.actionType === Action.CREATE && this.offerPriceText && !this.offerPriceInputValid) {
                return 'Offer Price must be greater than 0';
            }
            if (new eth_wallet_6.BigNumber(this.fee).gt(this.govTokenBalanceExact)) {
                return `Insufficient ${stakeToken.symbol} balance`;
            }
            if (this.currentStage === Stage.FIRST_TOKEN_APPROVAL) {
                return `APPROVE ${this.fromTokenSymbol} (1/2)`;
            }
            if (this.currentStage === Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL) {
                return `APPROVING ${this.fromTokenSymbol} (1/2)`;
            }
            if (this.currentStage === Stage.GOV_TOKEN_APPROVAL) {
                return `APPROVE OSWAP (2/2)`;
            }
            if (this.currentStage === Stage.WAITING_FOR_GOV_TOKEN_APPROVAL) {
                return `APPROVING OSWAP (2/2)`;
            }
            if (this.currentStage === Stage.SUBMIT) {
                return `Submit`;
            }
            return `Submit`;
        }
        get nextButtonText() {
            if (!this.state.isRpcWalletConnected()) {
                return 'Switch Network';
            }
            const stakeToken = (0, API_1.getQueueStakeToken)(this.state.getChainId());
            if (!stakeToken)
                return '';
            if (this.fromTokenInput.gt(this.fromTokenBalanceExact)) {
                return `Insufficient ${this.fromTokenSymbol} balance`;
            }
            if (this.offerPriceText && !this.offerPriceInputValid) {
                return 'Offer Price must be greater than 0';
            }
            if (this.startDate) {
                if (this.startDate.isBefore((0, components_6.moment)())) {
                    return 'Start time cannot be earlier than current time';
                }
                if (this.endDate && this.startDate.isAfter(this.endDate)) {
                    return 'End time cannot be earlier than start time';
                }
                const maxDate = (0, components_6.moment)().add(this.summaryData.maxDur, 'seconds');
                if (this.endDate && this.endDate.isAfter(maxDate)) {
                    return `End time must be same or before ${maxDate.format(index_4.DefaultDateFormat)}`;
                }
            }
            if (new eth_wallet_6.BigNumber(this.fee).gt(this.govTokenBalanceExact) && this.currentStage === Stage.SUBMIT) {
                return `Insufficient ${stakeToken.symbol} balance`;
            }
            return `Next`;
        }
        get isFirstTokenApproved() {
            return this.currentStage >= Stage.GOV_TOKEN_APPROVAL;
        }
        get isGovTokenApproved() {
            return this.currentStage == Stage.SUBMIT;
        }
        get isWaitingForApproval() {
            return [Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL, Stage.WAITING_FOR_GOV_TOKEN_APPROVAL].includes(this.currentStage);
        }
        get newAmount() {
            if (this.actionType === Action.CREATE) {
                return this.fromTokenInput;
            }
            const amount = this.summaryData.amount;
            if (this.actionType === Action.ADD) {
                return new eth_wallet_6.BigNumber(amount).plus(this.fromTokenInput);
            }
            if (this.actionType === Action.REMOVE) {
                return new eth_wallet_6.BigNumber(amount).minus(this.fromTokenInput);
            }
            return new eth_wallet_6.BigNumber(amount);
        }
        get listAddress() {
            const newAddresses = this.addresses || [];
            const oldAddresses = this.summaryData.addresses || [];
            let list = [];
            for (const item of newAddresses.concat(oldAddresses)) {
                if (!list.find((f) => f.address === item.address)) {
                    list.push(item);
                }
            }
            return list;
        }
        get newTotalAddress() {
            return this.listAddress.length;
        }
        get newTotalAllocation() {
            const totalAddress = this.listAddress.reduce((pv, cv) => pv + parseFloat(cv.allocation), 0);
            return totalAddress;
        }
        get currentTotalAllocation() {
            const totalAddress = this.summaryData.addresses.reduce((pv, cv) => pv + parseFloat(cv.allocation), 0);
            return totalAddress;
        }
        setSummaryData(response, updateField) {
            if (updateField) {
                this.summaryData.newAmount = this.newAmount;
                this.summaryData.newOfferPrice = this.offerPriceText;
                this.summaryData.offerTo = this.offerTo;
                this.summaryData.fee = this.fee;
                this.summaryData.newStartDate = this.startDate;
                this.summaryData.newEndDate = this.endDate;
                this.summaryData.switchLock = this.switchLock;
                this.summaryData.newAddresses = this.addresses;
                this.summaryData.newTotalAddress = this.newTotalAddress;
                this.summaryData.newTotalAllocation = this.newTotalAllocation;
                return;
            }
            if (response) {
                this.fromTokenAddress = response.fromTokenAddress;
                this.toTokenAddress = response.toTokenAddress;
                this.pairCustomParams = {
                    feePerOrder: response.feePerOrder,
                    feePerTrader: response.feePerTrader
                };
                this.summaryData.amount = response.amount;
                this.summaryData.newAmount = this.newAmount;
                this.summaryData.offerPrice = response.offerPrice;
                this.summaryData.newOfferPrice = this.offerPriceText;
                this.summaryData.offerTo = this.offerTo;
                this.summaryData.fee = this.fee;
                this.summaryData.startDate = (0, components_6.moment)(response.startDate);
                this.summaryData.newStartDate = this.startDate;
                this.summaryData.endDate = (0, components_6.moment)(response.expire);
                this.summaryData.newEndDate = this.endDate;
                this.summaryData.switchLock = this.switchLock;
                this.summaryData.addresses = response.addresses;
                this.summaryData.newAddresses = this.addresses;
                this.summaryData.newTotalAddress = this.newTotalAddress;
                this.summaryData.newTotalAllocation = this.newTotalAllocation;
                this.summaryData.price = response.price;
                this.summaryData.staked = response.staked;
                this.summaryData.reserve = response.reserve;
                this.summaryData.pairIndex = response.pairIndex;
                this.summaryData.fromTokenAddress = response.fromTokenAddress;
                this.summaryData.toTokenAddress = response.toTokenAddress;
                this.summaryData.oldExpiryDate = (0, components_6.moment)(response.expire).format('YYYY-MM-DD');
                this.summaryData.pairCustomParams = response.pairCustomParams;
                this.summaryData.maxDur = response.maxDur;
            }
        }
        get validateEmptyInput() {
            const fromTokenInputCheck = this.fromTokenInput && this.fromTokenInput.gt(0);
            const offerPriceCheck = this.offerPriceInputValid;
            const startDateCheck = !!this.startDate;
            const endDateCheck = !!this.endDate;
            const stateCheck = !!this.switchLock;
            const addressesCheck = this.addresses && this.addresses.length;
            if (Action.CREATE === this.actionType) {
                if (!fromTokenInputCheck || !offerPriceCheck || !startDateCheck || !endDateCheck || !stateCheck || !addressesCheck) {
                    return false;
                }
            }
            else if (this.actionType === Action.ADD) {
                if (!offerPriceCheck || !startDateCheck || !endDateCheck) {
                    return false;
                }
            }
            return true;
        }
        get fromTokenBalance() {
            return this.fromTokenBalanceExact.toNumber();
        }
        get govTokenBalance() {
            return this.govTokenBalanceExact.toNumber();
        }
        get fromTokenDecimals() {
            return this.state.getTokenDecimals(this.state.getChainId(), this.fromTokenAddress);
        }
        get adviceTexts() {
            let arr = [];
            switch (this.currentStage) {
                case Stage.NONE:
                    arr.push('Please edit the input field to update your queue');
                    break;
                case Stage.SET_AMOUNT:
                    let msg;
                    if (this.actionType === Action.CREATE) {
                        msg = `Input the total amount of ${this.fromTokenSymbol} you would like to sell.`;
                    }
                    else if (this.actionType === Action.ADD) {
                        msg = 'Please input the amount of the token you wish to add to the liquidity.';
                    }
                    else {
                        msg = 'Please input the amount of the token you wish to remove from the liquidity.';
                    }
                    arr.push(msg);
                    break;
                case Stage.SET_OFFER_PRICE:
                    arr.push('Specify the Offer Price.');
                    break;
                case Stage.SET_START_DATE:
                case Stage.SET_END_DATE:
                    arr.push('Enter validity period (start & end).');
                    break;
                case Stage.SET_LOCKED:
                    arr.push('By selecting locked, you can not withdraw your token until the queues are expired.');
                    break;
                case Stage.SET_OFFER_TO:
                    arr.push('Set offer to Everyone or whitelist addresses');
                    break;
                case Stage.SET_ADDRESS:
                    if (this.addresses && this.addresses.length) {
                        arr.push('Manage whitelist addresses & allocation.');
                    }
                    else {
                        arr.push('Add whitelist addresses & allocation.');
                    }
                    break;
                case Stage.FIRST_TOKEN_APPROVAL:
                    arr.push('Please click below to execute the first approval for this order to proceed with this trade.');
                    break;
                case Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL:
                    arr.push('Please wait for approval.');
                    break;
                case Stage.GOV_TOKEN_APPROVAL:
                    arr.push('Please click below to execute the second approval for this order to proceed with this trade.');
                    break;
                case Stage.WAITING_FOR_GOV_TOKEN_APPROVAL:
                    arr.push('Please wait for approval.');
                    break;
                case Stage.SUBMIT:
                    arr.push('Please review all information in the order summary. Once confirmed all information is correct you can now click on Submit to execute the order.');
                    break;
            }
            return arr;
        }
        constructor(state, pairAddress, fromTokenAddress, offerIndex, actionType) {
            this.currentStage = Stage.NONE;
            this.fromTokenAddress = '';
            this.toTokenAddress = '';
            this.actionType = 0;
            this.pairIndex = 0;
            this.isFirstLoad = true;
            this.fromTokenInput = new eth_wallet_6.BigNumber(0);
            this.fromTokenInputText = '';
            this.offerPriceText = '';
            this.offerTo = OfferState.Everyone;
            this.originalFee = '0';
            this.whitelistFee = null;
            this.fee = '0';
            this.switchLock = LockState.Unlocked;
            this.addresses = [];
            this.summaryData = {
                amount: '0',
                offerPrice: this.offerPriceText,
                offerTo: this.offerTo,
                startDate: null,
                endDate: null,
                switchLock: '',
                addresses: [],
                reserve: '0',
                maxDur: 3600 * 24 * 180, // default 3 months
            };
            this.isProceedButtonDisabled = () => {
                if (!this.state.isRpcWalletConnected())
                    return false;
                if (Action.CREATE === this.actionType) {
                    if (!this.getJoinValidation)
                        return true;
                }
                else {
                    if (!this.validateEmptyInput || !this.fromTokenInputValid)
                        return true;
                    if (Action.ADD === this.actionType && this.fromTokenInput.eq(0) && this.newTotalAddress === this.summaryData.addresses.length && this.currentTotalAllocation == this.newTotalAllocation) {
                        return true;
                    }
                }
                if ([Stage.NONE, Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL, Stage.WAITING_FOR_GOV_TOKEN_APPROVAL].includes(this.currentStage)) {
                    return true;
                }
                return false;
            };
            this.setCurrentStage = (stage) => {
                this.currentStage = stage;
            };
            this.getState = () => {
                return {
                    currentStage: () => this.currentStage,
                    setCurrentStage: this.setCurrentStage,
                    fromTokenAddress: () => this.fromTokenAddress,
                    toTokenAddress: () => this.toTokenAddress,
                    fromTokenObject: () => this.fromTokenObject,
                    toTokenObject: () => this.toTokenObject,
                    fromTokenInput: () => this.fromTokenInput,
                    fromTokenInputText: () => this.fromTokenInputText,
                    isProceedButtonDisabled: this.isProceedButtonDisabled,
                    proceedButtonText: () => this.proceedButtonText,
                    nextButtonText: () => this.nextButtonText,
                    offerPriceText: () => this.offerPriceText,
                    offerPriceInputTextChange: this.offerPriceInputTextChange,
                    offerTo: () => this.offerTo,
                    offerToChange: this.offerToChange,
                    summaryData: () => this.summaryData,
                    adviceTexts: () => this.adviceTexts,
                    isFirstTokenApproved: () => this.isFirstTokenApproved,
                    isGovTokenApproved: () => this.isGovTokenApproved,
                    isWaitingForApproval: () => this.isWaitingForApproval,
                    fromTokenInputTextChange: this.fromTokenInputTextChange,
                    fromTokenBalance: () => this.fromTokenBalance,
                    govTokenBalance: () => this.govTokenBalance,
                    proceed: this.proceed,
                    fetchData: this.fetchData,
                    fromTokenInputValid: () => this.fromTokenInputValid,
                    enableApproveAllowance: () => this.enableApproveAllowance,
                    startDate: () => this.startDate,
                    endDate: () => this.endDate,
                    startDateChange: this.startDateChange,
                    endDateChange: this.endDateChange,
                    switchLock: () => this.switchLock,
                    addresses: () => this.addresses,
                    addressChange: this.addressChange,
                    pairCustomParams: () => this.pairCustomParams,
                    fee: () => this.fee,
                    feeChange: this.feeChange,
                    setMaxBalanceToFromToken: this.setMaxBalanceToFromToken,
                    newAmount: () => this.newAmount,
                    newTotalAddress: () => this.newTotalAddress,
                    newTotalAllocation: () => this.newTotalAllocation,
                    setSummaryData: (value) => this.setSummaryData({}, value),
                    setOnApproving: (callback) => { this.onApproving = callback; },
                    setOnApproved: (callback) => { this.onApproved = callback; }
                };
            };
            this.fetchData = async () => {
                if (this.actionType === Action.CREATE) {
                    const response = await (0, API_1.getPairInfo)(this.state, this.pairAddress, this.fromTokenAddress);
                    this.toTokenAddress = response.toTokenAddress || '';
                    if (this.isFirstLoad) {
                        this.isFirstLoad = false;
                        this.fee = response.feePerOrder;
                        this.originalFee = response.feePerOrder;
                    }
                    this.setSummaryData(response);
                }
                else if (this.actionType === Action.ADD) {
                    const response = await (0, API_1.getPairInfo)(this.state, this.pairAddress, this.fromTokenAddress, this.offerIndex);
                    this.toTokenAddress = response.toTokenAddress;
                    if (this.isFirstLoad) {
                        this.isFirstLoad = false;
                        this.offerPriceText = response.offerPrice;
                        this.startDate = (0, components_6.moment)(response.startDate);
                        this.endDate = (0, components_6.moment)(response.expire);
                        this.switchLock = response.locked ? LockState.Locked : LockState.Unlocked;
                        this.offerTo = response.allowAll ? OfferState.Everyone : OfferState.Whitelist;
                        this.addresses = response.addresses;
                        await this.fromTokenInputTextChange('');
                        await this.getNextTokenApprovalStage();
                    }
                    this.setSummaryData(response);
                }
                else {
                    const response = await (0, API_1.getPairInfo)(this.state, this.pairAddress, this.fromTokenAddress, this.offerIndex);
                    this.toTokenAddress = response.toTokenAddress;
                    this.offerPriceText = response.offerPrice;
                    this.startDate = (0, components_6.moment)(response.startDate);
                    this.endDate = (0, components_6.moment)(response.expire);
                    this.switchLock = response.locked ? LockState.Locked : LockState.Unlocked;
                    this.offerTo = response.allowAll ? OfferState.Everyone : OfferState.Whitelist;
                    this.addresses = response.addresses;
                    this.setSummaryData(response);
                }
            };
            this.proceed = async () => {
                const stakeToken = (0, API_1.getQueueStakeToken)(this.state.getChainId());
                if (!stakeToken)
                    return;
                if (this.actionType === Action.ADD) {
                    await this.getNextTokenApprovalStage();
                }
                else if (this.actionType === Action.REMOVE) {
                    this.currentStage = Stage.SUBMIT;
                }
                if (this.currentStage === Stage.SET_AMOUNT) {
                    this.currentStage = Stage.SET_OFFER_PRICE;
                }
                else if (this.currentStage === Stage.SET_OFFER_PRICE) {
                    this.currentStage = Stage.SET_START_DATE;
                }
                else if (this.currentStage === Stage.SET_START_DATE) {
                    this.currentStage = Stage.SET_END_DATE;
                }
                else if (this.currentStage === Stage.SET_END_DATE) {
                    this.currentStage = Stage.SET_OFFER_TO;
                }
                else if (this.currentStage === Stage.SET_OFFER_TO) {
                    const isCreation = Action.CREATE === this.actionType;
                    const isAddressShown = !isCreation || (isCreation && this.offerTo === OfferState.Whitelist);
                    if (isAddressShown) {
                        this.currentStage = Stage.SET_ADDRESS;
                    }
                    else {
                        await this.getNextTokenApprovalStage();
                    }
                }
                else if (this.currentStage === Stage.SET_ADDRESS) {
                    await this.getNextTokenApprovalStage();
                }
                else if (this.currentStage === Stage.FIRST_TOKEN_APPROVAL) {
                    await this.approveToken(this.fromTokenObject);
                }
                else if (this.currentStage === Stage.GOV_TOKEN_APPROVAL) {
                    await this.approveToken(stakeToken);
                }
                else if (this.currentStage === Stage.SUBMIT) {
                    this.approvalModelAction.doPayAction();
                }
            };
            this.fromTokenInputTextChange = async (value) => {
                this.fromTokenInputText = (0, index_4.limitDecimals)(value, this.fromTokenDecimals);
                this.fromTokenInput = new eth_wallet_6.BigNumber(this.fromTokenInputText);
                if (this.fromTokenInput.isNaN()) {
                    this.fromTokenInput = new eth_wallet_6.BigNumber(0);
                }
                else {
                    this.fromTokenInputChange();
                }
            };
            this.setMaxBalanceToFromToken = () => {
                this.fromTokenInput = this.fromTokenBalanceExact;
                this.fromTokenInputText = this.fromTokenInput.toString();
                this.fromTokenInputChange();
            };
            this.fromTokenInputChange = async () => {
                if (this.actionType != Action.CREATE) {
                    if (this.fromTokenInputValid) {
                        await this.getNextTokenApprovalStage();
                    }
                }
            };
            this.offerPriceInputTextChange = (value) => {
                this.offerPriceText = value;
            };
            this.startDateChange = (value) => {
                this.startDate = value ? (0, components_6.moment)(value, 'DD/MM/YYYY HH:mm') : null;
            };
            this.endDateChange = (value) => {
                this.endDate = value ? (0, components_6.moment)(value, 'DD/MM/YYYY HH:mm') : null;
            };
            this.offerToChange = (value) => {
                this.offerTo = value;
                if (value === OfferState.Everyone) {
                    this.fee = this.originalFee.toString();
                }
                else {
                    this.fee = this.whitelistFee === null ? this.originalFee.toString() : this.whitelistFee.toString();
                }
            };
            this.addressChange = (value) => {
                this.addresses = value;
            };
            this.feeChange = (value) => {
                this.whitelistFee = value;
                this.fee = value;
            };
            this.state = state;
            this.pairAddress = pairAddress;
            this.fromTokenAddress = fromTokenAddress;
            this.offerIndex = offerIndex;
            this.actionType = actionType;
            if (this.actionType === Action.CREATE) {
                this.currentStage = Stage.SET_AMOUNT;
            }
            else {
                this.currentStage = Stage.NONE;
            }
            scom_token_list_4.tokenStore.updateTokenBalancesByChainId(this.state.getChainId());
            this.initApprovalModelAction();
        }
        showTxStatus(status, content) {
            if (this.onShowTxStatus) {
                this.onShowTxStatus(status, content);
            }
        }
        setSubmitBtnStatus(isLoading, isApproval, offerIndex) {
            if (this.onSubmitBtnStatus) {
                this.onSubmitBtnStatus(isLoading, isApproval, offerIndex);
            }
        }
        async initApprovalModelAction() {
            const address = (0, API_1.getLiquidityProviderAddress)(this.state.getChainId());
            this.approvalModelAction = await this.state.setApprovalModelAction({
                sender: this,
                payAction: async () => {
                    const deadline = Math.floor(Date.now() / 1000) + this.state.transactionDeadline * 60;
                    if (this.actionType === Action.CREATE) {
                        this.addLiquidityAction(this.endDate.unix(), deadline);
                    }
                    else if (this.actionType === Action.ADD) {
                        let pair = new oswap_openswap_contract_2.Contracts.OSWAP_RestrictedPair(this.state.getRpcWallet(), this.pairAddress);
                        let direction = (await pair.token0()).toLowerCase() == this.toTokenAddress.toLowerCase();
                        let endDatetime = (await pair.offers({ param1: direction, param2: this.offerIndex })).expire;
                        this.addLiquidityAction(endDatetime.toNumber(), deadline);
                    }
                    else {
                        this.removeLiquidityAction(deadline, false);
                    }
                },
                onToBeApproved: async (token) => {
                },
                onToBePaid: async (token) => {
                },
                onApproving: async (token, receipt) => {
                    let waitingStage = this.currentStage === Stage.FIRST_TOKEN_APPROVAL ? Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL : Stage.WAITING_FOR_GOV_TOKEN_APPROVAL;
                    this.currentStage = waitingStage;
                    this.showTxStatus('success', receipt);
                    this.setSubmitBtnStatus(true, true);
                    if (this.onApproving)
                        this.onApproving(token, receipt);
                },
                onApproved: async (token) => {
                    await this.getNextTokenApprovalStage();
                    this.setSubmitBtnStatus(false, true);
                    if (this.onApproved)
                        this.onApproved(token);
                },
                onApprovingError: async (token, err) => {
                    this.showTxStatus('error', err);
                    this.setSubmitBtnStatus(false, true);
                },
                onPaying: async (receipt) => {
                    this.showTxStatus('success', receipt);
                    this.setSubmitBtnStatus(true);
                },
                onPaid: async (receipt) => {
                    scom_token_list_4.tokenStore.updateTokenBalancesByChainId(this.state.getChainId());
                    let offerIndex;
                    if (this.actionType === Action.CREATE) {
                        const offerIndexes = await (0, API_1.getOfferIndexes)(this.state, this.pairAddress, this.fromTokenAddress, this.toTokenAddress);
                        console.log(offerIndexes);
                        offerIndex = offerIndexes[offerIndexes.length - 1].toNumber();
                        this.setSubmitBtnStatus(false, false, offerIndex);
                    }
                    else {
                        this.setSubmitBtnStatus(false, false);
                        if (this.onBack)
                            this.onBack();
                    }
                    let message = this.actionType === Action.CREATE ? "Offer Index: " + offerIndex : undefined;
                    const fromToken = this.fromTokenObject;
                    const toToken = this.toTokenObject;
                    if (this.state.handleUpdateStepStatus) {
                        let data = {
                            status: "Completed",
                            color: Theme.colors.success.main,
                            message
                        };
                        if (this.actionType === Action.CREATE) {
                            data.executionProperties = {
                                tokenIn: fromToken.address || fromToken.symbol,
                                tokenOut: toToken.address || toToken.symbol,
                                customTokens: this.state.customTokens,
                                offerIndex: offerIndex,
                                isCreate: true,
                                isFlow: true
                            };
                        }
                        this.state.handleUpdateStepStatus(data);
                    }
                    if (this.state.handleAddTransactions && receipt) {
                        const action = this.actionType === Action.CREATE ? "Create" : this.actionType === Action.ADD ? "Add" : "Remove";
                        const chainId = this.state.getChainId();
                        const timestamp = await this.state.getRpcWallet().getBlockTimestamp(receipt.blockNumber.toString());
                        const transactionsInfoArr = [
                            {
                                desc: `${action} Group Queue ${fromToken.symbol}/${toToken.symbol}`,
                                chainId: chainId,
                                fromToken: null,
                                toToken: null,
                                fromTokenAmount: '',
                                toTokenAmount: '-',
                                hash: receipt.transactionHash,
                                timestamp
                            }
                        ];
                        this.state.handleAddTransactions({
                            list: transactionsInfoArr
                        });
                    }
                },
                onPayingError: async (err) => {
                    this.showTxStatus('error', err);
                    this.setSubmitBtnStatus(false);
                }
            });
            this.state.approvalModel.spenderAddress = address;
        }
        async getNextTokenApprovalStage() {
            const chainId = this.state.getChainId();
            const stakeToken = (0, API_1.getQueueStakeToken)(chainId);
            if (!stakeToken)
                return;
            const tokens = await (0, API_1.getToBeApprovedTokens)(chainId, this.fromTokenObject, this.fromTokenInput.toString(), this.fee.toString());
            if ([Action.CREATE, Action.ADD].some(n => n === this.actionType) && tokens && tokens.length > 0) {
                if (tokens.includes(this.fromTokenAddress)) {
                    this.currentStage = Stage.FIRST_TOKEN_APPROVAL;
                }
                else if (tokens.includes(stakeToken.address)) {
                    this.currentStage = Stage.GOV_TOKEN_APPROVAL;
                }
            }
            else {
                this.currentStage = Stage.SUBMIT;
            }
            if (this.state.handleUpdateStepStatus) {
                const msg = "Pending " + (this.currentStage === Stage.SUBMIT ? "Submission" : "Approval");
                this.state.handleUpdateStepStatus({
                    status: msg,
                    color: Theme.colors.warning.main
                });
            }
        }
        async approveToken(tokenObj) {
            this.showTxStatus('warning', `Approving ${tokenObj.symbol} allowance`);
            const amount = this.currentStage === Stage.FIRST_TOKEN_APPROVAL ? this.fromTokenInput.toString() : this.fee.toString();
            this.approvalModelAction.doApproveAction(tokenObj, amount);
        }
        async addLiquidityAction(endDate, deadline) {
            this.showTxStatus('warning', '');
            const restrictedPrice = (0, index_4.toWeiInv)(this.offerPriceText).shiftedBy(-Number(18)).toFixed();
            const allowAll = this.offerTo === OfferState.Everyone;
            const arrWhitelist = (allowAll || this.switchLock === LockState.Locked) ? [] : this.addresses;
            const chainId = this.state.getChainId();
            const fromToken = this.fromTokenObject;
            const toToken = this.toTokenObject;
            await (0, API_1.addLiquidity)(chainId, fromToken, toToken, fromToken, this.pairIndex, this.offerIndex ? Number(this.offerIndex) : 0, this.fromTokenInput.toNumber(), allowAll, restrictedPrice, this.startDate.unix(), endDate, deadline, arrWhitelist);
        }
        async removeLiquidityAction(deadline, collectFromProceeds) {
            this.showTxStatus('warning', '');
            let amountOut = '';
            let reserveOut = '';
            if (collectFromProceeds) {
                reserveOut = this.fromTokenInput.toString();
            }
            else {
                amountOut = this.fromTokenInput.toString();
            }
            const fromToken = this.fromTokenObject;
            const toToken = this.toTokenObject;
            await (0, API_1.removeLiquidity)(this.state.getChainId(), fromToken, toToken, fromToken, amountOut, reserveOut, this.offerIndex, deadline);
        }
    }
    exports.Model = Model;
});
define("@scom/scom-liquidity-provider/liquidity-utils/index.ts", ["require", "exports", "@scom/scom-liquidity-provider/liquidity-utils/API.ts", "@scom/scom-liquidity-provider/liquidity-utils/model.ts"], function (require, exports, API_2, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name='@scom/scom-liquidity-provider/liquidity-utils/index.ts'/> 
    __exportStar(API_2, exports);
    __exportStar(model_1, exports);
});
define("@scom/scom-liquidity-provider/formSchema.ts", ["require", "exports", "@ijstech/components", "@scom/scom-network-picker", "@scom/scom-token-input", "@scom/scom-liquidity-provider/liquidity-utils/index.ts"], function (require, exports, components_7, scom_network_picker_1, scom_token_input_1, liquidity_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFormSchema = exports.getProjectOwnerSchema = void 0;
    const theme = {
        type: 'object',
        properties: {
            backgroundColor: {
                type: 'string',
                format: 'color'
            },
            fontColor: {
                type: 'string',
                format: 'color'
            },
            inputBackgroundColor: {
                type: 'string',
                format: 'color'
            },
            inputFontColor: {
                type: 'string',
                format: 'color'
            }
        }
    };
    exports.default = {
        dataSchema: {
            type: 'object',
            properties: {
                chainId: {
                    type: 'number',
                    required: true
                },
                tokenIn: {
                    type: 'string',
                    required: true
                },
                tokenOut: {
                    type: 'string',
                    required: true
                },
                isCreate: {
                    type: 'boolean',
                    title: 'Create New Offer?',
                    default: true
                },
                offerIndex: {
                    type: 'string'
                },
                dark: theme,
                light: theme
            }
        },
        uiSchema: {
            type: 'Categorization',
            elements: [
                {
                    type: 'Category',
                    label: 'General',
                    elements: [
                        {
                            type: 'VerticalLayout',
                            elements: [
                                {
                                    type: 'Control',
                                    scope: '#/properties/chainId'
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/tokenIn'
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/tokenOut'
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/isCreate'
                                },
                                {
                                    type: 'Control',
                                    scope: '#/properties/offerIndex',
                                    rule: {
                                        effect: 'HIDE',
                                        condition: {
                                            scope: '#/properties/isCreate',
                                            schema: {
                                                const: true
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'Category',
                    label: 'Theme',
                    elements: [
                        {
                            type: 'VerticalLayout',
                            elements: [
                                {
                                    type: 'Control',
                                    label: 'Dark',
                                    scope: '#/properties/dark'
                                },
                                {
                                    type: 'Control',
                                    label: 'Light',
                                    scope: '#/properties/light'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        customControls(state) {
            let networkPicker;
            let firstTokenInput;
            let secondTokenInput;
            let combobox;
            const initCombobox = async () => {
                if (!combobox)
                    return;
                combobox.clear();
                const fromToken = firstTokenInput?.token;
                const toToken = secondTokenInput?.token;
                try {
                    if (fromToken && toToken) {
                        const wallet = state.getRpcWallet();
                        const chainId = networkPicker.selectedNetwork?.chainId;
                        combobox.icon.name = 'spinner';
                        combobox.icon.spin = true;
                        combobox.enabled = false;
                        if (chainId && chainId != wallet.chainId) {
                            await wallet.switchNetwork(chainId);
                        }
                        const pairAddress = await (0, liquidity_utils_1.getPair)(state, fromToken, toToken);
                        const fromTokenAddress = fromToken.address?.toLowerCase() || fromToken.symbol;
                        const toTokenAddress = toToken.address?.toLowerCase() || toToken.symbol;
                        const offerIndexes = await (0, liquidity_utils_1.getOfferIndexes)(state, pairAddress, fromTokenAddress, toTokenAddress);
                        combobox.items = offerIndexes.map(v => { return { label: v.toString(), value: v.toString() }; });
                    }
                    else {
                        combobox.items = [];
                    }
                }
                catch {
                    combobox.items = [];
                }
                finally {
                    combobox.icon.name = 'angle-down';
                    combobox.icon.spin = false;
                    combobox.enabled = true;
                }
            };
            return {
                "#/properties/chainId": {
                    render: () => {
                        networkPicker = new scom_network_picker_1.default(undefined, {
                            type: 'combobox',
                            networks: [1, 56, 137, 250, 97, 80001, 43113, 43114, 42161, 421613].map(v => { return { chainId: v }; }),
                            onCustomNetworkSelected: () => {
                                const chainId = networkPicker.selectedNetwork?.chainId;
                                if (firstTokenInput.chainId != chainId) {
                                    firstTokenInput.token = null;
                                    secondTokenInput.token = null;
                                    combobox.items = [{ label: '', value: '' }];
                                    combobox.clear();
                                }
                                firstTokenInput.chainId = chainId;
                                secondTokenInput.chainId = chainId;
                            }
                        });
                        return networkPicker;
                    },
                    getData: (control) => {
                        return control.selectedNetwork?.chainId;
                    },
                    setData: (control, value) => {
                        control.setNetworkByChainId(value);
                        if (firstTokenInput)
                            firstTokenInput.chainId = value;
                        if (secondTokenInput)
                            secondTokenInput.chainId = value;
                    }
                },
                "#/properties/tokenIn": {
                    render: () => {
                        firstTokenInput = new scom_token_input_1.default(undefined, {
                            type: 'combobox',
                            isBalanceShown: false,
                            isBtnMaxShown: false,
                            isInputShown: false,
                            maxWidth: 300
                        });
                        const chainId = networkPicker?.selectedNetwork?.chainId;
                        if (chainId && firstTokenInput.chainId !== chainId) {
                            firstTokenInput.chainId = chainId;
                        }
                        firstTokenInput.onSelectToken = () => {
                            initCombobox();
                        };
                        return firstTokenInput;
                    },
                    getData: (control) => {
                        return control.token?.address || control.token?.symbol;
                    },
                    setData: (control, value) => {
                        control.address = value;
                    }
                },
                "#/properties/tokenOut": {
                    render: () => {
                        secondTokenInput = new scom_token_input_1.default(undefined, {
                            type: 'combobox',
                            isBalanceShown: false,
                            isBtnMaxShown: false,
                            isInputShown: false,
                            maxWidth: 300
                        });
                        const chainId = networkPicker?.selectedNetwork?.chainId;
                        if (chainId && secondTokenInput.chainId !== chainId) {
                            secondTokenInput.chainId = chainId;
                        }
                        secondTokenInput.onSelectToken = () => {
                            initCombobox();
                        };
                        return secondTokenInput;
                    },
                    getData: (control) => {
                        return control.token?.address || control.token?.symbol;
                    },
                    setData: (control, value) => {
                        control.address = value;
                    }
                },
                "#/properties/offerIndex": {
                    render: () => {
                        combobox = new components_7.ComboBox(undefined, {
                            maxWidth: 300,
                            height: 43,
                            items: []
                        });
                        return combobox;
                    },
                    getData: (control) => {
                        return control.selectedItem?.value || '';
                    },
                    setData: async (control, value) => {
                        if (value) {
                            if (!combobox.items || !combobox.items.length) {
                                await initCombobox();
                            }
                            control.selectedItem = { label: value, value };
                        }
                        else {
                            control.clear();
                        }
                    }
                }
            };
        }
    };
    function getProjectOwnerSchema() {
        return {
            dataSchema: {
                type: 'object',
                properties: {
                    chainId: {
                        type: 'number',
                        required: true
                    },
                    tokenIn: {
                        type: 'string'
                    },
                    tokenOut: {
                        type: 'string'
                    },
                    isCreate: {
                        type: 'boolean',
                        title: 'Create New Offer?',
                        default: true
                    },
                    offerIndex: {
                        type: 'string'
                    }
                }
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements: [
                    {
                        type: 'Control',
                        scope: '#/properties/chainId'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/tokenIn'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/tokenOut'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/isCreate'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/offerIndex',
                        rule: {
                            effect: 'HIDE',
                            condition: {
                                scope: '#/properties/isCreate',
                                schema: {
                                    const: true
                                }
                            }
                        }
                    }
                ]
            },
            customControls(state) {
                let networkPicker;
                let firstTokenInput;
                let secondTokenInput;
                let combobox;
                const initCombobox = async () => {
                    if (!combobox)
                        return;
                    combobox.clear();
                    const fromToken = firstTokenInput?.token;
                    const toToken = secondTokenInput?.token;
                    try {
                        if (fromToken && toToken) {
                            const wallet = state.getRpcWallet();
                            const chainId = networkPicker.selectedNetwork?.chainId;
                            combobox.icon.name = 'spinner';
                            combobox.icon.spin = true;
                            combobox.enabled = false;
                            if (chainId && chainId != wallet.chainId) {
                                await wallet.switchNetwork(chainId);
                            }
                            const pairAddress = await (0, liquidity_utils_1.getPair)(state, fromToken, toToken);
                            const fromTokenAddress = fromToken.address?.toLowerCase() || fromToken.symbol;
                            const toTokenAddress = toToken.address?.toLowerCase() || toToken.symbol;
                            const offerIndexes = await (0, liquidity_utils_1.getOfferIndexes)(state, pairAddress, fromTokenAddress, toTokenAddress);
                            combobox.items = offerIndexes.map(v => { return { label: v.toString(), value: v.toString() }; });
                        }
                        else {
                            combobox.items = [];
                        }
                    }
                    catch {
                        combobox.items = [];
                    }
                    finally {
                        combobox.icon.name = 'angle-down';
                        combobox.icon.spin = false;
                        combobox.enabled = true;
                    }
                };
                return {
                    "#/properties/chainId": {
                        render: () => {
                            networkPicker = new scom_network_picker_1.default(undefined, {
                                type: 'combobox',
                                networks: [1, 56, 137, 250, 97, 80001, 43113, 43114, 42161, 421613].map(v => { return { chainId: v }; }),
                                onCustomNetworkSelected: () => {
                                    const chainId = networkPicker.selectedNetwork?.chainId;
                                    if (firstTokenInput.chainId != chainId) {
                                        firstTokenInput.token = null;
                                        secondTokenInput.token = null;
                                        combobox.items = [{ label: '', value: '' }];
                                        combobox.clear();
                                    }
                                    firstTokenInput.chainId = chainId;
                                    secondTokenInput.chainId = chainId;
                                }
                            });
                            return networkPicker;
                        },
                        getData: (control) => {
                            return control.selectedNetwork?.chainId;
                        },
                        setData: (control, value) => {
                            control.setNetworkByChainId(value);
                            if (firstTokenInput)
                                firstTokenInput.chainId = value;
                            if (secondTokenInput)
                                secondTokenInput.chainId = value;
                        }
                    },
                    "#/properties/tokenIn": {
                        render: () => {
                            firstTokenInput = new scom_token_input_1.default(undefined, {
                                type: 'combobox',
                                isBalanceShown: false,
                                isBtnMaxShown: false,
                                isInputShown: false,
                                maxWidth: 300
                            });
                            const chainId = networkPicker?.selectedNetwork?.chainId;
                            if (chainId && firstTokenInput.chainId !== chainId) {
                                firstTokenInput.chainId = chainId;
                            }
                            firstTokenInput.onSelectToken = () => {
                                initCombobox();
                            };
                            return firstTokenInput;
                        },
                        getData: (control) => {
                            return control.token?.address || control.token?.symbol;
                        },
                        setData: (control, value) => {
                            control.address = value;
                        }
                    },
                    "#/properties/tokenOut": {
                        render: () => {
                            secondTokenInput = new scom_token_input_1.default(undefined, {
                                type: 'combobox',
                                isBalanceShown: false,
                                isBtnMaxShown: false,
                                isInputShown: false,
                                maxWidth: 300
                            });
                            const chainId = networkPicker?.selectedNetwork?.chainId;
                            if (chainId && secondTokenInput.chainId !== chainId) {
                                secondTokenInput.chainId = chainId;
                            }
                            secondTokenInput.onSelectToken = () => {
                                initCombobox();
                            };
                            return secondTokenInput;
                        },
                        getData: (control) => {
                            return control.token?.address || control.token?.symbol;
                        },
                        setData: (control, value) => {
                            control.address = value;
                        }
                    },
                    "#/properties/offerIndex": {
                        render: () => {
                            combobox = new components_7.ComboBox(undefined, {
                                maxWidth: 300,
                                height: 43,
                                items: []
                            });
                            return combobox;
                        },
                        getData: (control) => {
                            return control.selectedItem?.value || '';
                        },
                        setData: async (control, value) => {
                            if (value) {
                                if (!combobox.items || !combobox.items.length) {
                                    await initCombobox();
                                }
                                control.selectedItem = { label: value, value };
                            }
                            else {
                                control.clear();
                            }
                        }
                    }
                };
            }
        };
    }
    exports.getProjectOwnerSchema = getProjectOwnerSchema;
    function getFormSchema() {
        return {
            dataSchema: {
                type: 'object',
                required: ['chainId', 'tokenIn', 'tokenOut'],
                properties: {
                    chainId: {
                        type: 'number'
                    },
                    tokenIn: {
                        type: 'string'
                    },
                    tokenOut: {
                        type: 'string'
                    },
                    isCreate: {
                        type: 'boolean',
                        title: 'Create New Offer?',
                        default: true
                    },
                    offerIndex: {
                        type: 'string'
                    },
                }
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements: [
                    {
                        type: 'Control',
                        scope: '#/properties/chainId'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/tokenIn'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/tokenOut'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/isCreate'
                    },
                    {
                        type: 'Control',
                        scope: '#/properties/offerIndex',
                        rule: {
                            effect: 'HIDE',
                            condition: {
                                scope: '#/properties/isCreate',
                                schema: {
                                    const: true
                                }
                            }
                        }
                    }
                ]
            },
            customControls(state) {
                let networkPicker;
                let firstTokenInput;
                let secondTokenInput;
                let combobox;
                const initCombobox = async () => {
                    if (!combobox)
                        return;
                    combobox.clear();
                    const fromToken = firstTokenInput?.token;
                    const toToken = secondTokenInput?.token;
                    try {
                        if (fromToken && toToken) {
                            const wallet = state.getRpcWallet();
                            const chainId = networkPicker.selectedNetwork?.chainId;
                            combobox.icon.name = 'spinner';
                            combobox.icon.spin = true;
                            combobox.enabled = false;
                            if (chainId && chainId != wallet.chainId) {
                                await wallet.switchNetwork(chainId);
                            }
                            const pairAddress = await (0, liquidity_utils_1.getPair)(state, fromToken, toToken);
                            const fromTokenAddress = fromToken.address?.toLowerCase() || fromToken.symbol;
                            const toTokenAddress = toToken.address?.toLowerCase() || toToken.symbol;
                            const offerIndexes = await (0, liquidity_utils_1.getOfferIndexes)(state, pairAddress, fromTokenAddress, toTokenAddress);
                            combobox.items = offerIndexes.map(v => { return { label: v.toString(), value: v.toString() }; });
                        }
                        else {
                            combobox.items = [];
                        }
                    }
                    catch {
                        combobox.items = [];
                    }
                    finally {
                        combobox.icon.name = 'angle-down';
                        combobox.icon.spin = false;
                        combobox.enabled = true;
                    }
                };
                return {
                    "#/properties/chainId": {
                        render: () => {
                            networkPicker = new scom_network_picker_1.default(undefined, {
                                type: 'combobox',
                                networks: [1, 56, 137, 250, 97, 80001, 43113, 43114, 42161, 421613].map(v => { return { chainId: v }; }),
                                onCustomNetworkSelected: () => {
                                    const chainId = networkPicker.selectedNetwork?.chainId;
                                    if (firstTokenInput.chainId != chainId) {
                                        firstTokenInput.token = null;
                                        secondTokenInput.token = null;
                                        combobox.items = [{ label: '', value: '' }];
                                        combobox.clear();
                                    }
                                    firstTokenInput.chainId = chainId;
                                    secondTokenInput.chainId = chainId;
                                }
                            });
                            return networkPicker;
                        },
                        getData: (control) => {
                            return control.selectedNetwork?.chainId;
                        },
                        setData: (control, value) => {
                            control.setNetworkByChainId(value);
                            if (firstTokenInput)
                                firstTokenInput.chainId = value;
                            if (secondTokenInput)
                                secondTokenInput.chainId = value;
                        }
                    },
                    '#/properties/tokenIn': {
                        render: () => {
                            firstTokenInput = new scom_token_input_1.default(undefined, {
                                type: 'combobox',
                                isBalanceShown: false,
                                isBtnMaxShown: false,
                                isInputShown: false
                            });
                            const chainId = networkPicker?.selectedNetwork?.chainId;
                            if (chainId && firstTokenInput.chainId !== chainId) {
                                firstTokenInput.chainId = chainId;
                            }
                            firstTokenInput.onSelectToken = () => {
                                initCombobox();
                            };
                            return firstTokenInput;
                        },
                        getData: (control) => {
                            return control.token?.address || control.token?.symbol;
                        },
                        setData: (control, value) => {
                            control.address = value;
                        }
                    },
                    "#/properties/tokenOut": {
                        render: () => {
                            secondTokenInput = new scom_token_input_1.default(undefined, {
                                type: 'combobox',
                                isBalanceShown: false,
                                isBtnMaxShown: false,
                                isInputShown: false
                            });
                            const chainId = networkPicker?.selectedNetwork?.chainId;
                            if (chainId && secondTokenInput.chainId !== chainId) {
                                secondTokenInput.chainId = chainId;
                            }
                            secondTokenInput.onSelectToken = () => {
                                initCombobox();
                            };
                            return secondTokenInput;
                        },
                        getData: (control) => {
                            return control.token?.address || control.token?.symbol;
                        },
                        setData: (control, value) => {
                            control.address = value;
                        }
                    },
                    "#/properties/offerIndex": {
                        render: () => {
                            combobox = new components_7.ComboBox(undefined, {
                                height: 43,
                                items: []
                            });
                            return combobox;
                        },
                        getData: (control) => {
                            return control.selectedItem?.value || '';
                        },
                        setData: async (control, value) => {
                            if (value) {
                                if (!combobox.items || !combobox.items.length) {
                                    await initCombobox();
                                }
                                control.selectedItem = { label: value, value };
                            }
                            else {
                                control.clear();
                            }
                        }
                    }
                };
            }
        };
    }
    exports.getFormSchema = getFormSchema;
});
define("@scom/scom-liquidity-provider/detail/whitelist.css.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.whiteListStyle = void 0;
    const Theme = components_8.Styles.Theme.ThemeVars;
    exports.whiteListStyle = components_8.Styles.style({
        $nest: {
            '.modal': {
                background: `${Theme.background.main} !important`,
                width: 700,
                maxWidth: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                color: Theme.text.primary
            },
            '.i-modal_header': {
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: `2px soid ${Theme.input.background}`,
                color: Theme.colors.primary.main,
                fontSize: '1.25rem',
                fontWeight: 700,
                $nest: {
                    '&> span': {
                        color: Theme.colors.primary.main,
                    },
                    '&> i-icon': {
                        fill: `${Theme.colors.primary.main} !important`
                    },
                    '& ~ i-icon': {
                        display: 'inline-block',
                        margin: '0.75rem 0',
                        background: Theme.input.background,
                        border: '2px solid transparent',
                        borderRadius: '50%',
                        padding: '0.25rem'
                    }
                }
            },
            '.text-err': {
                marginBottom: '0.25rem',
                lineHeight: '1rem',
                $nest: {
                    '*': {
                        color: '#f15e61',
                    }
                }
            },
            '.text-note': {
                color: Theme.text.primary,
                opacity: 0.8,
                fontSize: '0.8rem',
                lineHeight: '1rem',
                display: 'block',
            },
            '.search-box': {
                width: 'calc(100% - 6px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: Theme.input.background,
                borderRadius: '8px',
                marginBottom: '8px',
                marginLeft: '2px',
            },
            '.input-search': {
                maxWidth: 'calc(100% - 32px)',
                $nest: {
                    'input': {
                        color: Theme.input.fontColor,
                        background: 'transparent',
                        borderRadius: '8px',
                        border: 'none',
                        padding: '0.5rem',
                        $nest: {
                            '&::placeholder': {
                                color: Theme.text.primary,
                                opacity: 0.8,
                            },
                            '&:focus::placeholder': {
                                opacity: 0,
                            }
                        }
                    }
                }
            },
            '.input-address': {
                opacity: 1,
                $nest: {
                    'input': {
                        padding: '0.5rem',
                        color: Theme.input.fontColor,
                        background: Theme.input.background,
                        borderRadius: '10px',
                        border: '1px solid transparent'
                    }
                }
            },
            '.input-allocation': {
                opacity: 1,
                display: 'flex',
                flexDirection: 'row-reverse',
                alignItems: 'center',
                background: Theme.input.background,
                borderRadius: '10px',
                border: '1px solid transparent',
                paddingInline: '0.35rem',
                $nest: {
                    '&.w-input': {
                        maxWidth: 'calc(100% - 28px)'
                    },
                    'span': {
                        overflow: 'unset',
                        fontSize: '14px',
                        marginBottom: '2.5px',
                        paddingRight: '0.25rem',
                    },
                    'label': {
                        width: 'auto !important',
                    },
                    'input': {
                        background: 'transparent',
                        border: 'none',
                        color: Theme.input.fontColor,
                        borderRadius: 0,
                    }
                }
            },
            '.input-batch': {
                maxWidth: '500px',
                color: Theme.input.fontColor,
                borderRadius: '0.5rem',
                border: 'none',
                $nest: {
                    'textarea': {
                        border: 'none',
                        height: '150px !important',
                        padding: '0.5rem 0.75rem',
                        resize: 'none',
                        outline: 'none'
                    },
                    '::-webkit-scrollbar': {
                        width: '3px',
                    },
                    '::-webkit-scrollbar-thumb': {
                        background: Theme.background.gradient,
                        borderRadius: '5px',
                    }
                }
            },
            '#groupBtnElm': {
                marginRight: 'auto',
                $nest: {
                    'i-icon': {
                        width: '16px !important',
                        height: '16px !important',
                        marginRight: '0.25rem',
                    }
                }
            },
            'i-button': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '150px',
                paddingBlock: '0.35rem',
                fontWeight: 600,
                borderRadius: 5,
                margin: '0.5rem',
            },
            '.btn-cancel': {
                background: `${Theme.text.primary} !important`,
                color: `${Theme.background.main} !important`,
            },
            '.btn-submit': {
                textAlign: 'center',
            },
            'i-icon': {
                display: 'flex !important',
            },
            'i-pagination': {
                marginBottom: '1.5rem',
                $nest: {
                    '.paginate_button': {
                        backgroundColor: Theme.input.background,
                        border: `1px solid ${Theme.colors.primary.main}`,
                        color: Theme.input.fontColor,
                        padding: '4px 16px',
                        $nest: {
                            '&.active': {
                                backgroundColor: Theme.colors.primary.main,
                                border: `1px solid ${Theme.colors.primary.main}`,
                                color: Theme.text.primary,
                            }
                        }
                    },
                    '.pagination a.disabled': {
                        color: Theme.input.fontColor,
                        opacity: 0.6
                    }
                }
            },
            '@media screen and (max-width: 525px)': {
                $nest: {
                    '.total-info': {
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                    },
                    '.text-note *': {
                        fontSize: '0.75rem',
                    },
                    'i-pagination': {
                        marginBottom: '1.5rem',
                        $nest: {
                            '#nextMoreElm': {
                                display: 'none',
                            },
                            '.paginate_button': {
                                $nest: {
                                    '&.previous, &.next': {
                                        display: 'none',
                                    },
                                },
                            },
                            '.pagination-main': {
                                flexWrap: 'wrap',
                                $nest: {
                                    '.paginate_button': {
                                        minWidth: '50px',
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
});
define("@scom/scom-liquidity-provider/detail/whitelist.tsx", ["require", "exports", "@ijstech/components", "@scom/scom-liquidity-provider/detail/whitelist.css.ts", "@ijstech/eth-wallet", "@scom/scom-liquidity-provider/global/index.ts"], function (require, exports, components_9, whitelist_css_1, eth_wallet_7, index_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageWhitelist = void 0;
    const Theme = components_9.Styles.Theme.ThemeVars;
    ;
    const dummyAddressList = [
        "0xFa8e00000001234567899876543210000000Fa8e",
        "0xFa8e11111111234567899876543211111111Fa8e",
        "0xFa8e22222221234567899876543212222222Fa8e",
        "0xFa8e33333331234567899876543213333333Fa8e",
        "0xFa8e44444441234567899876543214444444Fa8e",
        "0xFa8e55555551234567899876543215555555Fa8e",
        "0xFa8e66666661234567899876543216666666Fa8e",
        "0xFa8e77777771234567899876543217777777Fa8e",
        "0xFa8e88888881234567899876543218888888Fa8e",
        "0xFa8e99999991234567899876543219999999Fa8e",
    ];
    const pageSize = 5;
    let ManageWhitelist = class ManageWhitelist extends components_9.Module {
        set state(value) {
            this._state = value;
        }
        get state() {
            return this._state;
        }
        get props() {
            return this._props;
        }
        get chainId() {
            return this.state?.getChainId();
        }
        set props(value) {
            this._props = value;
            this.isReadOnly = value.isReadOnly;
            this.balance = value.balance;
            this.tokenSymbol = value.tokenSymbol;
            this.decimals = value.decimals || 18;
            this.addresses = value.addresses;
            this.pairCustomParams = value.pairCustomParams;
            if (this.searchInput) {
                this.searchInput.value = '';
            }
            this.renderUI();
        }
        get totalAddress() {
            let total = 0;
            this.listAddress.forEach((item) => {
                if (item.address) {
                    ++total;
                }
            });
            return total;
        }
        ;
        get totalAllocation() {
            let total = new eth_wallet_7.BigNumber(0);
            this.listAddress.forEach((item) => {
                if (item.address) {
                    const value = this.isReadOnly ? item.allocationVal : item.allocation;
                    total = total.plus(value || 0);
                }
            });
            return total.toFixed();
        }
        ;
        get fee() {
            if (!this.pairCustomParams || !this.totalAddress)
                return new eth_wallet_7.BigNumber(0);
            let total = 0;
            this.listAddress.forEach((item) => {
                if (item.address) {
                    if (item.isOld) {
                        total += (item.oldAllocation !== item.allocation) ? 1 : 0;
                    }
                    else {
                        ++total;
                    }
                }
            });
            return new eth_wallet_7.BigNumber(this.pairCustomParams.feePerTrader).times(total);
        }
        ;
        get idxFiltering() {
            if (this.searchInput.value) {
                return this.listAddress.findIndex((item) => item.address.toLowerCase().includes(this.searchInput.value.toLowerCase()));
            }
            return 0;
        }
        get listAddressFiltered() {
            if (this.searchInput.value) {
                return this.listAddress.filter((item) => item.address.toLowerCase().includes(this.searchInput.value.toLowerCase()));
            }
            return this.listAddress;
        }
        ;
        get listAddressPagination() {
            return this.listAddressFiltered.slice(this.itemStart, this.itemEnd);
        }
        ;
        constructor(parent, options) {
            super(parent, options);
            this.balance = 0;
            this.tokenSymbol = '';
            this.addresses = [];
            this.pairCustomParams = {};
            this.listAddress = [];
            this.isAddByBatch = false;
            this.totalPage = 0;
            this.pageNumber = 1;
            this.itemStart = 0;
            this.itemEnd = pageSize;
            this.renderUI = () => {
                this.cancelBtn.caption = this.isReadOnly ? 'Confirm' : 'Cancel';
                if (this.isReadOnly) {
                    this.cancelBtn.classList.add('btn-submit');
                }
                else {
                    this.cancelBtn.classList.add('btn-cancel');
                    const tokenMap = this.state.getTokenMapByChainId(this.chainId);
                    this.balanceLabel.caption = (0, index_5.renderBalanceTooltip)({ title: 'Balance', value: this.balance, symbol: 'OSWAP' }, tokenMap);
                    this.totalFee.caption = (0, index_5.renderBalanceTooltip)({ value: this.fee, symbol: 'OSWAP' }, tokenMap);
                }
                this.balanceFeeContainer.visible = !this.isReadOnly;
                this.groupBtnElm.visible = !this.isReadOnly;
                this.saveBtn.visible = !this.isReadOnly;
                this.setDefaultAddresses();
            };
            this.setDefaultAddresses = () => {
                if (this.isReadOnly) {
                    this.listAddress = this.addresses.map((address) => {
                        return {
                            ...address,
                            allocation: (0, index_5.formatNumber)(address.allocation),
                            allocationVal: address.allocation,
                        };
                    });
                }
                else {
                    if (this.isAddByBatch) {
                        this.inputBatch.value = '';
                    }
                    if (this.pageNumber > 1) {
                        this.pageNumber = 1;
                        this.handlePagination(this.pageNumber);
                    }
                    ;
                    const list = [];
                    this.addresses.forEach((item) => {
                        list.push({ ...item });
                    });
                    this.listAddress = list;
                }
                ;
                this.updateTotalValues();
                this.renderAddresses();
            };
            this.updateTotalValues = () => {
                const tokenMap = this.state.getTokenMapByChainId(this.chainId);
                this.totalAddressLabel.caption = `${this.totalAddress}` || '0';
                this.totalAllocationLabel.caption = (0, index_5.renderBalanceTooltip)({ value: this.totalAllocation, symbol: this.tokenSymbol }, tokenMap);
                this.totalFee.caption = (0, index_5.renderBalanceTooltip)({ value: this.fee, symbol: 'OSWAP' }, tokenMap);
                this.saveBtn.enabled = !this.isDisabled;
            };
            this.renderAddresses = () => {
                this.totalPage = Math.ceil(this.listAddressFiltered.length / pageSize);
                this.paginationElm.visible = this.totalPage > 1;
                this.listAddressContainer.clearInnerHTML();
                if (this.searchInput.value && !this.listAddressPagination.length) {
                    this.listAddressContainer.appendChild(this.$render("i-label", { margin: { top: 10 }, caption: `There is no address: <b>${this.searchInput.value}</b>` }));
                }
                this.listAddressPagination.forEach((item, idx) => {
                    const indexVal = (pageSize * (this.pageNumber - 1)) + idx + this.idxFiltering;
                    this.listAddressContainer.appendChild(this.$render("i-hstack", { verticalAlignment: "start", margin: { top: 4, bottom: 4 } },
                        this.$render("i-vstack", { verticalAlignment: "center", width: "50%", padding: { right: 10 } },
                            this.$render("i-input", { value: item.address, enabled: !(this.isReadOnly || item.isOld), onChanged: (e) => this.onInputAddress(e, indexVal), class: "input-address", width: "100%", height: 45 }),
                            this.$render("i-label", { id: `err_${indexVal}`, font: { size: '12px' }, class: "text-err text-left", visible: !!item.isDuplicated || !!item.invalid, caption: item.isDuplicated ? 'This address is duplicated' : 'Please input a valid address' })),
                        this.$render("i-hstack", { verticalAlignment: "center", width: "50%", padding: { left: 10 } },
                            this.$render("i-input", { caption: this.tokenSymbol, class: `input-allocation ${!this.isReadOnly ? 'w-input' : ''}`, inputType: this.isReadOnly ? undefined : 'number', value: item.allocation + '', enabled: !this.isReadOnly, onChanged: (e) => this.onInputAllocation(e, indexVal), width: "100%", height: 43 }),
                            !this.isReadOnly && !item.isOld ?
                                this.$render("i-icon", { name: "trash", fill: "#f15e61", class: "pointer", margin: { left: 4 }, height: 18, width: 18, onClick: () => this.removeAddress(idx, indexVal) }) :
                                [])));
                });
            };
            this.getBatchValues = () => {
                let items = this.convertWhitelistedAddresses(this.inputBatch.value);
                let list = [];
                for (const item of items) {
                    const { address, allocation } = item;
                    list.push({
                        address,
                        allocation: isNaN(allocation) ? '' : allocation,
                    });
                }
                return list;
            };
            this.onSave = () => {
                if (this.isAddByBatch) {
                    const oldAddresses = this.listAddress.filter((item) => item.isOld);
                    this.listAddress = oldAddresses.concat(this.getBatchValues());
                    this.validateForm();
                    this.renderAddresses();
                    this.updateTotalValues();
                    this.isAddByBatch = false;
                    this.batchPanel.visible = false;
                    this.addPanel.visible = true;
                }
                else {
                    const finalList = [];
                    this.listAddress.forEach((item) => {
                        const { address, allocation } = item;
                        if (address && (allocation || allocation == 0)) {
                            finalList.push({ ...item });
                        }
                    });
                    if (this.updateAddress) {
                        this.updateAddress({ addresses: finalList, fee: this.fee });
                    }
                    this.closeModal();
                }
            };
            this.onCancel = () => {
                if (this.isAddByBatch) {
                    this.isAddByBatch = false;
                    this.saveBtn.enabled = !this.isDisabled;
                    this.batchPanel.visible = false;
                    this.addPanel.visible = true;
                }
                else {
                    this.closeModal();
                }
            };
            this.onInputAddress = (e, idx) => {
                const item = this.listAddress[idx];
                if (item.isOld || this.isReadOnly) {
                    e.value = item.address;
                    return;
                }
                this.listAddress[idx] = {
                    ...item,
                    address: e.value
                };
                this.validateForm();
            };
            this.onInputAllocation = (e, idx) => {
                const item = this.listAddress[idx];
                (0, index_5.limitInputNumber)(e, this.decimals);
                this.listAddress[idx] = {
                    ...item,
                    allocation: e.value
                };
                this.updateTotalValues();
            };
            this.onInputBatch = () => {
                this.saveBtn.enabled = !this.isDisabled;
            };
            this.validateForm = async () => {
                const array = this.listAddress;
                const valueArr = array.map((item) => { return item.address; });
                for (let i = 0; i < valueArr.length; i++) {
                    if (valueArr[i]) {
                        const isDuplicated = valueArr.some((item, index) => valueArr[i] === item && i !== index);
                        let isValid = true;
                        this.listAddress[i].isDuplicated = isDuplicated;
                        if (!isDuplicated) {
                            isValid = await (0, index_5.isAddressValid)(valueArr[i]);
                            this.listAddress[i].invalid = !isValid;
                        }
                        const elm = this.listAddressContainer.querySelector(`[id="err_${i}"]`);
                        if (elm) {
                            elm.visible = (isDuplicated || !isValid);
                            if (isDuplicated || !isValid) {
                                elm.caption = isDuplicated ? 'This address is duplicated' : 'Please input a valid address';
                            }
                        }
                    }
                }
                this.updateTotalValues();
            };
            this.onAddBatch = () => {
                this.isAddByBatch = true;
                this.addPanel.visible = false;
                this.batchPanel.visible = true;
                this.saveBtn.enabled = !this.isDisabled;
            };
            this.onClear = () => {
                this.inputBatch.value = '';
                this.saveBtn.enabled = false;
            };
            this.onAdd = () => {
                this.listAddress.push({
                    address: '',
                    allocation: '',
                    isDuplicated: false,
                    invalid: false,
                });
                this.renderAddresses();
            };
            this.removeAddress = (index, indexVal) => {
                const isLastItem = this.listAddress.length === indexVal + 1;
                this.listAddress.splice(indexVal, 1);
                if (isLastItem && index === 0 && this.pageNumber !== 1) {
                    this.handlePagination(--this.pageNumber);
                }
                else {
                    setTimeout(() => {
                        this.renderAddresses();
                        this.validateForm();
                    }, 200);
                }
            };
            this.handlePagination = (value) => {
                this.pageNumber = value;
                this.itemStart = (value - 1) * pageSize;
                this.itemEnd = this.itemStart + pageSize;
                this.renderAddresses();
            };
            this.onSelectIndex = () => {
                this.handlePagination(this.paginationElm.currentPage);
            };
            this.resetPaging = () => {
                this.pageNumber = 1;
                this.paginationElm.currentPage = 1;
                this.itemStart = 0;
                this.itemEnd = this.itemStart + pageSize;
                this.renderAddresses();
            };
            this.searchAddress = () => {
                this.resetPaging();
            };
            this.showModal = () => {
                this.manageWhitelistModal.title = "Manage Whitelist Address";
                this.inputBatch.value = '';
                this.manageWhitelistModal.visible = true;
                this.resetPaging();
            };
            this.closeModal = () => {
                this.manageWhitelistModal.visible = false;
            };
        }
        ;
        get isDisabled() {
            if (this.isAddByBatch) {
                return !this.inputBatch.value;
            }
            return this.listAddress.some((item) => (item.address !== '' && (item.allocation == '' || Number(item.allocation) < 0)) || item.isDuplicated || item.invalid);
        }
        ;
        init() {
            super.init();
        }
        render() {
            return (this.$render("i-modal", { id: "manageWhitelistModal", closeIcon: { name: 'times' }, class: whitelist_css_1.whiteListStyle },
                this.$render("i-panel", { class: "i-modal_content text-center" },
                    this.$render("i-panel", { id: "addPanel" },
                        this.$render("i-panel", { class: "search-box" },
                            this.$render("i-icon", { name: "search", fill: Theme.input.fontColor, width: 16, height: 16, margin: { right: 4 } }),
                            this.$render("i-input", { id: "searchInput", class: "input-search", placeholder: "Search", width: "100%", height: 40, onChanged: this.searchAddress })),
                        this.$render("i-hstack", { horizontalAlignment: "space-between" },
                            this.$render("i-hstack", { class: "total-info", horizontalAlignment: "space-between", width: "50%", padding: { left: 8, right: 10 } },
                                this.$render("i-label", { caption: "Address" }),
                                this.$render("i-hstack", { gap: 4 },
                                    this.$render("i-label", { caption: "Total:" }),
                                    this.$render("i-label", { id: "totalAddressLabel", font: { color: Theme.colors.primary.main }, caption: "0 Addresses" }))),
                            this.$render("i-hstack", { class: "total-info", horizontalAlignment: "space-between", width: "50%", padding: { left: 10, right: 8 } },
                                this.$render("i-label", { caption: "Allocation" }),
                                this.$render("i-hstack", { gap: 4 },
                                    this.$render("i-label", { caption: "Total:" }),
                                    this.$render("i-label", { id: "totalAllocationLabel", font: { color: Theme.colors.primary.main }, caption: "-" })))),
                        this.$render("i-vstack", { id: "listAddressContainer" }),
                        this.$render("i-hstack", { horizontalAlignment: "end", wrap: 'wrap', margin: { top: 10 } },
                            this.$render("i-hstack", { id: "groupBtnElm", horizontalAlignment: "center", verticalAlignment: "center", gap: "10px" },
                                this.$render("i-button", { class: "btn-os", icon: { name: "plus-square" }, caption: "Add", onClick: this.onAdd }),
                                this.$render("i-button", { class: "btn-os", icon: { name: "plus-square" }, caption: "Add By Batch", onClick: this.onAddBatch })),
                            this.$render("i-pagination", { id: "paginationElm", margin: { top: 16, bottom: 16, left: 12, right: 12 }, width: "auto", currentPage: this.pageNumber, totalPages: this.totalPage, onPageChanged: this.onSelectIndex })),
                        this.$render("i-vstack", { id: "balanceFeeContainer", verticalAlignment: "start", margin: { bottom: 10 }, padding: { bottom: 16 }, border: { top: { color: Theme.input.background, width: '2px', style: 'solid' } } },
                            this.$render("i-vstack", { verticalAlignment: "start", margin: { top: 16 } },
                                this.$render("i-hstack", { width: "100%", verticalAlignment: "start", horizontalAlignment: "space-between" },
                                    this.$render("i-label", { caption: "OSWAP Fee" }),
                                    this.$render("i-label", { id: "totalFee", font: { color: Theme.colors.primary.main }, class: "text-right", caption: "-" })),
                                this.$render("i-vstack", { width: "100%", verticalAlignment: "end", horizontalAlignment: "end" },
                                    this.$render("i-label", { id: "balanceLabel", caption: "-" }))))),
                    this.$render("i-panel", { id: "batchPanel", visible: false, padding: { left: 16, right: 16 } },
                        this.$render("i-hstack", { horizontalAlignment: "space-between" },
                            this.$render("i-label", { caption: "Add by Batch" }),
                            this.$render("i-label", { class: "pointer", font: { color: Theme.colors.primary.main }, caption: "Clear", onClick: this.onClear })),
                        this.$render("i-vstack", { verticalAlignment: "center", horizontalAlignment: "center", margin: { top: 10 } },
                            this.$render("i-label", { class: "text-note", caption: "Please enter one address and amount on each line" }),
                            this.$render("i-label", { class: "text-note", caption: `${dummyAddressList[0]},250` }),
                            this.$render("i-label", { class: "text-note", caption: `${dummyAddressList[1]},1000` })),
                        this.$render("i-panel", { width: "100%", margin: { top: 20 } },
                            this.$render("i-input", { id: "inputBatch", class: "input-batch", width: "100%", inputType: "textarea", rows: 4, onChanged: this.onInputBatch }))),
                    this.$render("i-hstack", { verticalAlignment: "center", horizontalAlignment: "center", gap: "10px", margin: { top: 20, bottom: 10 } },
                        this.$render("i-button", { id: "cancelBtn", caption: "Cancel", class: "btn-os", onClick: this.onCancel }),
                        this.$render("i-button", { id: "saveBtn", caption: "Save", enabled: false, class: "btn-os btn-submit", onClick: this.onSave })))));
        }
    };
    __decorate([
        (0, components_9.observable)()
    ], ManageWhitelist.prototype, "totalPage", void 0);
    ManageWhitelist = __decorate([
        (0, components_9.customElements)('manage-whitelist')
    ], ManageWhitelist);
    exports.ManageWhitelist = ManageWhitelist;
});
define("@scom/scom-liquidity-provider/detail/form.tsx", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet", "@scom/scom-liquidity-provider/store/index.ts", "@scom/scom-liquidity-provider/liquidity-utils/index.ts", "@scom/scom-liquidity-provider/global/index.ts", "@scom/scom-liquidity-provider/assets.ts", "@scom/scom-token-list"], function (require, exports, components_10, eth_wallet_8, index_6, liquidity_utils_2, index_7, assets_3, scom_token_list_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LiquidityForm = void 0;
    const Theme = components_10.Styles.Theme.ThemeVars;
    ;
    let statusList = [
        liquidity_utils_2.OfferState.Everyone,
        liquidity_utils_2.OfferState.Whitelist
    ];
    let LiquidityForm = class LiquidityForm extends components_10.Module {
        constructor(parent, options) {
            super(parent, options);
            this.addresses = [];
            this.isReverse = false;
            this.onUpdateHelpContent = () => {
                if (this.updateHelpContent)
                    this.updateHelpContent();
            };
            this.onUpdateSummary = async () => {
                if (this.updateSummary)
                    await this.updateSummary();
                if (this.onFieldChanged)
                    this.onFieldChanged(this.currentStage);
            };
            this.onSubmitBtnStatus = (isLoading, isApproval) => {
                this.submitBtn.rightIcon.visible = isLoading;
                this.secondTokenPanel.enabled = !isLoading;
                this.secondInput.enabled = !isLoading;
                this.startDateContainer.enabled = !isLoading;
                this.endDateContainer.enabled = !isLoading;
                this.inputStartDate.enabled = !isLoading;
                this.inputEndDate.enabled = !isLoading;
                this.statusPanel.enabled = !isLoading;
                this.offerToDropdown.enabled = !isLoading;
                this.addressPanel.enabled = !isLoading;
                this.btnAddress.enabled = !isLoading;
                if (!isApproval) {
                    this.submitBtn.caption = isLoading ? 'Submitting' : 'Submit';
                }
            };
            this.onSetMaxBalance = () => {
                this.model.setCurrentStage(liquidity_utils_2.Stage.SET_AMOUNT);
                this.setBorder(this.firstTokenInput);
                this.model.setMaxBalanceToFromToken();
                this.firstInput.value = this.fromTokenInputText;
                this.onUpdateSummary();
                this.handleTokenInputState();
            };
            this.updateSummaryField = () => {
                this.onUpdateHelpContent();
                if (this.onFocusChanged)
                    this.onFocusChanged(this.currentStage);
            };
            this.showConfirmation = () => {
                this.confirmationModal.visible = true;
            };
            this.hideConfirmation = () => {
                this.confirmationModal.visible = false;
            };
            this.onSubmit = () => {
                this.hideConfirmation();
                this.model.proceed();
            };
            this.preProceed = async (source, stage) => {
                this.model.setCurrentStage(stage);
                this.onProceed(source);
            };
            this.onProceed = async (source) => {
                if (!this.state.isRpcWalletConnected()) {
                    const clientWallet = eth_wallet_8.Wallet.getClientInstance();
                    await clientWallet.switchNetwork(this.state.getChainId());
                    return;
                }
                if (this.isCreate && this.currentStage === liquidity_utils_2.Stage.SUBMIT) {
                    this.showConfirmation();
                }
                else {
                    await this.model.proceed();
                }
                if (this.isCreate) {
                    if (this.offerTo === liquidity_utils_2.OfferState.Whitelist && ["submitBtn", "nextBtn5"].includes(source.id)) {
                        this.removeBorder();
                        if (source.id === "nextBtn5") {
                            this.updateProgress();
                        }
                        this.updateSummaryField();
                    }
                    else if (this.offerTo === liquidity_utils_2.OfferState.Everyone && ["submitBtn", "nextBtn4"].includes(source.id)) {
                        this.removeBorder();
                        if (source.id === "nextBtn4") {
                            this.updateProgress();
                        }
                        this.updateSummaryField();
                    }
                    else {
                        this.setBorder(source);
                    }
                }
                else if (["submitBtn", "nextBtn4"].includes(source.id)) {
                    this.removeBorder();
                    if (source.id === "nextBtn4") {
                        this.updateProgress();
                    }
                    this.updateSummaryField();
                }
                else {
                    this.setBorder(source);
                }
                this.handleTokenInputState();
            };
            this.handleTokenInputState = () => {
                if (this.isCreate) {
                    this.secondTokenPanel.enabled = !this.isOfferPriceDisabled;
                    this.secondInput.enabled = !this.isOfferPriceDisabled;
                    this.startDateContainer.enabled = !this.isStartDateDisabled;
                    this.endDateContainer.enabled = !this.isEndDateDisabled;
                    this.inputStartDate.enabled = !this.isStartDateDisabled;
                    this.inputEndDate.enabled = !this.isEndDateDisabled;
                    this.statusPanel.enabled = !this.isOfferToDisabled;
                    this.offerToDropdown.enabled = !this.isOfferToDisabled;
                    this.addressPanel.visible = this.isAddressShown;
                    this.addressPanel.enabled = !this.isAddressDisabled;
                    this.btnAddress.enabled = !this.isAddressDisabled;
                }
                this.handleBtnState();
            };
            this.handleBtnState = () => {
                if (this.isCreate) {
                    this.nextBtn1.visible = this.isSetOrderAmountStage;
                    this.nextBtn2.visible = this.isOfferPriceStage;
                    this.nextBtn3.visible = this.isStartDateStage || this.isEndDateStage;
                    this.nextBtn4.visible = this.isOfferToStage;
                    this.nextBtn5.visible = this.isAddressStage;
                    this.nextBtn1.enabled = !this.isProceedButtonDisabled;
                    this.nextBtn1.caption = this.nextButtonText;
                    this.nextBtn2.enabled = !this.isProceedButtonDisabled;
                    this.nextBtn2.caption = this.nextButtonText;
                    this.nextBtn3.enabled = !this.isProceedButtonDisabled;
                    this.nextBtn3.caption = this.nextButtonText;
                    this.nextBtn4.enabled = !this.isProceedButtonDisabled;
                    this.nextBtn4.caption = this.nextButtonText;
                    this.nextBtn5.enabled = !this.isProceedButtonDisabled;
                    this.nextBtn5.caption = this.nextButtonText;
                }
                this.submitBtn.enabled = !this.isSubmitButtonDisabled;
                this.submitBtn.caption = this.proceedButtonText;
            };
            this.handleChangeOfferTo = (value) => {
                this.offerToModal.visible = false;
                if (value === this.offerTo)
                    return;
                this.offerTo = value;
                this.offerToDropdown.caption = value;
                this.model.offerToChange(value);
                this.handleBtnState();
                this.addressPanel.visible = this.isAddressShown;
                this.updateTextValues();
                this.onUpdateSummary();
            };
            this.handleFocusInput = (source, stage) => {
                this.model.setCurrentStage(stage);
                this.setBorder(source);
                this.handleTokenInputState();
                this.updateProgress();
            };
            this.changeStartDate = (value) => {
                this.model.startDateChange(value);
                const inputEndDate = this.inputEndDate.querySelector('input[type="datetime-local"]');
                if (inputEndDate) {
                    const date = (0, components_10.moment)(value, 'DD/MM/YYYY HH:mm');
                    const val = date;
                    inputEndDate.min = val.format('YYYY-MM-DD HH:mm');
                }
                if (this.isCreate) {
                    this.onUpdateSummary();
                }
            };
            this.changeEndDate = (value) => {
                this.model.endDateChange(value);
                const inputStartDate = this.inputStartDate.querySelector('input[type="datetime-local"]');
                if (inputStartDate) {
                    const date = (0, components_10.moment)(value, 'DD/MM/YYYY HH:mm');
                    const val = date;
                    inputStartDate.max = val.format('YYYY-MM-DD HH:mm');
                }
                this.handleBtnState();
                this.onUpdateSummary();
            };
            this.setAttrDatePicker = () => {
                if (!this.isCreate)
                    return;
                this.inputStartDate.onChanged = (datepickerElm) => this.changeStartDate(datepickerElm.inputElm.value);
                this.inputEndDate.onChanged = (datepickerElm) => this.changeEndDate(datepickerElm.inputElm.value);
                const minDate = (0, components_10.moment)().format('YYYY-MM-DDTHH:mm');
                const maxDate = (0, components_10.moment)().add(this.model.summaryData().maxDur, 'seconds').format('YYYY-MM-DDTHH:mm');
                const startTextElm = this.inputStartDate.querySelector('input[type="text"]');
                const startDateElm = this.inputStartDate.querySelector('input[type="datetime-local"]');
                const endTextElm = this.inputEndDate.querySelector('input[type="text"]');
                const endDateElm = this.inputEndDate.querySelector('input[type="datetime-local"]');
                if (startDateElm) {
                    startDateElm.min = minDate;
                    startDateElm.max = maxDate;
                    startDateElm.onfocus = (e) => {
                        this.handleFocusInput(e.target, liquidity_utils_2.Stage.SET_START_DATE);
                    };
                    startDateElm.onchange = (e) => {
                        this.model.setCurrentStage(liquidity_utils_2.Stage.SET_START_DATE);
                        this.onProceed(this.inputEndDate);
                    };
                }
                if (startTextElm) {
                    startTextElm.placeholder = 'dd/mm/yyyy hh:mm';
                    startTextElm.onfocus = (e) => {
                        this.handleFocusInput(e.target, liquidity_utils_2.Stage.SET_START_DATE);
                    };
                }
                if (endDateElm) {
                    endDateElm.min = minDate;
                    endDateElm.max = maxDate;
                    endDateElm.onfocus = (e) => {
                        this.handleFocusInput(e.target, liquidity_utils_2.Stage.SET_END_DATE);
                    };
                }
                if (endTextElm) {
                    endTextElm.placeholder = 'dd/mm/yyyy hh:mm';
                    endTextElm.onfocus = (e) => {
                        this.handleFocusInput(e.target, liquidity_utils_2.Stage.SET_END_DATE);
                    };
                }
            };
            this.updateTextValues = () => {
                if (!(this.isCreate || this.isAdd))
                    return;
                const tokenMap = this.state.getTokenMapByChainId(this.chainId);
                this.lbWillGet.caption = (0, index_7.renderBalanceTooltip)({ value: this.newAmount.multipliedBy(this.offerPriceText || 0).toNumber(), symbol: this.state.tokenSymbol(this.chainId, this.toTokenAddress) }, tokenMap);
                this.lbFee.caption = (0, index_7.renderBalanceTooltip)({ value: this.fee, symbol: this.oswapSymbol }, tokenMap);
            };
            this.setData = () => {
                this.oswapToken = (0, liquidity_utils_2.getQueueStakeToken)(this.chainId) || null;
                this.offerTo = this.model.offerTo();
                if (this.model.addresses()) {
                    this.addresses = this.model.addresses().map((v) => {
                        return {
                            ...v,
                            isOld: true,
                            oldAllocation: v.allocation,
                        };
                    });
                    this.model.addressChange(this.addresses);
                }
            };
            this.getAddress = (data) => {
                this.addresses = data.addresses;
                this.model.addressChange(this.addresses);
                if (this.isCreate) {
                    this.model.feeChange(data.fee.plus(this.pairCustomParams.feePerOrder).toFixed());
                }
                else {
                    this.model.feeChange(data.fee.toFixed());
                    this.handleBtnState();
                }
                this.lbAddress.caption = this.addressText;
                this.btnAddress.caption = this.btnAddressText;
                this.onUpdateSummary();
                this.updateTextValues();
            };
            this.showWhitelistModal = () => {
                this.handleFocusInput(this.btnAddress, liquidity_utils_2.Stage.SET_ADDRESS);
                this.updateSummaryField();
                if (this.manageWhitelist) {
                    this.manageWhitelist.props = {
                        tokenSymbol: this.state.tokenSymbol(this.chainId, this.fromTokenAddress),
                        decimals: this.fromTokenDecimals,
                        addresses: this.addresses,
                        balance: this.model.govTokenBalance(),
                        pairCustomParams: this.pairCustomParams,
                    };
                    this.manageWhitelist.convertWhitelistedAddresses = liquidity_utils_2.convertWhitelistedAddresses;
                    if (!this.manageWhitelist.updateAddress) {
                        this.manageWhitelist.updateAddress = (data) => this.getAddress(data);
                    }
                    this.manageWhitelist.showModal();
                }
            };
            this.onSwitchPrice = () => {
                this.isReverse = !this.isReverse;
                const token = this.isReverse ? this.model.fromTokenObject() : this.model.toTokenObject();
                this.secondTokenInput.token = token;
                const firstSymbol = this.state.tokenSymbol(this.chainId, this.fromTokenAddress);
                const secondSymbol = this.state.tokenSymbol(this.chainId, this.toTokenAddress);
                this.lbOfferPrice1.caption = `(${this.isReverse ? firstSymbol : secondSymbol}`;
                this.lbOfferPrice2.caption = `${this.isReverse ? secondSymbol : firstSymbol})`;
                if (Number(this.secondInput.value) > 0) {
                    this.changeOfferPrice();
                }
            };
            this.renderHeader = () => {
                this.headerSection.innerHTML = '';
                const fromToken = this.model.fromTokenObject();
                const toToken = this.model.toTokenObject();
                const iconCog = !this.isFlow ?
                    this.$render("i-icon", { class: "pointer", name: "cog", width: 20, height: 20, fill: Theme.text.primary, margin: { left: 'auto' }, onClick: this.handleCogClick.bind(this) }) :
                    [];
                const elm = (this.$render("i-hstack", { verticalAlignment: "center" },
                    this.$render("i-image", { width: "20px", class: "inline-block", url: fromToken?.logoURI || scom_token_list_5.assets.tokenPath(fromToken, this.chainId), fallbackUrl: index_6.fallbackUrl }),
                    this.$render("i-image", { width: "20px", class: "icon-right inline-block", url: toToken?.logoURI || scom_token_list_5.assets.tokenPath(toToken, this.chainId), fallbackUrl: index_6.fallbackUrl }),
                    this.$render("i-label", { caption: this.state.tokenSymbol(this.chainId, this.fromTokenAddress), class: "small-label", margin: { right: 8 } }),
                    this.$render("i-icon", { name: "arrow-right", width: "16", height: "16", fill: Theme.text.primary, margin: { right: 8 } }),
                    this.$render("i-label", { caption: this.state.tokenSymbol(this.chainId, this.toTokenAddress), class: "small-label" }),
                    iconCog));
                this.headerSection.appendChild(elm);
            };
            this.renderUI = async () => {
                this.pnlForm.clearInnerHTML();
                this.currentFocus = undefined;
                const tokenMap = this.state.getTokenMapByChainId(this.chainId);
                if (this.isCreate) {
                    this.inputStartDate = await components_10.Datepicker.create({ type: 'dateTime', enabled: !this.isStartDateDisabled, width: '100%', height: '60px' });
                    this.inputStartDate.classList.add('custom-datepicker');
                    if (this.model.startDate && this.model.startDate()) {
                        this.inputStartDate.value = this.model.startDate();
                    }
                    this.inputEndDate = await components_10.Datepicker.create({ type: 'dateTime', enabled: !this.isEndDateDisabled, width: '100%', height: '60px' });
                    this.inputEndDate.classList.add('custom-datepicker');
                    if (this.model.endDate && this.model.endDate()) {
                        this.inputEndDate.value = this.model.endDate();
                    }
                }
                const fromToken = this.model.fromTokenObject();
                let newElm = (this.$render("i-panel", null,
                    this.$render("i-panel", { class: "token-box" },
                        this.$render("i-vstack", { class: "input--token-container" },
                            this.$render("i-hstack", { horizontalAlignment: "space-between", verticalAlignment: "end", width: "100%" },
                                this.$render("i-vstack", { width: "50%" },
                                    this.$render("i-label", { caption: "You Are Selling", font: { bold: true } })),
                                this.$render("i-vstack", { width: "50%", horizontalAlignment: "end" },
                                    this.$render("i-label", { class: "text-right", opacity: 0.8, margin: { left: 'auto' }, caption: (0, index_7.renderBalanceTooltip)({ title: 'Balance', value: this.model.fromTokenBalance() }, tokenMap) }))),
                            this.$render("i-panel", { class: "bg-box", width: "100%" },
                                this.$render("i-hstack", { class: "input--token-box", verticalAlignment: "center", horizontalAlignment: "space-between", width: "100%" },
                                    this.$render("i-vstack", { width: "calc(100% - 160px)", height: 48 },
                                        this.$render("i-input", { id: "firstInput", value: this.fromTokenInputText, inputType: "number", placeholder: "0.0", margin: { right: 4 }, class: "token-input w-100", width: "100%", onChanged: this.fromTokenInputTextChange.bind(this), onFocus: this.handleFirstFocusInput.bind(this) })),
                                    this.$render("i-vstack", { maxWidth: "155px" },
                                        this.$render("i-scom-token-input", { id: "firstTokenInput", class: "float-right", width: "100%", background: { color: Theme.input.background }, tokenReadOnly: true, isInputShown: false, isBalanceShown: false }))))),
                        this.$render("i-button", { id: "nextBtn1", class: "btn-os btn-next", visible: this.isCreate && this.isSetOrderAmountStage, caption: this.nextButtonText, onClick: this.handleNext1.bind(this), enabled: !this.isProceedButtonDisabled })),
                    this.isCreate ? (this.$render("i-panel", { id: "secondTokenPanel", class: "token-box", enabled: !this.isOfferPriceDisabled },
                        this.$render("i-vstack", { class: "input--token-container" },
                            this.$render("i-hstack", { class: "balance-info", horizontalAlignment: "space-between", verticalAlignment: "center", width: "100%" },
                                this.$render("i-hstack", { gap: 4, verticalAlignment: "center" },
                                    this.$render("i-label", { font: { bold: true }, caption: "Offer Price" }),
                                    this.$render("i-label", { id: "lbOfferPrice1", font: { bold: true }, caption: `(${this.state.tokenSymbol(this.chainId, this.toTokenAddress)}` }),
                                    this.$render("i-icon", { name: "arrow-right", width: "16", height: "16", fill: Theme.text.primary }),
                                    this.$render("i-label", { id: "lbOfferPrice2", font: { bold: true }, caption: `${this.state.tokenSymbol(this.chainId, this.fromTokenAddress)})` })),
                                this.$render("i-icon", { tooltip: { content: 'Switch Price' }, width: 32, height: 32, class: "toggle-icon", name: "arrows-alt-v", fill: Theme.input.fontColor, background: { color: Theme.input.background }, onClick: this.onSwitchPrice })),
                            this.$render("i-panel", { class: "bg-box", width: "100%" },
                                this.$render("i-hstack", { class: `input--token-box ${this.isOfferPriceStage && 'bordered'}`, verticalAlignment: "center", horizontalAlignment: "space-between", width: "100%" },
                                    this.$render("i-vstack", { width: "calc(100% - 160px)", height: 48 },
                                        this.$render("i-input", { id: "secondInput", value: this.offerPriceText, inputType: "number", placeholder: "0.0", margin: { right: 4 }, class: "token-input w-100", width: "100%", enabled: !this.isOfferPriceDisabled, onChanged: this.changeOfferPrice.bind(this), onFocus: this.handleSecondFocusInput.bind(this) })),
                                    this.$render("i-vstack", { maxWidth: "155px" },
                                        this.$render("i-scom-token-input", { class: "float-right", width: "100%", id: "secondTokenInput", background: { color: 'transparent' }, tokenReadOnly: true, isInputShown: false, isBtnMaxShown: false, isBalanceShown: false }))))),
                        this.$render("i-button", { id: "nextBtn2", class: "btn-os btn-next", visible: this.isOfferPriceStage, caption: this.nextButtonText, onClick: this.handleNext2.bind(this), enabled: !this.isProceedButtonDisabled }))) : [],
                    this.isCreate ? (this.$render("i-panel", { id: "datePanel", class: "token-box" },
                        this.$render("i-hstack", { gap: "10px" },
                            this.$render("i-vstack", { id: "startDateContainer", enabled: !this.isStartDateDisabled, class: "input--token-container" },
                                this.$render("i-hstack", { horizontalAlignment: "space-between", verticalAlignment: "center", width: "100%" },
                                    this.$render("i-label", { font: { bold: true }, caption: "Start Date" })),
                                this.$render("i-panel", { class: "bg-box", width: "100%" },
                                    this.$render("i-hstack", { class: "input--token-box", verticalAlignment: "center", width: "100%" },
                                        this.$render("i-vstack", { width: "100%" }, this.inputStartDate)))),
                            this.$render("i-vstack", { id: "endDateContainer", enabled: !this.isEndDateDisabled, class: "input--token-container" },
                                this.$render("i-hstack", { horizontalAlignment: "space-between", verticalAlignment: "center", width: "100%" },
                                    this.$render("i-label", { font: { bold: true }, caption: "End Date" })),
                                this.$render("i-panel", { class: "bg-box", width: "100%" },
                                    this.$render("i-hstack", { class: "input--token-box", verticalAlignment: "center", width: "100%" },
                                        this.$render("i-vstack", { width: "100%" }, this.inputEndDate))))),
                        this.$render("i-button", { id: "nextBtn3", class: "btn-os btn-next", visible: this.isStartDateStage || this.isEndDateStage, caption: this.nextButtonText, onClick: this.handleNext3.bind(this), enabled: !this.isProceedButtonDisabled }))) : [],
                    this.isCreate ? (this.$render("i-panel", { id: "statusPanel", class: "token-box", enabled: !this.isOfferToDisabled },
                        this.$render("i-vstack", { class: "input--token-container" },
                            this.$render("i-label", { caption: "Offer To", font: { bold: true } }),
                            this.$render("i-panel", { class: "bg-box", width: "100%" },
                                this.$render("i-hstack", { class: "input--token-box", height: 60, padding: { left: 0, right: 0 }, verticalAlignment: "center", width: "100%" },
                                    this.$render("i-panel", { class: "btn-dropdown" },
                                        this.$render("i-button", { id: "offerToDropdown", width: "calc(100% - 1px)", enabled: !this.isOfferToDisabled, caption: this.offerTo, onClick: this.onOfferTo.bind(this) }),
                                        this.$render("i-modal", { id: "offerToModal", showBackdrop: false, height: 'auto', popupPlacement: 'bottom' },
                                            this.$render("i-panel", null, statusList.map((status) => this.$render("i-button", { caption: status, onClick: () => this.handleChangeOfferTo(status) })))))))),
                        this.$render("i-button", { id: "nextBtn4", class: "btn-os btn-next", visible: this.isOfferToStage, caption: this.nextButtonText, onClick: this.handleNext4.bind(this), enabled: !this.isProceedButtonDisabled }))) : [],
                    !this.isRemove ? (this.$render("i-panel", { id: "addressPanel", class: "token-box", visible: this.isAddressShown, enabled: !this.isAddressDisabled },
                        this.$render("i-vstack", { class: "input--token-container" },
                            this.$render("i-hstack", { verticalAlignment: "center" },
                                this.$render("i-label", { caption: "Whitelist Address", margin: { right: 4 }, font: { bold: true } }),
                                this.$render("i-icon", { name: "question-circle", width: 15, height: 15, tooltip: {
                                        content: 'Only whitelisted address(es) are allowed to buy the tokens at your offer price.'
                                    }, class: "custom-question-icon" })),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center" },
                                this.$render("i-label", { id: "lbAddress", font: { bold: true }, caption: this.addressText }),
                                this.$render("i-button", { id: "btnAddress", class: "btn-os btn-address", enabled: !this.isAddressDisabled, caption: this.btnAddressText, onClick: this.showWhitelistModal }))),
                        this.$render("i-button", { id: "nextBtn5", class: "btn-os btn-next", visible: this.isAddressStage, caption: this.nextButtonText, onClick: this.onProceed, enabled: !this.isProceedButtonDisabled }))) : [],
                    this.isCreate || this.isAdd ? (this.$render("i-panel", { class: "token-box" },
                        this.$render("i-vstack", { class: "input--token-container" },
                            this.$render("i-hstack", { verticalAlignment: "center", horizontalAlignment: "space-between" },
                                this.$render("i-label", { caption: "You will get" }),
                                this.$render("i-hstack", { verticalAlignment: "center" },
                                    this.$render("i-label", { caption: "OSWAP Fee", margin: { right: 4 } }),
                                    this.$render("i-icon", { name: "question-circle", width: 15, height: 15, tooltip: {
                                            content: 'The OSWAP fee is calculated by a fixed offer fee + whitelist address fee * no. of whitelisted addresses'
                                        } }))),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between" },
                                this.$render("i-label", { id: "lbWillGet", font: { bold: true } }),
                                this.$render("i-label", { id: "lbFee", font: { bold: true } })),
                            this.$render("i-hstack", { horizontalAlignment: "end" },
                                this.$render("i-label", { id: "lbGovBalance", opacity: 0.8, margin: { left: 'auto' }, caption: (0, index_7.renderBalanceTooltip)({ title: 'Balance', value: this.model.govTokenBalance() }, tokenMap) }))))) : [],
                    this.isCreate ? (this.$render("i-panel", { id: "approveAllowancePanel", class: "token-box" },
                        this.$render("i-vstack", { class: "input--token-container" },
                            this.$render("i-label", { caption: "Approve Allowance", font: { bold: true } }),
                            this.$render("i-panel", { class: "bg-box", width: "100%" },
                                this.$render("i-hstack", { class: "input--token-box", verticalAlignment: "center", horizontalAlignment: "center", width: "100%", gap: "15px", height: 60 },
                                    this.$render("i-label", { caption: this.state.tokenSymbol(this.chainId, this.fromTokenAddress), font: { bold: true } }),
                                    this.$render("i-image", { url: fromToken?.logoURI || scom_token_list_5.assets.tokenPath(fromToken, this.chainId), fallbackUrl: index_6.fallbackUrl, width: "30", class: "inline-block" }),
                                    this.$render("i-label", { caption: "-", class: "inline-block", margin: { right: 8, left: 8 }, font: { bold: true } }),
                                    this.$render("i-image", { url: this.oswapIcon, width: "30", class: "inline-block" }),
                                    this.$render("i-label", { caption: this.oswapSymbol, font: { bold: true } })))))) : [],
                    this.isCreate ? this.renderProgress() : [],
                    this.$render("i-button", { id: "submitBtn", class: "btn-os btn-next", caption: this.proceedButtonText, enabled: !this.isSubmitButtonDisabled, rightIcon: { spin: true, visible: false }, onClick: this.onProceed }),
                    !this.isRemove ? this.$render("manage-whitelist", { id: "manageWhitelist" }) : []));
                if (this.firstTokenInput)
                    this.firstTokenInput.chainId = this.chainId;
                if (this.secondTokenInput)
                    this.secondTokenInput.chainId = this.chainId;
                this.firstTokenInput.onSetMaxBalance = () => this.onSetMaxBalance();
                this.firstTokenInput.token = this.orderAmountTokenObject;
                if (this.secondTokenInput) {
                    this.secondTokenInput.token = this.model.toTokenObject();
                }
                this.pnlForm.appendChild(newElm);
                if (this.isSetOrderAmountStage) {
                    this.setBorder(this.firstInput);
                }
                this.updateTextValues();
                this.setAttrDatePicker();
                this.renderHeader();
            };
            this.renderProgress = () => {
                return (this.$render("i-hstack", { verticalAlignment: "center", horizontalAlignment: "center", width: "100%" },
                    this.$render("i-label", { id: "progress1", caption: "1", class: "progress-number" }),
                    this.$render("i-hstack", { height: 2, width: "100px", background: { color: Theme.text.primary } }),
                    this.$render("i-label", { id: "progress2", caption: "2", class: "progress-number" })));
            };
            this.updateProgress = () => {
                if (this.progress1 && this.progress2) {
                    if (this.model.isFirstTokenApproved()) {
                        this.progress1.caption = "";
                        this.progress1.classList.add("progress-complete");
                        this.progress1.classList.remove("progress-number");
                    }
                    else {
                        this.progress1.caption = "1";
                        this.progress1.classList.add("progress-number");
                        this.progress1.classList.remove("progress-complete");
                    }
                    if (this.model.isGovTokenApproved()) {
                        this.progress2.caption = "";
                        this.progress2.classList.add("progress-complete");
                        this.progress2.classList.remove("progress-number");
                    }
                    else {
                        this.progress2.caption = "2";
                        this.progress2.classList.add("progress-number");
                        this.progress2.classList.remove("progress-complete");
                    }
                }
            };
            this.onApproving = () => {
                this.submitBtn.rightIcon.visible = true;
            };
            this.onApproved = () => {
                this.submitBtn.rightIcon.visible = false;
                this.submitBtn.enabled = !this.isSubmitButtonDisabled;
                this.submitBtn.caption = this.proceedButtonText;
                this.updateProgress();
            };
        }
        set state(value) {
            this._state = value;
        }
        get state() {
            return this._state;
        }
        get model() {
            return this._model;
        }
        set model(value) {
            this._model = value;
            this._model.setOnApproving(this.onApproving);
            this._model.setOnApproved(this.onApproved);
            this.setData();
            this.renderUI();
        }
        get actionType() {
            return this._actionType;
        }
        set actionType(value) {
            this._actionType = value;
        }
        get isFlow() {
            return this._isFlow;
        }
        set isFlow(value) {
            this._isFlow = value;
        }
        get isCreate() {
            return this.actionType === liquidity_utils_2.Action.CREATE;
        }
        get isAdd() {
            return this.actionType === liquidity_utils_2.Action.ADD;
        }
        get isRemove() {
            return this.actionType === liquidity_utils_2.Action.REMOVE;
        }
        get chainId() {
            return this.state?.getChainId();
        }
        get balanceTitle() {
            return this.isCreate || this.isAdd ? 'You Are Selling' : 'You Are Collecting';
        }
        get currentStage() {
            return this.model.currentStage();
        }
        get fromTokenAddress() {
            return this.model.fromTokenAddress();
        }
        get toTokenAddress() {
            return this.model.toTokenAddress();
        }
        get orderAmountTokenObject() {
            return this.model.fromTokenObject();
        }
        get pairCustomParams() {
            return this.model.pairCustomParams();
        }
        get isSetOrderAmountStage() {
            return this.currentStage === liquidity_utils_2.Stage.SET_AMOUNT;
        }
        get isOfferPriceStage() {
            return this.currentStage === liquidity_utils_2.Stage.SET_OFFER_PRICE;
        }
        get isStartDateStage() {
            return this.currentStage === liquidity_utils_2.Stage.SET_START_DATE;
        }
        get isEndDateStage() {
            return this.currentStage === liquidity_utils_2.Stage.SET_END_DATE;
        }
        get isOfferToStage() {
            return this.currentStage === liquidity_utils_2.Stage.SET_OFFER_TO;
        }
        get isAddressStage() {
            return this.currentStage === liquidity_utils_2.Stage.SET_ADDRESS;
        }
        get isOfferPriceDisabled() {
            return this.isCreate && this.currentStage < liquidity_utils_2.Stage.SET_OFFER_PRICE;
        }
        ;
        get isStartDateDisabled() {
            return this.isCreate && this.currentStage < liquidity_utils_2.Stage.SET_START_DATE;
        }
        ;
        get isEndDateDisabled() {
            return this.isCreate && this.currentStage < liquidity_utils_2.Stage.SET_END_DATE && (!this.model.startDate() || (this.model.startDate() && this.currentStage !== liquidity_utils_2.Stage.SET_START_DATE));
        }
        ;
        get isOfferToDisabled() {
            return this.currentStage < liquidity_utils_2.Stage.SET_OFFER_TO;
        }
        ;
        get isLockDisabled() {
            return this.isCreate && this.currentStage < liquidity_utils_2.Stage.SET_LOCKED;
        }
        ;
        get isAddressDisabled() {
            return this.isCreate && this.currentStage < liquidity_utils_2.Stage.SET_ADDRESS || this.isLockDisabled;
        }
        ;
        get isAddressShown() {
            return this.model.offerTo() === liquidity_utils_2.OfferState.Whitelist;
        }
        ;
        get isProceedButtonDisabled() {
            return this.model.isProceedButtonDisabled();
        }
        get isSubmitButtonDisabled() {
            if (!this.state.isRpcWalletConnected())
                return false;
            if (this.isCreate) {
                return this.isProceedButtonDisabled ||
                    !(this.currentStage === liquidity_utils_2.Stage.SUBMIT || this.currentStage === liquidity_utils_2.Stage.FIRST_TOKEN_APPROVAL || this.currentStage === liquidity_utils_2.Stage.GOV_TOKEN_APPROVAL) ||
                    (new eth_wallet_8.BigNumber(this.model.fee()).gt(this.model.govTokenBalance()));
            }
            return this.isProceedButtonDisabled;
        }
        get proceedButtonText() {
            return this.model.proceedButtonText();
        }
        get nextButtonText() {
            return this.model.nextButtonText();
        }
        get fromTokenInputText() {
            return this.model.fromTokenInputText();
        }
        get fromTokenDecimals() {
            return this.model.fromTokenObject()?.decimals || 18;
        }
        get offerPriceText() {
            return this.model.offerPriceText();
        }
        get offerTokenDecimals() {
            return this.state.getTokenDecimals(this.chainId, this.toTokenAddress);
        }
        ;
        get newAmount() {
            return this.model.newAmount();
        }
        get fee() {
            return this.model.fee();
        }
        get addressText() {
            const count = this.addresses.length;
            return count === 1 ? `${count} Address` : `${count} Addresses`;
        }
        get btnAddressText() {
            return this.addresses && this.addresses.length ? 'Manage Address' : 'Add Address';
        }
        get oswapIcon() {
            return this.oswapToken && this.oswapToken.address ? scom_token_list_5.assets.tokenPath(this.oswapToken, this.chainId) : '';
        }
        get oswapSymbol() {
            return this.oswapToken && this.oswapToken.address ? this.state.tokenSymbol(this.chainId, this.oswapToken.address) : this.oswapToken.symbol ?? '';
        }
        handleNext1() {
            this.onProceed(this.secondInput);
        }
        handleNext2() {
            this.onProceed(this.inputStartDate);
        }
        handleNext3() {
            this.preProceed(this.offerToDropdown, liquidity_utils_2.Stage.SET_END_DATE);
        }
        handleNext4() {
            this.onProceed(this.isAddressShown ? this.btnAddress : this.nextBtn4);
        }
        handleFirstFocusInput(source) {
            this.handleFocusInput(source, liquidity_utils_2.Stage.SET_AMOUNT);
        }
        handleSecondFocusInput(source) {
            this.handleFocusInput(source, liquidity_utils_2.Stage.SET_OFFER_PRICE);
        }
        setBorder(source) {
            this.removeBorder();
            this.onUpdateHelpContent();
            const focusItem = source.closest('i-hstack.input--token-box');
            if (focusItem) {
                focusItem.classList.add("bordered");
                this.currentFocus = focusItem;
                if (this.onFocusChanged)
                    this.onFocusChanged(this.currentStage);
            }
        }
        removeBorder() {
            if (this.currentFocus) {
                this.currentFocus.classList.remove("bordered");
            }
        }
        async fromTokenInputTextChange() {
            (0, index_7.limitInputNumber)(this.firstInput, this.fromTokenDecimals);
            await this.model.fromTokenInputTextChange(this.firstInput.value || '');
            this.updateTextValues();
            this.handleBtnState();
            this.onUpdateSummary();
        }
        changeOfferPrice() {
            const decimals = this.isReverse ? this.fromTokenDecimals : this.offerTokenDecimals;
            (0, index_7.limitInputNumber)(this.secondInput, decimals || 18);
            const val = this.isReverse && Number(this.secondInput.value) > 0 ? new eth_wallet_8.BigNumber(1).dividedBy(this.secondInput.value) : new eth_wallet_8.BigNumber(this.secondInput.value || 0);
            const offerPrice = (0, index_7.limitDecimals)(val.toFixed(), decimals || 18);
            this.model.offerPriceInputTextChange(offerPrice || '0');
            this.updateTextValues();
            this.handleBtnState();
            this.onUpdateSummary();
        }
        ;
        onOfferTo(source) {
            this.offerToModal.width = +this.offerToDropdown.width + 34;
            this.offerToModal.visible = !this.offerToModal.visible;
            this.handleFocusInput(source, liquidity_utils_2.Stage.SET_OFFER_TO);
        }
        handleCogClick() {
            if (this.onCogClick)
                this.onCogClick();
        }
        render() {
            return (this.$render("i-panel", { class: "detail-col" },
                this.$render("i-panel", { class: "detail-col_header", id: "headerSection" }),
                this.$render("i-panel", { id: "pnlForm" }),
                this.$render("i-modal", { id: "confirmationModal", class: "bg-modal", closeIcon: { name: 'times' } },
                    this.$render("i-panel", { class: "header" },
                        this.$render("i-icon", { width: 24, height: 24, name: "times", class: "pointer", onClick: this.hideConfirmation })),
                    this.$render("i-panel", { class: "i-modal_content text-center" },
                        this.$render("i-hstack", { verticalAlignment: "center", horizontalAlignment: "center", margin: { bottom: 16 } },
                            this.$render("i-image", { width: 80, height: 80, url: assets_3.default.fullPath('img/warning-icon.png') })),
                        this.$render("i-vstack", { verticalAlignment: "center", padding: { left: 20, right: 20 } },
                            this.$render("i-label", { class: "text-warning", margin: { bottom: 16 }, caption: "Please double-check and confirm that the information is accurate! Once this order is submitted, you are not allowed to edit the price, the start date, and the end date of the offer." })),
                        this.$render("i-hstack", { verticalAlignment: "center", horizontalAlignment: "center", gap: "10px", margin: { top: 20, bottom: 10 } },
                            this.$render("i-button", { caption: "Cancel", class: "btn-os btn-cancel", onClick: this.hideConfirmation }),
                            this.$render("i-button", { caption: "Proceed", class: "btn-os", onClick: this.onSubmit }))))));
        }
    };
    LiquidityForm = __decorate([
        (0, components_10.customElements)('liquidity-form')
    ], LiquidityForm);
    exports.LiquidityForm = LiquidityForm;
});
define("@scom/scom-liquidity-provider/detail/progress.tsx", ["require", "exports", "@ijstech/components"], function (require, exports, components_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LiquidityProgress = void 0;
    const Theme = components_11.Styles.Theme.ThemeVars;
    ;
    let LiquidityProgress = class LiquidityProgress extends components_11.Module {
        get onProgressDone() {
            return this._onProgressDone;
        }
        set onProgressDone(callback) {
            this._onProgressDone = callback;
        }
        init() {
            this.percent = 100;
            super.init();
            this.runProgress();
        }
        runProgress() {
            this.interVal = setInterval(() => {
                this.percent -= 1;
                if (this.percent === 0) {
                    clearInterval(this.interVal);
                    this.timeout = setTimeout(() => {
                        if (this.enabled && this._onProgressDone) {
                            this._onProgressDone();
                        }
                        this.percent = 100;
                        this.runProgress();
                    }, 1000);
                }
            }, 300);
        }
        reStartProgress() {
            if (this.enabled && this._onProgressDone) {
                this._onProgressDone();
            }
            clearInterval(this.interVal);
            clearTimeout(this.timeout);
            this.percent = 100;
            this.runProgress();
        }
        render() {
            return (this.$render("i-panel", { class: 'custom-progress flex' },
                this.$render("i-progress", { id: "progress", type: "circle", percent: this.percent, width: "24", height: "24", class: "flex align-middle" }),
                this.$render("i-icon", { name: "sync", width: "24", height: "24", class: "inline-block ml-1 pointer", fill: Theme.colors.primary.main, onClick: this.reStartProgress.bind(this) })));
        }
    };
    __decorate([
        (0, components_11.observable)()
    ], LiquidityProgress.prototype, "percent", void 0);
    LiquidityProgress = __decorate([
        (0, components_11.customElements)('liquidity-progress')
    ], LiquidityProgress);
    exports.LiquidityProgress = LiquidityProgress;
});
define("@scom/scom-liquidity-provider/detail/summary.tsx", ["require", "exports", "@ijstech/components", "@scom/scom-liquidity-provider/global/index.ts", "@ijstech/eth-wallet", "@scom/scom-liquidity-provider/liquidity-utils/index.ts"], function (require, exports, components_12, index_8, eth_wallet_9, index_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LiquiditySummary = void 0;
    ;
    let LiquiditySummary = class LiquiditySummary extends components_12.Module {
        constructor(parent, options) {
            super(parent, options);
            this.formatDate = (date) => {
                if (!date)
                    return 'dd/mm/yyyy hh:mm:ss';
                return (0, index_8.formatDate)(date, index_8.DefaultDateTimeFormat, true);
            };
        }
        set state(value) {
            this._state = value;
        }
        get state() {
            return this._state;
        }
        get chainId() {
            return this.state?.getChainId();
        }
        get fromTokenAddress() {
            return this._fromTokenAddress;
        }
        set fromTokenAddress(value) {
            this._fromTokenAddress = value;
        }
        get actionType() {
            return this._actionType;
        }
        set actionType(value) {
            if (this._actionType === value)
                return;
            this._actionType = value;
            this.isSummaryLoaded = false;
        }
        get summaryData() {
            return this._summaryData;
        }
        set summaryData(value) {
            this._summaryData = value;
            if (!this.isSummaryLoaded)
                this.renderSummary();
            else
                this.updateSummaryUI();
        }
        get isPriceError() {
            return this.summaryData.price === null;
        }
        get fetchData() {
            return this._fetchData;
        }
        set fetchData(callback) {
            this._fetchData = callback;
        }
        showAddresses(addresses) {
            this.manageWhitelist.props = {
                isReadOnly: true,
                tokenSymbol: this.state.tokenSymbol(this.chainId, this.summaryData.fromTokenAddress),
                addresses,
            };
            this.manageWhitelist.showModal();
        }
        getSummaryData(stage) {
            const { amount, newAmount, newOfferPrice, newStartDate, newEndDate, switchLock, offerTo, fee, addresses, newAddresses, newTotalAddress, newTotalAllocation, toTokenAddress } = this.summaryData;
            let amountRow = [];
            let offerPriceRow = [];
            let startDateRow = [];
            let endDateRow = [];
            let statusRow = [];
            let whitelistRow = [];
            let receiveRow = [];
            let feeRow = [];
            const fromSymbol = this.state.tokenSymbol(this.chainId, this.fromTokenAddress);
            const toSymbol = this.state.tokenSymbol(this.chainId, toTokenAddress);
            const tokenMap = this.state.getTokenMapByChainId(this.chainId);
            const isOfferPriceValid = newOfferPrice ? new eth_wallet_9.BigNumber(newOfferPrice).gt(0) : false;
            if (this.actionType === index_9.Action.CREATE) {
                amountRow = [
                    {
                        id: 'amountRow',
                        title: 'Amount',
                        data: {
                            row1: {
                                display: (0, index_8.renderBalanceTooltip)({ value: newAmount || 0, symbol: fromSymbol }, tokenMap),
                                className: 'highlight-value'
                            }
                        },
                        shown: true
                    }
                ];
            }
            else {
                amountRow = [
                    {
                        id: 'amountRow',
                        title: 'Amount',
                        data: {
                            row1: {
                                display: (0, index_8.renderBalanceTooltip)({ value: amount || 0, symbol: fromSymbol }, tokenMap),
                                className: 'text-left'
                            },
                            row2: {
                                display: (0, index_8.renderBalanceTooltip)({ value: newAmount || 0, symbol: fromSymbol }, tokenMap),
                                className: 'highlight-value text-right'
                            }
                        },
                        className: 'summary-row--one',
                        shown: true
                    }
                ];
            }
            offerPriceRow = [
                {
                    id: 'offerPriceRow',
                    title: 'Offer Price per Token',
                    data: {
                        row1: {
                            display: isOfferPriceValid ?
                                (0, index_8.renderBalanceTooltip)({ prefix: `1 ${fromSymbol} = `, value: newOfferPrice, symbol: toSymbol }, tokenMap) :
                                newOfferPrice ? (0, index_8.renderBalanceTooltip)({ value: newOfferPrice, symbol: toSymbol }, tokenMap) : '-',
                            className: 'highlight-value text-right'
                        },
                        row2: {
                            display: (0, index_8.renderBalanceTooltip)({ prefix: `1 ${toSymbol} = `, value: 1 / newOfferPrice, symbol: fromSymbol, isWrapped: true }, tokenMap),
                            className: 'text-right',
                            shown: isOfferPriceValid,
                        },
                    },
                    shown: !this.isPriceError
                },
                {
                    id: 'priceErrorRow',
                    title: 'Price exceeds the acceptable range',
                    shown: this.isPriceError,
                    className: 'red-color'
                }
            ];
            startDateRow = [
                {
                    id: 'startDateRow',
                    title: 'Start Time',
                    data: {
                        row1: {
                            display: this.formatDate(newStartDate),
                            className: 'highlight-value'
                        }
                    },
                    shown: this.actionType === index_9.Action.CREATE || this.actionType === index_9.Action.REMOVE
                }
            ];
            endDateRow = [
                {
                    id: 'endDateRow',
                    title: 'End Time',
                    data: {
                        row1: {
                            display: this.formatDate(newEndDate),
                            className: 'highlight-value'
                        }
                    },
                    shown: this.actionType === index_9.Action.CREATE || this.actionType === index_9.Action.REMOVE
                }
            ];
            statusRow = [
                {
                    id: 'statusRow',
                    title: 'Status',
                    data: {
                        row1: {
                            display: switchLock,
                            className: 'highlight-value'
                        }
                    },
                    shown: true
                }
            ];
            whitelistRow = [
                {
                    id: 'whitelistRow',
                    title: 'Whitelist address',
                    data: {
                        row1: {
                            display: offerTo === index_9.OfferState.Whitelist ? `${newTotalAddress} ${newTotalAddress === 1 ? 'Address' : 'Addresses'}` : offerTo,
                            className: 'highlight-value',
                            onClick: offerTo === index_9.OfferState.Whitelist && newTotalAddress ? () => this.showAddresses(newAddresses) : undefined,
                        }
                    },
                    shown: true
                },
                {
                    id: 'allocationRow',
                    title: 'Total Allocation',
                    data: {
                        row1: {
                            display: (0, index_8.renderBalanceTooltip)({ value: offerTo === index_9.OfferState.Whitelist ? newTotalAllocation : newAmount, symbol: fromSymbol }, tokenMap),
                            className: 'highlight-value'
                        }
                    },
                    shown: true
                }
            ];
            receiveRow = [
                {
                    id: 'receiveRow',
                    title: 'You will get',
                    data: {
                        row1: {
                            display: (0, index_8.renderBalanceTooltip)({ value: newAmount * newOfferPrice, symbol: toSymbol }, tokenMap),
                            className: 'highlight-value'
                        }
                    },
                    shown: true
                }
            ];
            feeRow = [
                {
                    id: 'feeRow',
                    title: 'OSWAP Fee',
                    data: {
                        row1: {
                            display: (0, index_8.renderBalanceTooltip)({ value: fee || 0, symbol: 'OSWAP' }, tokenMap),
                            className: 'highlight-value'
                        }
                    },
                    shown: true
                }
            ];
            switch (stage) {
                case index_9.Stage.SET_AMOUNT:
                    return [...amountRow, ...receiveRow];
                case index_9.Stage.SET_OFFER_PRICE:
                    return [...offerPriceRow, ...receiveRow];
                case index_9.Stage.SET_START_DATE:
                    return startDateRow;
                case index_9.Stage.SET_END_DATE:
                    return endDateRow;
                case index_9.Stage.SET_OFFER_TO:
                case index_9.Stage.SET_END_DATE:
                    return whitelistRow;
                default:
                    return [
                        ...amountRow,
                        ...offerPriceRow,
                        ...startDateRow,
                        ...endDateRow,
                        ...statusRow,
                        ...whitelistRow,
                        ...receiveRow,
                        ...feeRow,
                    ];
            }
        }
        renderSummary() {
            let childElm;
            this.summarySection.innerHTML = '';
            const summaryRows = this.getSummaryData();
            const checkDisplay = (data) => {
                if (data.row1 && data.row2) {
                    return (this.$render("i-panel", { class: `summary-inner flex-col` },
                        this.$render("i-label", { class: `first-data ${data.row1.className || ''} ${data.row1.shown === false ? 'hidden' : ''}`, caption: data.row1.display }),
                        this.$render("i-label", { class: `second-data ${data.row2.className || ''} ${data.row2.shown === false ? 'hidden' : ''}`, caption: `${data.row2.display}` })));
                }
                else {
                    const className = `first-data ${data.row1.className || ''} ${data.row1.shown === false ? 'hidden' : ''} ${data.row1.onClick ? 'text-underline pointer' : ''}`;
                    const label = this.$render("i-label", { class: className, caption: data.row1.display });
                    if (data.row1.onClick) {
                        label.onClick = data.row1.onClick;
                    }
                    return label;
                }
            };
            childElm = (this.$render("i-panel", null, summaryRows.map(summary => {
                return (this.$render("i-hstack", { id: summary.id, horizontalAlignment: 'space-between', class: `summary-row ${summary.className || ''} ${summary.shown === false ? 'hidden' : ''}` },
                    this.$render("i-panel", { class: "text-left" },
                        this.$render("i-label", { class: "summary-row_label", caption: summary.title })),
                    this.$render("i-panel", null, summary.data ?
                        this.$render("i-panel", { class: "summary-row_body" }, checkDisplay(summary.data))
                        : this.$render("i-label", null))));
            })));
            this.summarySection.appendChild(childElm);
            this.isSummaryLoaded = true;
        }
        updateSummaryUI(stage) {
            const summaryRows = this.getSummaryData(stage);
            summaryRows.forEach(summary => {
                const elmId = summary.id;
                if (this[elmId]) {
                    const row = this[elmId];
                    if (summary.shown)
                        row.classList.remove("hidden");
                    else
                        row.classList.add("hidden");
                    if (summary.data) {
                        const row1Data = summary.data.row1;
                        const row2Data = summary.data.row2;
                        if (row2Data) {
                            const firstDataLabel = row.querySelector('.summary-row_body i-label.first-data');
                            const secondDataLabel = row.querySelector('.summary-row_body i-label.second-data');
                            firstDataLabel.caption = row1Data.display;
                            if (row1Data.shown === false) {
                                firstDataLabel.classList.add("hidden");
                            }
                            else {
                                firstDataLabel.classList.remove("hidden");
                            }
                            secondDataLabel.caption = row2Data.display;
                            if (row2Data.shown === false) {
                                secondDataLabel.classList.add("hidden");
                            }
                            else {
                                secondDataLabel.classList.remove("hidden");
                            }
                        }
                        else {
                            const label = row.querySelector('.summary-row_body > i-label');
                            label.caption = row1Data.display;
                            if (row1Data.onClick) {
                                label.onClick = row1Data.onClick;
                                label.classList.add('text-underline', 'pointer');
                            }
                            else {
                                label.onClick = () => { };
                                label.classList.remove('text-underline', 'pointer');
                            }
                        }
                    }
                }
            });
        }
        init() {
            super.init();
        }
        onFetchData() {
            if (this.fetchData) {
                this.fetchData();
            }
        }
        resetHighlight() {
            this.amountRow?.classList.remove("highlight-row");
            this.offerPriceRow?.classList.remove("highlight-row");
            this.startDateRow?.classList.remove("highlight-row");
            this.endDateRow?.classList.remove("highlight-row");
            this.statusRow?.classList.remove("highlight-row");
            this.allocationRow?.classList.remove("highlight-row");
            this.whitelistRow?.classList.remove("highlight-row");
            this.receiveRow?.classList.remove("highlight-row");
            this.feeRow?.classList.remove("highlight-row");
        }
        onHighlight(stage) {
            this.resetHighlight();
            switch (stage) {
                case index_9.Stage.SET_AMOUNT:
                    this.amountRow?.classList.add("highlight-row");
                    this.receiveRow?.classList.add("highlight-row");
                    break;
                case index_9.Stage.SET_OFFER_PRICE:
                    this.offerPriceRow?.classList.add("highlight-row");
                    this.receiveRow?.classList.add("highlight-row");
                    break;
                case index_9.Stage.SET_START_DATE:
                    this.startDateRow?.classList.add("highlight-row");
                    break;
                case index_9.Stage.SET_END_DATE:
                    this.endDateRow?.classList.add("highlight-row");
                    break;
                case index_9.Stage.SET_OFFER_TO:
                case index_9.Stage.SET_ADDRESS:
                    this.whitelistRow?.classList.add("highlight-row");
                    this.allocationRow?.classList.add("highlight-row");
                    break;
            }
        }
        render() {
            return (this.$render("i-panel", { class: 'detail-col detail-col--summary' },
                this.$render("i-hstack", { class: "detail-col_header", horizontalAlignment: "space-between" },
                    this.$render("i-label", { caption: "Order Summary" }),
                    this.$render("i-hstack", { verticalAlignment: "center", class: "custom-group--icon" },
                        this.$render("liquidity-progress", { onProgressDone: this.onFetchData }))),
                this.$render("i-panel", { id: "summarySection", class: "summary" }),
                this.$render("manage-whitelist", { id: "manageWhitelist" })));
        }
    };
    LiquiditySummary = __decorate([
        (0, components_12.customElements)('liquidity-summary')
    ], LiquiditySummary);
    exports.LiquiditySummary = LiquiditySummary;
});
define("@scom/scom-liquidity-provider/detail/help.tsx", ["require", "exports", "@ijstech/components", "@scom/scom-liquidity-provider/assets.ts"], function (require, exports, components_13, assets_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LiquidityHelp = void 0;
    ;
    let LiquidityHelp = class LiquidityHelp extends components_13.Module {
        constructor() {
            super(...arguments);
            this._adviceTexts = [];
        }
        get adviceTexts() {
            return this._adviceTexts;
        }
        set adviceTexts(value) {
            this._adviceTexts = value;
            this.updateAdviceText();
        }
        updateAdviceText() {
            this.rightContainer.innerHTML = '';
            this._adviceTexts.forEach((text, index) => {
                const prefix = this._adviceTexts.length > 1 ? `${index + 1}. ` : '';
                const adviceLabel = this.$render("i-label", { class: "inline-block", caption: prefix + text });
                this.rightContainer.appendChild(adviceLabel);
            });
        }
        render() {
            return (this.$render("i-panel", { class: "detail-col" },
                this.$render("i-panel", { class: "detail-col_header" },
                    this.$render("i-label", { caption: "Help" })),
                this.$render("i-hstack", { verticalAlignment: "center", margin: { top: 16 } },
                    this.$render("i-panel", null,
                        this.$render("i-image", { width: "50", height: "50", class: "inline-block", margin: { right: 8 }, url: assets_4.default.fullPath('img/Help-Troll-Icon-Full-Body.svg') })),
                    this.$render("i-panel", { id: "rightContainer" }))));
        }
    };
    LiquidityHelp = __decorate([
        (0, components_13.customElements)('liquidity-help')
    ], LiquidityHelp);
    exports.LiquidityHelp = LiquidityHelp;
});
define("@scom/scom-liquidity-provider/detail/index.tsx", ["require", "exports", "@scom/scom-liquidity-provider/detail/form.tsx", "@scom/scom-liquidity-provider/detail/summary.tsx", "@scom/scom-liquidity-provider/detail/help.tsx", "@scom/scom-liquidity-provider/detail/progress.tsx"], function (require, exports, form_1, summary_1, help_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LiquidityProgress = exports.LiquidityHelp = exports.LiquiditySummary = exports.LiquidityForm = void 0;
    Object.defineProperty(exports, "LiquidityForm", { enumerable: true, get: function () { return form_1.LiquidityForm; } });
    Object.defineProperty(exports, "LiquiditySummary", { enumerable: true, get: function () { return summary_1.LiquiditySummary; } });
    Object.defineProperty(exports, "LiquidityHelp", { enumerable: true, get: function () { return help_1.LiquidityHelp; } });
    Object.defineProperty(exports, "LiquidityProgress", { enumerable: true, get: function () { return progress_1.LiquidityProgress; } });
});
define("@scom/scom-liquidity-provider/flow/initialSetup.tsx", ["require", "exports", "@ijstech/components", "@scom/scom-liquidity-provider/store/index.ts", "@ijstech/eth-wallet", "@scom/scom-token-list", "@scom/scom-liquidity-provider/liquidity-utils/index.ts"], function (require, exports, components_14, index_10, eth_wallet_10, scom_token_list_6, index_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Theme = components_14.Styles.Theme.ThemeVars;
    let ScomLiquidityProviderFlowInitialSetup = class ScomLiquidityProviderFlowInitialSetup extends components_14.Module {
        constructor() {
            super(...arguments);
            this.walletEvents = [];
        }
        get state() {
            return this._state;
        }
        set state(value) {
            this._state = value;
        }
        get rpcWallet() {
            return this.state.getRpcWallet();
        }
        get chainId() {
            return this.executionProperties.chainId || this.executionProperties.defaultChainId;
        }
        async resetRpcWallet() {
            await this.state.initRpcWallet(this.chainId);
        }
        async setData(value) {
            this.executionProperties = value.executionProperties;
            this.tokenRequirements = value.tokenRequirements;
            this.lblTitle.caption = this.executionProperties.isCreate ? "Get Ready to Create Offer" : "Get Ready to Provide Liquidity";
            this.pnlActions.visible = !this.executionProperties.isCreate;
            await this.resetRpcWallet();
            await this.initializeWidgetConfig();
        }
        async initWallet() {
            try {
                const rpcWallet = this.rpcWallet;
                await rpcWallet.init();
            }
            catch (err) {
                console.log(err);
            }
        }
        async initializeWidgetConfig() {
            const connected = (0, index_10.isClientWalletConnected)();
            this.updateConnectStatus(connected);
            await this.initWallet();
            this.tokenInInput.chainId = this.chainId;
            this.tokenOutInput.chainId = this.chainId;
            const tokens = scom_token_list_6.tokenStore.getTokenList(this.chainId);
            this.tokenInInput.tokenDataListProp = tokens;
            this.tokenOutInput.tokenDataListProp = tokens;
        }
        async connectWallet() {
            if (!(0, index_10.isClientWalletConnected)()) {
                if (this.mdWallet) {
                    await components_14.application.loadPackage('@scom/scom-wallet-modal', '*');
                    this.mdWallet.networks = this.executionProperties.networks;
                    this.mdWallet.wallets = this.executionProperties.wallets;
                    this.mdWallet.showModal();
                }
            }
        }
        updateConnectStatus(connected) {
            if (connected) {
                this.lblConnectedStatus.caption = 'Connected with ' + eth_wallet_10.Wallet.getClientInstance().address;
                this.btnConnectWallet.visible = false;
            }
            else {
                this.lblConnectedStatus.caption = 'Please connect your wallet first';
                this.btnConnectWallet.visible = true;
            }
        }
        registerEvents() {
            let clientWallet = eth_wallet_10.Wallet.getClientInstance();
            this.walletEvents.push(clientWallet.registerWalletEvent(this, eth_wallet_10.Constants.ClientWalletEvent.AccountsChanged, async (payload) => {
                const { account } = payload;
                let connected = !!account;
                this.updateConnectStatus(connected);
            }));
        }
        onHide() {
            let clientWallet = eth_wallet_10.Wallet.getClientInstance();
            for (let event of this.walletEvents) {
                clientWallet.unregisterWalletEvent(event);
            }
            this.walletEvents = [];
        }
        init() {
            super.init();
            this.tokenInInput.style.setProperty('--input-background', '#232B5A');
            this.tokenInInput.style.setProperty('--input-font_color', '#fff');
            this.tokenOutInput.style.setProperty('--input-background', '#232B5A');
            this.tokenOutInput.style.setProperty('--input-font_color', '#fff');
            this.registerEvents();
        }
        async handleClickStart() {
            this.executionProperties.chainId = this.chainId;
            this.executionProperties.tokenIn = this.tokenInInput.token?.address || this.tokenInInput.token?.symbol;
            this.executionProperties.tokenOut = this.tokenOutInput.token?.address || this.tokenOutInput.token?.symbol;
            if (this.action !== 'create' && this.comboOfferIndex.selectedItem) {
                this.executionProperties.offerIndex = this.comboOfferIndex.selectedItem.value;
            }
            if (this.action) {
                this.executionProperties.action = this.action;
            }
            this.executionProperties.isFlow = true;
            if (this.state.handleNextFlowStep)
                this.state.handleNextFlowStep({
                    isInitialSetup: true,
                    tokenRequirements: this.tokenRequirements,
                    executionProperties: this.executionProperties
                });
        }
        async handleSelectToken() {
            this.comboOfferIndex.clear();
            try {
                if (this.tokenInInput.token && this.tokenOutInput.token) {
                    const wallet = this.state.getRpcWallet();
                    const chainId = this.chainId;
                    this.comboOfferIndex.icon.name = 'spinner';
                    this.comboOfferIndex.icon.spin = true;
                    this.comboOfferIndex.enabled = false;
                    if (chainId && chainId != wallet.chainId) {
                        await wallet.switchNetwork(chainId);
                    }
                    const pairAddress = await (0, index_11.getPair)(this.state, this.tokenInInput.token, this.tokenOutInput.token);
                    const fromTokenAddress = this.tokenInInput.token.address?.toLowerCase() || this.tokenInInput.token.symbol;
                    const toTokenAddress = this.tokenOutInput.token.address?.toLowerCase() || this.tokenOutInput.token.symbol;
                    const offerIndexes = await (0, index_11.getOfferIndexes)(this.state, pairAddress, fromTokenAddress, toTokenAddress);
                    this.comboOfferIndex.items = offerIndexes.map(v => { return { label: v.toString(), value: v.toString() }; });
                }
                else {
                    this.comboOfferIndex.items = [];
                }
            }
            catch {
                this.comboOfferIndex.items = [];
            }
            finally {
                this.comboOfferIndex.icon.name = 'angle-down';
                this.comboOfferIndex.icon.spin = false;
                this.comboOfferIndex.enabled = true;
            }
        }
        updateActionButton() {
            if (this.action === 'add') {
                this.btnAdd.background.color = Theme.colors.primary.main;
                this.btnAdd.font = { color: Theme.colors.primary.contrastText };
                this.btnAdd.icon.name = 'check-circle';
                this.btnRemove.background.color = Theme.colors.primary.contrastText;
                this.btnRemove.font = { color: Theme.colors.primary.main };
                this.btnRemove.icon = undefined;
            }
            else if (this.action === 'remove') {
                this.btnRemove.background.color = Theme.colors.primary.main;
                this.btnRemove.font = { color: Theme.colors.primary.contrastText };
                this.btnRemove.icon.name = 'check-circle';
                this.btnAdd.background.color = Theme.colors.primary.contrastText;
                this.btnAdd.font = { color: Theme.colors.primary.main };
                this.btnAdd.icon = undefined;
            }
        }
        async handleClickAdd() {
            this.action = 'add';
            this.updateActionButton();
            this.pnlAdditional.visible = true;
        }
        async handleClickRemove() {
            this.action = 'remove';
            this.updateActionButton();
            this.pnlAdditional.visible = true;
        }
        render() {
            return (this.$render("i-vstack", { gap: "1rem", padding: { top: 10, bottom: 10, left: 20, right: 20 } },
                this.$render("i-label", { id: "lblTitle", caption: "Get Ready to Provide Liquidity" }),
                this.$render("i-vstack", { gap: "1rem" },
                    this.$render("i-label", { id: "lblConnectedStatus" }),
                    this.$render("i-hstack", null,
                        this.$render("i-button", { id: "btnConnectWallet", caption: "Connect Wallet", padding: { top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }, font: { color: Theme.colors.primary.contrastText }, onClick: this.connectWallet.bind(this) }))),
                this.$render("i-vstack", { id: "pnlActions", gap: "1rem" },
                    this.$render("i-label", { caption: "What would you like to do?" }),
                    this.$render("i-hstack", { verticalAlignment: "center", gap: "0.5rem" },
                        this.$render("i-button", { id: "btnAdd", caption: "Add Liquidity", font: { color: Theme.colors.primary.main }, padding: { top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }, border: { width: 1, style: 'solid', color: Theme.colors.primary.main }, background: { color: Theme.colors.primary.contrastText }, onClick: this.handleClickAdd.bind(this) }),
                        this.$render("i-button", { id: "btnRemove", caption: "Remove Liquidity", font: { color: Theme.colors.primary.main }, padding: { top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }, border: { width: 1, style: 'solid', color: Theme.colors.primary.main }, background: { color: Theme.colors.primary.contrastText }, onClick: this.handleClickRemove.bind(this) }))),
                this.$render("i-label", { caption: "Select a Pair" }),
                this.$render("i-hstack", { horizontalAlignment: "center", verticalAlignment: "center", wrap: "wrap", gap: 10 },
                    this.$render("i-scom-token-input", { id: "tokenInInput", type: "combobox", isBalanceShown: false, isBtnMaxShown: false, isInputShown: false, border: { radius: 12 }, onSelectToken: this.handleSelectToken.bind(this) }),
                    this.$render("i-label", { caption: "to", font: { size: "1rem" } }),
                    this.$render("i-scom-token-input", { id: "tokenOutInput", type: "combobox", isBalanceShown: false, isBtnMaxShown: false, isInputShown: false, border: { radius: 12 }, onSelectToken: this.handleSelectToken.bind(this) })),
                this.$render("i-vstack", { id: "pnlAdditional", gap: "1rem", visible: false },
                    this.$render("i-label", { caption: "Select Offer Index" }),
                    this.$render("i-hstack", { width: "50%", verticalAlignment: "center" },
                        this.$render("i-combo-box", { id: "comboOfferIndex", height: 43, items: [] }))),
                this.$render("i-hstack", { horizontalAlignment: "center" },
                    this.$render("i-button", { id: "btnStart", caption: "Start", padding: { top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }, font: { color: Theme.colors.primary.contrastText, size: '1.5rem' }, onClick: this.handleClickStart.bind(this) })),
                this.$render("i-scom-wallet-modal", { id: "mdWallet", wallets: [] })));
        }
        async handleFlowStage(target, stage, options) {
            let widget = this;
            if (!options.isWidgetConnected) {
                let properties = options.properties;
                let tokenRequirements = options.tokenRequirements;
                this.state.handleNextFlowStep = options.onNextStep;
                this.state.handleAddTransactions = options.onAddTransactions;
                this.state.handleJumpToStep = options.onJumpToStep;
                this.state.handleUpdateStepStatus = options.onUpdateStepStatus;
                await widget.setData({
                    executionProperties: properties,
                    tokenRequirements
                });
            }
            return { widget };
        }
    };
    ScomLiquidityProviderFlowInitialSetup = __decorate([
        (0, components_14.customElements)('i-scom-liquidity-provider-flow-initial-setup')
    ], ScomLiquidityProviderFlowInitialSetup);
    exports.default = ScomLiquidityProviderFlowInitialSetup;
});
define("@scom/scom-liquidity-provider", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet", "@scom/scom-liquidity-provider/assets.ts", "@scom/scom-liquidity-provider/store/index.ts", "@scom/scom-token-list", "@scom/scom-liquidity-provider/data.json.ts", "@scom/scom-liquidity-provider/index.css.ts", "@scom/scom-liquidity-provider/formSchema.ts", "@scom/scom-liquidity-provider/liquidity-utils/index.ts", "@scom/scom-liquidity-provider/global/index.ts", "@scom/scom-liquidity-provider/flow/initialSetup.tsx"], function (require, exports, components_15, eth_wallet_11, assets_5, index_12, scom_token_list_7, data_json_1, index_css_1, formSchema_1, index_13, index_14, initialSetup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Theme = components_15.Styles.Theme.ThemeVars;
    let ScomLiquidityProvider = class ScomLiquidityProvider extends components_15.Module {
        _getActions(category) {
            const actions = [];
            if (category && category !== 'offers') {
                actions.push({
                    name: 'Edit',
                    icon: 'edit',
                    command: (builder, userInputData) => {
                        let oldData = {
                            chainId: 0,
                            tokenIn: '',
                            tokenOut: '',
                            wallets: [],
                            networks: []
                        };
                        let oldTag = {};
                        return {
                            execute: async () => {
                                oldData = JSON.parse(JSON.stringify(this._data));
                                const { chainId, tokenIn, tokenOut, isCreate, offerIndex, ...themeSettings } = userInputData;
                                const generalSettings = {
                                    chainId,
                                    tokenIn,
                                    tokenOut,
                                    offerIndex
                                };
                                if (generalSettings.chainId !== undefined)
                                    this._data.chainId = generalSettings.chainId;
                                if (generalSettings.tokenIn !== undefined)
                                    this._data.tokenIn = generalSettings.tokenIn;
                                if (generalSettings.tokenOut !== undefined)
                                    this._data.tokenOut = generalSettings.tokenOut;
                                if (isCreate) {
                                    this._data.offerIndex = 0;
                                }
                                else {
                                    this._data.offerIndex = generalSettings.offerIndex || 0;
                                }
                                if (!this._data.offerIndex) {
                                    this.actionType = index_13.Action.CREATE;
                                }
                                await this.resetRpcWallet();
                                this.refreshUI();
                                if (builder?.setData)
                                    builder.setData(this._data);
                                oldTag = JSON.parse(JSON.stringify(this.tag));
                                if (builder)
                                    builder.setTag(themeSettings);
                                else
                                    this.setTag(themeSettings);
                                if (this.dappContainer)
                                    this.dappContainer.setTag(themeSettings);
                            },
                            undo: async () => {
                                this._data = JSON.parse(JSON.stringify(oldData));
                                this.refreshUI();
                                if (builder?.setData)
                                    builder.setData(this._data);
                                this.tag = JSON.parse(JSON.stringify(oldTag));
                                if (builder)
                                    builder.setTag(this.tag);
                                else
                                    this.setTag(this.tag);
                                if (this.dappContainer)
                                    this.dappContainer.setTag(userInputData);
                            },
                            redo: () => { }
                        };
                    },
                    userInputDataSchema: formSchema_1.default.dataSchema,
                    userInputUISchema: formSchema_1.default.uiSchema,
                    customControls: formSchema_1.default.customControls(this.state)
                });
            }
            return actions;
        }
        getProjectOwnerActions() {
            const formSchema = (0, formSchema_1.getProjectOwnerSchema)();
            const actions = [
                {
                    name: 'Settings',
                    userInputDataSchema: formSchema.dataSchema,
                    userInputUISchema: formSchema.uiSchema,
                    customControls: formSchema.customControls(this.state)
                }
            ];
            return actions;
        }
        getConfigurators() {
            return [
                {
                    name: 'Project Owner Configurator',
                    target: 'Project Owners',
                    getProxySelectors: async (chainId) => {
                        return [];
                    },
                    getActions: () => {
                        return this.getProjectOwnerActions();
                    },
                    getData: this.getData.bind(this),
                    setData: async (data) => {
                        await this.setData(data);
                    },
                    getTag: this.getTag.bind(this),
                    setTag: this.setTag.bind(this)
                },
                {
                    name: 'Builder Configurator',
                    target: 'Builders',
                    getActions: (category) => {
                        return this._getActions(category);
                    },
                    getData: this.getData.bind(this),
                    setData: async (data) => {
                        const defaultData = data_json_1.default.defaultBuilderData;
                        await this.setData({ ...defaultData, ...data });
                    },
                    getTag: this.getTag.bind(this),
                    setTag: this.setTag.bind(this)
                },
                {
                    name: 'Embedder Configurator',
                    target: 'Embedders',
                    getData: async () => {
                        return { ...this._data };
                    },
                    setData: async (properties, linkParams) => {
                        const { isCreate, ...resultingData } = properties;
                        if (isCreate) {
                            this._data.offerIndex = 0;
                        }
                        if (!this._data.offerIndex) {
                            this.actionType = index_13.Action.CREATE;
                        }
                        await this.setData(resultingData);
                    },
                    getTag: this.getTag.bind(this),
                    setTag: this.setTag.bind(this)
                }
            ];
        }
        async getData() {
            return this._data;
        }
        async resetRpcWallet() {
            this.removeRpcWalletEvents();
            const rpcWalletId = await this.state.initRpcWallet(this.chainId);
            const rpcWallet = this.rpcWallet;
            const chainChangedEvent = rpcWallet.registerWalletEvent(this, eth_wallet_11.Constants.RpcWalletEvent.ChainChanged, async (chainId) => {
                this.onChainChanged();
            });
            const connectedEvent = rpcWallet.registerWalletEvent(this, eth_wallet_11.Constants.RpcWalletEvent.Connected, async (connected) => {
                this.initializeWidgetConfig();
            });
            this.rpcWalletEvents.push(chainChangedEvent, connectedEvent);
            const data = {
                defaultChainId: this.chainId,
                wallets: this.wallets,
                networks: this.networks,
                showHeader: this.showHeader,
                rpcWalletId: rpcWallet.instanceId
            };
            if (this.dappContainer?.setData)
                this.dappContainer.setData(data);
        }
        async setData(value) {
            this._data = value;
            await this.resetRpcWallet();
            this.initializeWidgetConfig();
        }
        async getTag() {
            return this.tag;
        }
        updateTag(type, value) {
            this.tag[type] = this.tag[type] ?? {};
            for (let prop in value) {
                if (value.hasOwnProperty(prop))
                    this.tag[type][prop] = value[prop];
            }
        }
        async setTag(value) {
            const newValue = value || {};
            for (let prop in newValue) {
                if (newValue.hasOwnProperty(prop)) {
                    if (prop === 'light' || prop === 'dark')
                        this.updateTag(prop, newValue[prop]);
                    else
                        this.tag[prop] = newValue[prop];
                }
            }
            if (this.dappContainer)
                this.dappContainer.setTag(this.tag);
            this.updateTheme();
        }
        updateStyle(name, value) {
            value ?
                this.style.setProperty(name, value) :
                this.style.removeProperty(name);
        }
        updateTheme() {
            const themeVar = this.dappContainer?.theme || 'light';
            this.updateStyle('--text-primary', this.tag[themeVar]?.fontColor);
            this.updateStyle('--background-main', this.tag[themeVar]?.backgroundColor);
            this.updateStyle('--colors-secondary-main', this.tag[themeVar]?.secondaryColor);
            this.updateStyle('--colors-secondary-contrast_text', this.tag[themeVar]?.secondaryFontColor);
            this.updateStyle('--input-font_color', this.tag[themeVar]?.inputFontColor);
            this.updateStyle('--input-background', this.tag[themeVar]?.inputBackgroundColor);
        }
        get wallets() {
            return this._data.wallets ?? [];
        }
        set wallets(value) {
            this._data.wallets = value;
        }
        get networks() {
            return this._data.networks ?? [];
        }
        set networks(value) {
            this._data.networks = value;
        }
        get showHeader() {
            return this._data.showHeader ?? true;
        }
        set showHeader(value) {
            this._data.showHeader = value;
        }
        get chainId() {
            return this._data.chainId;
        }
        get rpcWallet() {
            return this.state.getRpcWallet();
        }
        get fromTokenAddress() {
            const address = this._data.tokenIn || '';
            return address.startsWith('0x') ? address.toLowerCase() : address;
        }
        get toTokenAddress() {
            const address = this._data.tokenOut || '';
            return address.startsWith('0x') ? address.toLowerCase() : address;
        }
        get offerIndex() {
            return this._data.offerIndex || 0;
        }
        get fromTokenObject() {
            return this.state.getTokenMapByChainId(this.state.getChainId())[this.fromTokenAddress];
        }
        get toTokenObject() {
            return this.state.getTokenMapByChainId(this.state.getChainId())[this.toTokenAddress];
        }
        constructor(parent, options) {
            super(parent, options);
            this.tag = {};
            this.defaultEdit = true;
            this.actionType = 0;
            this.pairAddress = '';
            this.liquidities = [];
            this.rpcWalletEvents = [];
            this.onChainChanged = async () => {
                this.initializeWidgetConfig();
            };
            this.refreshUI = () => {
                this.initializeWidgetConfig();
            };
            this.initializeWidgetConfig = (hideLoading) => {
                setTimeout(async () => {
                    if (!hideLoading && this.loadingElm) {
                        this.loadingElm.visible = true;
                    }
                    if (!(0, index_12.isClientWalletConnected)() || !this._data || !this.checkValidation()) {
                        await this.renderHome();
                        return;
                    }
                    await this.initWallet();
                    this.state.setCustomTokens(this._data.customTokens);
                    const chainId = this.state.getChainId();
                    const tokenA = this.fromTokenAddress.startsWith('0x') ? this.fromTokenAddress : scom_token_list_7.WETHByChainId[chainId].address || this.fromTokenAddress;
                    const tokenB = this.toTokenAddress.startsWith('0x') ? this.toTokenAddress : scom_token_list_7.WETHByChainId[chainId].address || this.toTokenAddress;
                    const isRegistered = await (0, index_13.isPairRegistered)(this.state, tokenA, tokenB);
                    if (!isRegistered) {
                        await this.renderHome(undefined, 'Pair is not registered, please register the pair first!');
                        return;
                    }
                    scom_token_list_7.tokenStore.updateTokenMapData(chainId);
                    const rpcWallet = this.rpcWallet;
                    if (rpcWallet.address) {
                        await scom_token_list_7.tokenStore.updateTokenBalancesByChainId(chainId);
                    }
                    this.pairAddress = await (0, index_13.getPair)(this.state, this.fromTokenObject, this.toTokenObject);
                    if (this.offerIndex) {
                        const offerIndexes = await (0, index_13.getOfferIndexes)(this.state, this.pairAddress, this.fromTokenAddress, this.toTokenAddress);
                        if (offerIndexes.some(v => v.eq(this.offerIndex))) {
                            if (this._data.action === 'add') {
                                this.handleAdd();
                            }
                            else if (this._data.action === 'remove') {
                                this.handleRemove();
                            }
                            else {
                                await this.renderHome(this.pairAddress);
                            }
                        }
                        else {
                            await this.renderForm();
                        }
                    }
                    else {
                        await this.renderForm();
                    }
                    if (!hideLoading && this.loadingElm) {
                        this.loadingElm.visible = false;
                    }
                });
            };
            this.fetchData = async () => {
                try {
                    await this.modelState.fetchData();
                    this.detailSummary.fromTokenAddress = this.fromTokenAddress;
                    this.detailSummary.actionType = this.actionType;
                    this.detailSummary.summaryData = this.modelState.summaryData();
                }
                catch (err) {
                    console.log(err);
                }
            };
            this.renderForm = async () => {
                this.model = new index_13.Model(this.state, this.pairAddress, this.fromTokenAddress, this.offerIndex, this.actionType);
                this.model.onBack = () => this.onBack();
                this.model.onShowTxStatus = (status, content) => {
                    this.showMessage(status, content);
                };
                this.model.onSubmitBtnStatus = (isLoading, isApproval, offerIndex) => {
                    this.detailForm.onSubmitBtnStatus(isLoading, isApproval);
                    this.hStackActions.enabled = !isLoading;
                    this.hStackSettings.visible = false;
                    if (offerIndex) {
                        this.loadingElm.visible = true;
                        this._data.offerIndex = offerIndex;
                        this.renderHome(this.pairAddress);
                    }
                };
                this.modelState = this.model.getState();
                this.detailForm.state = this.state;
                this.detailSummary.state = this.state;
                this.detailSummary.fetchData = this.fetchData.bind(this);
                this.detailForm.updateHelpContent = () => {
                    this.detailHelp.adviceTexts = this.modelState.adviceTexts();
                };
                this.detailForm.updateSummary = async () => {
                    await this.modelState.setSummaryData(true);
                    this.detailSummary.summaryData = this.modelState.summaryData();
                };
                this.detailForm.onFieldChanged = (stage) => {
                    this.detailSummary.updateSummaryUI(stage);
                };
                this.detailForm.onFocusChanged = (stage) => {
                    this.detailSummary.onHighlight(stage);
                };
                this.detailHelp.adviceTexts = this.modelState.adviceTexts();
                this.detailForm.isFlow = this._data.isFlow ?? false;
                try {
                    await this.modelState.fetchData();
                    this.detailSummary.fromTokenAddress = this.fromTokenAddress;
                    this.detailSummary.actionType = this.actionType;
                    this.detailSummary.summaryData = this.modelState.summaryData();
                    this.panelHome.visible = false;
                    this.panelLiquidity.visible = true;
                    this.hStackBack.visible = this.actionType === index_13.Action.ADD || this.actionType === index_13.Action.REMOVE;
                }
                catch (err) {
                    this.lbMsg.caption = 'Cannot fetch data!';
                    this.lbMsg.visible = true;
                    this.panelHome.visible = true;
                    this.panelLiquidity.visible = false;
                }
                this.detailForm.actionType = this.actionType;
                this.detailForm.model = this.modelState;
            };
            this.connectWallet = async () => {
                if (!(0, index_12.isClientWalletConnected)()) {
                    if (this.mdWallet) {
                        await components_15.application.loadPackage('@scom/scom-wallet-modal', '*');
                        this.mdWallet.networks = this.networks;
                        this.mdWallet.wallets = this.wallets;
                        this.mdWallet.showModal();
                    }
                    return;
                }
                if (!this.state.isRpcWalletConnected()) {
                    const chainId = this.state.getChainId();
                    const clientWallet = eth_wallet_11.Wallet.getClientInstance();
                    await clientWallet.switchNetwork(chainId);
                }
            };
            this.renderHome = async (pairAddress, msg) => {
                const walletConnected = (0, index_12.isClientWalletConnected)();
                const isRpcWalletConnected = this.state.isRpcWalletConnected();
                this.renderQueueItem(pairAddress);
                if (pairAddress) {
                    this.panelHome.background.color = "hsla(0,0%,100%,0.10196078431372549)";
                    this.lbMsg.visible = false;
                    this.hStackActions.visible = true;
                    const info = await (0, index_13.getPairInfo)(this.state, pairAddress, this.fromTokenAddress, this.offerIndex);
                    const { startDate, expire, locked } = info;
                    const expired = (0, components_15.moment)(Date.now()).isAfter(expire);
                    this.btnAdd.visible = !expired;
                    this.btnAdd.enabled = isRpcWalletConnected;
                    this.btnRemove.enabled = isRpcWalletConnected && !(locked && !(0, components_15.moment)(startDate).isSameOrBefore());
                    this.btnLock.enabled = isRpcWalletConnected && !locked;
                    this.btnLock.caption = locked ? 'Locked' : 'Lock';
                }
                else {
                    this.panelHome.background.color = "";
                    this.hStackActions.visible = false;
                    this.lbMsg.caption = msg ?? (!walletConnected ? 'Please connect with your wallet' : 'Invalid configurator data');
                    this.lbMsg.visible = true;
                }
                this.hStackSettings.visible = isRpcWalletConnected;
                this.btnSetting.visible = isRpcWalletConnected && !this._data.isFlow;
                this.btnRefresh.visible = isRpcWalletConnected && !pairAddress;
                this.btnWallet.visible = !walletConnected || !isRpcWalletConnected;
                this.btnWallet.caption = !walletConnected ? 'Connect Wallet' : 'Switch Wallet';
                this.panelHome.visible = true;
                this.panelLiquidity.visible = false;
                if (this.loadingElm) {
                    this.loadingElm.visible = false;
                }
            };
            this.onBack = () => {
                this.panelLiquidity.visible = false;
                this.panelHome.visible = true;
            };
            this.onActions = async () => {
                if (this.actionType === index_13.Action.LOCK) {
                    this.showLockModal();
                }
                else {
                    if (this.loadingElm)
                        this.loadingElm.visible = true;
                    await this.renderForm();
                    if (this.loadingElm)
                        this.loadingElm.visible = false;
                }
            };
            this.showLockModal = () => {
                const chainId = this.state.getChainId();
                const fromToken = this.fromTokenObject;
                const toToken = this.toTokenObject;
                this.firstCheckbox.value = false;
                this.secondCheckbox.value = false;
                this.firstCheckbox.checked = false;
                this.secondCheckbox.checked = false;
                this.lockOrderBtn.enabled = false;
                this.lockModalTitle.clearInnerHTML();
                this.lockModalTitle.appendChild(this.$render("i-hstack", { gap: 4, verticalAlignment: "center" },
                    this.$render("i-image", { width: 28, height: 28, url: fromToken?.logoURI || scom_token_list_7.assets.tokenPath(fromToken, chainId), fallbackUrl: index_12.fallbackUrl }),
                    this.$render("i-image", { width: 28, height: 28, url: toToken?.logoURI || scom_token_list_7.assets.tokenPath(toToken, chainId), fallbackUrl: index_12.fallbackUrl }),
                    this.$render("i-label", { caption: this.state.tokenSymbol(chainId, this.fromTokenAddress), font: { size: '24px', bold: true, color: Theme.colors.primary.main } }),
                    this.$render("i-icon", { name: "arrow-right", fill: Theme.colors.primary.main, width: "14", height: "14" }),
                    this.$render("i-label", { class: "hightlight-yellow", caption: this.state.tokenSymbol(chainId, this.toTokenAddress), font: { size: '24px', bold: true, color: Theme.colors.primary.main } }),
                    this.$render("i-label", { class: "hightlight-yellow", caption: `#${this.offerIndex}`, font: { size: '24px', bold: true, color: Theme.colors.primary.main } })));
                this.lockModal.visible = true;
            };
            this.closeLockModal = () => {
                this.lockModal.visible = false;
            };
            this.onConfirmLock = async () => {
                this.showMessage('warning', 'Confirming');
                const callback = async (err, receipt) => {
                    if (err) {
                        this.showMessage('error', err);
                    }
                    else if (receipt) {
                        this.closeLockModal();
                        this.showMessage('success', receipt);
                        this.btnLock.enabled = false;
                        this.btnLock.rightIcon.visible = true;
                        this.btnLock.caption = 'Locking';
                        this.btnRemove.enabled = false;
                    }
                };
                const fromToken = this.fromTokenObject;
                const toToken = this.toTokenObject;
                const chainId = this.state.getChainId();
                const confirmationCallback = async (receipt) => {
                    if (this.state.handleAddTransactions) {
                        const timestamp = await this.state.getRpcWallet().getBlockTimestamp(receipt.blockNumber.toString());
                        const transactionsInfoArr = [
                            {
                                desc: `Lock Order ${fromToken.symbol}/${toToken.symbol} #${this.offerIndex}`,
                                chainId: chainId,
                                fromToken: null,
                                toToken: null,
                                fromTokenAmount: '',
                                toTokenAmount: '',
                                hash: receipt.transactionHash,
                                timestamp
                            }
                        ];
                        this.state.handleAddTransactions({
                            list: transactionsInfoArr
                        });
                    }
                    this.btnLock.rightIcon.visible = false;
                    this.btnLock.caption = 'Locked';
                    (0, index_14.registerSendTxEvents)({});
                };
                (0, index_14.registerSendTxEvents)({
                    transactionHash: callback,
                    confirmation: confirmationCallback
                });
                (0, index_13.lockGroupQueueOffer)(chainId, this.pairAddress, fromToken, toToken, this.offerIndex);
            };
            this.initWallet = async () => {
                try {
                    await eth_wallet_11.Wallet.getClientInstance().init();
                    const rpcWallet = this.rpcWallet;
                    await rpcWallet.init();
                }
                catch (err) {
                    console.log(err);
                }
            };
            this.showMessage = (status, content) => {
                if (!this.txStatusModal)
                    return;
                let params = { status };
                if (status === 'success') {
                    params.txtHash = content;
                }
                else {
                    params.content = content;
                }
                this.txStatusModal.message = { ...params };
                this.txStatusModal.showModal();
            };
            this.checkValidation = () => {
                if (!this._data)
                    return false;
                const { chainId, tokenIn, tokenOut } = this._data;
                if (!chainId || !tokenIn || !tokenOut)
                    return false;
                return true;
            };
            this.state = new index_12.State(data_json_1.default);
        }
        removeRpcWalletEvents() {
            const rpcWallet = this.rpcWallet;
            for (let event of this.rpcWalletEvents) {
                rpcWallet.unregisterWalletEvent(event);
            }
            this.rpcWalletEvents = [];
        }
        onHide() {
            this.dappContainer.onHide();
            this.removeRpcWalletEvents();
        }
        onViewContract(address) {
            const chainId = this.state.getChainId();
            (0, index_12.viewOnExplorerByAddress)(chainId, address);
        }
        async renderQueueItem(pairAddress) {
            this.pnlQueueItem.clearInnerHTML();
            try {
                if (pairAddress) {
                    const chainId = this.state.getChainId();
                    const fromToken = this.fromTokenObject;
                    const fromTokenSymbol = this.state.tokenSymbol(chainId, this.fromTokenAddress);
                    const toToken = this.toTokenObject;
                    const toTokenSymbol = this.state.tokenSymbol(chainId, this.toTokenAddress);
                    const info = await (0, index_13.getGroupQueueInfo)(this.state, pairAddress, fromToken, toToken, this.offerIndex);
                    const amount = `${components_15.FormatUtils.formatNumber(info.amount, { decimalFigures: 4, minValue: 0.0001 })} ${fromTokenSymbol}`;
                    const offerPrice = `1 ${fromTokenSymbol} = ${components_15.FormatUtils.formatNumber(info.offerPrice, { decimalFigures: 4, minValue: 0.0001 })} ${toTokenSymbol}`;
                    const startDate = (0, index_14.formatDate)(info.startDate, index_14.DefaultDateTimeFormat, true);
                    const endDate = (0, index_14.formatDate)(info.endDate, index_14.DefaultDateTimeFormat, true);
                    const whitelistedAddress = info.allowAll ? 'Everyone' : `${info.addresses.length} Address${info.addresses.length > 1 ? "es" : ""}`;
                    const totalAllocation = `${info.allowAll ? info.amount : info.allocation} ${fromTokenSymbol}`;
                    const youWillGet = `${info.willGet} ${toTokenSymbol}`;
                    this.pnlQueueItem.appendChild(this.$render("i-vstack", { horizontalAlignment: "center", verticalAlignment: "center", padding: { bottom: '0.5rem' } },
                        this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", padding: { bottom: 10 }, border: { bottom: { width: 2, style: 'solid', color: Theme.divider } } },
                            this.$render("i-hstack", { verticalAlignment: "center" },
                                this.$render("i-hstack", { verticalAlignment: "center", class: "pointer", onClick: () => this.onViewContract(pairAddress) },
                                    this.$render("i-label", { font: { size: '20px', bold: true }, caption: fromTokenSymbol, margin: { right: 4 } }),
                                    this.$render("i-icon", { name: "arrow-right", fill: "#fff", width: "14", height: "14", margin: { right: 4 } }),
                                    this.$render("i-label", { font: { size: '20px', bold: true }, caption: toTokenSymbol, margin: { right: 4 } })),
                                this.$render("i-hstack", { verticalAlignment: "center" },
                                    this.$render("i-label", { font: { size: '20px', bold: true }, caption: `#${this.offerIndex}`, margin: { right: 4 } }),
                                    this.$render("i-icon", { name: "question-circle", fill: "#fff", width: "18", height: "18", tooltip: { content: 'The offer index helps identifying your group queues.' } }))),
                            this.$render("i-hstack", { horizontalAlignment: "end", verticalAlignment: "center" },
                                this.$render("i-image", { class: "icon-left", width: 35, height: 35, position: "initial", url: fromToken?.logoURI || scom_token_list_7.assets.tokenPath(fromToken, chainId), fallbackUrl: index_12.fallbackUrl }),
                                this.$render("i-image", { width: 50, height: 50, position: "initial", url: toToken?.logoURI || scom_token_list_7.assets.tokenPath(toToken, chainId), fallbackUrl: index_12.fallbackUrl }))),
                        this.$render("i-vstack", { width: "100%", margin: { top: '1rem' }, horizontalAlignment: "center", verticalAlignment: "center", gap: "1rem" },
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", gap: "4" },
                                this.$render("i-label", { caption: "Amount" }),
                                this.$render("i-label", { caption: amount, tooltip: { content: amount, maxWidth: '220px' }, font: { bold: true } })),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", gap: "4" },
                                this.$render("i-label", { caption: "Offer Price" }),
                                this.$render("i-label", { caption: offerPrice, tooltip: { content: offerPrice, maxWidth: '220px' }, font: { bold: true } })),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", gap: "4" },
                                this.$render("i-label", { caption: "Start Date" }),
                                this.$render("i-label", { caption: startDate, font: { bold: true } })),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", gap: "4" },
                                this.$render("i-label", { caption: "End Date" }),
                                this.$render("i-label", { caption: endDate, font: { bold: true } })),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", gap: "4" },
                                this.$render("i-label", { caption: "Status" }),
                                this.$render("i-label", { caption: info.state, font: { bold: true } })),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", gap: "4" },
                                this.$render("i-label", { caption: `Whitelisted Address${info.addresses.length > 1 ? "es" : ""}` }),
                                this.$render("i-label", { caption: whitelistedAddress, font: { bold: true } })),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", gap: "4" },
                                this.$render("i-label", { caption: "Total Allocation" }),
                                this.$render("i-label", { caption: totalAllocation, tooltip: { content: totalAllocation, maxWidth: '220px' }, font: { bold: true } })),
                            this.$render("i-hstack", { width: "100%", horizontalAlignment: "space-between", verticalAlignment: "center", gap: "4" },
                                this.$render("i-label", { caption: "You will get" }),
                                this.$render("i-label", { caption: youWillGet, tooltip: { content: youWillGet, maxWidth: '220px' }, font: { bold: true } })))));
                }
                else {
                    this.pnlQueueItem.appendChild(this.$render("i-hstack", { horizontalAlignment: "center" },
                        this.$render("i-image", { url: assets_5.default.fullPath('img/TrollTrooper.svg') })));
                }
            }
            catch (err) {
                this.pnlQueueItem.appendChild(this.$render("i-hstack", { horizontalAlignment: "center" },
                    this.$render("i-image", { url: assets_5.default.fullPath('img/TrollTrooper.svg') })));
            }
        }
        handleAdd() {
            this.actionType = index_13.Action.ADD;
            this.onActions();
        }
        handleRemove() {
            this.actionType = index_13.Action.REMOVE;
            this.onActions();
        }
        handleLock() {
            this.actionType = index_13.Action.LOCK;
            this.onActions();
        }
        onChangeFirstChecked(source, event) {
            this.firstCheckbox.checked = source.checked;
            this.lockOrderBtn.enabled = source.checked && this.secondCheckbox.checked;
        }
        onChangeSecondChecked(source, event) {
            this.secondCheckbox.checked = source.checked;
            this.lockOrderBtn.enabled = this.firstCheckbox.checked && source.checked;
        }
        async init() {
            this.isReadyCallbackQueued = true;
            super.init();
            this.lockModal.onClose = () => {
                this.firstCheckbox.checked = false;
                this.secondCheckbox.checked = false;
                this.lockOrderBtn.enabled = false;
            };
            const lazyLoad = this.getAttribute('lazyLoad', true, false);
            if (!lazyLoad) {
                const chainId = this.getAttribute('chainId', true);
                const tokenIn = this.getAttribute('tokenIn', true);
                const tokenOut = this.getAttribute('tokenOut', true);
                const offerIndex = this.getAttribute('offerIndex', true, 0);
                const wallets = this.getAttribute('wallets', true, []);
                const networks = this.getAttribute('networks', true, []);
                const showHeader = this.getAttribute('showHeader', true, true);
                await this.setData({ chainId, tokenIn, tokenOut, offerIndex, wallets, networks, showHeader });
            }
            this.isReadyCallbackQueued = false;
            this.executeReadyCallback();
        }
        async handleConfirmClick() {
            const data = await this.form.getFormData();
            this._data.chainId = data.chainId;
            this._data.tokenIn = data.tokenIn;
            this._data.tokenOut = data.tokenOut;
            if (data.isCreate) {
                this._data.offerIndex = 0;
            }
            else {
                this._data.offerIndex = data.offerIndex || 0;
            }
            if (!data.offerIndex) {
                this.actionType = index_13.Action.CREATE;
            }
            this.mdSettings.visible = false;
            this.refreshUI();
        }
        onCogClick() {
            if (!this.form.jsonSchema) {
                const formSchema = (0, formSchema_1.getFormSchema)();
                this.form.jsonSchema = formSchema.dataSchema;
                this.form.uiSchema = formSchema.uiSchema;
                this.form.formOptions = {
                    columnWidth: "100%",
                    confirmButtonOptions: {
                        caption: 'Confirm',
                        onClick: this.handleConfirmClick.bind(this)
                    },
                    dateTimeFormat: {
                        date: 'DD/MM/YYYY',
                        time: 'HH:mm',
                        dateTime: 'YYYY-MM-DD HH:mm:ss'
                    },
                    customControls: formSchema.customControls(this.state)
                };
                this.form.renderForm();
            }
            this.form.clearFormData();
            this.form.setFormData({
                chainId: this._data.chainId || this.state.getChainId(),
                tokenIn: this._data.tokenIn,
                tokenOut: this._data.tokenOut,
                isCreate: !this._data.offerIndex,
                offerIndex: this._data.offerIndex
            });
            this.mdSettings.visible = true;
        }
        render() {
            return (this.$render("i-scom-dapp-container", { id: "dappContainer", class: index_css_1.liquidityProviderContainer },
                this.$render("i-panel", { class: index_css_1.liquidityProviderComponent, minHeight: 200 },
                    this.$render("i-panel", { class: index_css_1.liquidityProviderForm },
                        this.$render("i-panel", { id: "queue-container" },
                            this.$render("i-panel", null,
                                this.$render("i-vstack", { id: "loadingElm", class: "i-loading-overlay" },
                                    this.$render("i-vstack", { class: "i-loading-spinner", horizontalAlignment: "center", verticalAlignment: "center" },
                                        this.$render("i-icon", { class: "i-loading-spinner_icon", image: { url: assets_5.default.fullPath('img/loading.svg'), width: 36, height: 36 } }),
                                        this.$render("i-label", { caption: "Loading...", font: { color: '#FD4A4C', size: '1.5em' }, class: "i-loading-spinner_text" }))),
                                this.$render("i-panel", { id: "panelHome", padding: { top: "1rem", bottom: "1rem", left: "1rem", right: "1rem" }, border: { radius: '1em' }, visible: false },
                                    this.$render("i-vstack", { verticalAlignment: "center", alignItems: "center" },
                                        this.$render("i-panel", { id: "pnlQueueItem", width: "100%" },
                                            this.$render("i-hstack", { horizontalAlignment: "center" },
                                                this.$render("i-image", { url: assets_5.default.fullPath('img/TrollTrooper.svg') }))),
                                        this.$render("i-label", { id: "lbMsg", margin: { top: 10 } }),
                                        this.$render("i-hstack", { id: "hStackActions", gap: 10, margin: { top: 10 }, verticalAlignment: "center", horizontalAlignment: "center", wrap: "wrap" },
                                            this.$render("i-button", { id: "btnAdd", caption: "Add", class: "btn-os", minHeight: 36, width: 120, rightIcon: { spin: true, visible: false }, onClick: this.handleAdd.bind(this) }),
                                            this.$render("i-button", { id: "btnRemove", caption: "Remove", class: "btn-os", minHeight: 36, width: 120, rightIcon: { spin: true, visible: false }, onClick: this.handleRemove.bind(this) }),
                                            this.$render("i-button", { id: "btnLock", caption: "Lock", class: "btn-os", minHeight: 36, width: 120, rightIcon: { spin: true, visible: false }, onClick: this.handleLock.bind(this) })),
                                        this.$render("i-hstack", { id: "hStackSettings", gap: 10, margin: { top: 10 }, verticalAlignment: "center", horizontalAlignment: "center", wrap: "wrap" },
                                            this.$render("i-button", { id: "btnSetting", class: "btn-os", minHeight: 36, width: 240, maxWidth: "90%", caption: "Update Settings", visible: false, onClick: this.onCogClick.bind(this) }),
                                            this.$render("i-button", { id: "btnRefresh", class: "btn-os", minHeight: 36, width: 36, icon: { name: 'sync', width: 18, height: 18, fill: '#fff' }, visible: false, onClick: this.refreshUI.bind(this) })),
                                        this.$render("i-button", { id: "btnWallet", caption: "Connect Wallet", visible: false, class: "btn-os", minHeight: 36, maxWidth: "90%", width: 240, margin: { top: 10 }, onClick: this.connectWallet }))),
                                this.$render("i-panel", { id: "panelLiquidity" },
                                    this.$render("i-hstack", { id: "hStackBack", margin: { bottom: 10 }, gap: 4, verticalAlignment: "center", width: "fit-content", class: "pointer", onClick: this.onBack },
                                        this.$render("i-icon", { name: "arrow-left", fill: Theme.colors.primary.main, width: 20, height: 20 }),
                                        this.$render("i-label", { caption: "Back", font: { bold: true, color: Theme.colors.primary.main, size: '20px' }, lineHeight: "18px" })),
                                    this.$render("i-hstack", { gap: "20px", margin: { bottom: 16 }, wrap: "wrap" },
                                        this.$render("i-panel", { class: "custom-container" },
                                            this.$render("liquidity-form", { id: "detailForm", onCogClick: this.onCogClick.bind(this) })),
                                        this.$render("i-panel", { class: "custom-container" },
                                            this.$render("i-panel", { id: "summarySection" },
                                                this.$render("liquidity-summary", { id: "detailSummary" })),
                                            this.$render("liquidity-help", { id: "detailHelp" }))))))),
                    this.$render("i-modal", { id: "lockModal", class: "bg-modal", title: "Lock the order", closeIcon: { name: 'times' } },
                        this.$render("i-panel", { class: "i-modal_content text-center" },
                            this.$render("i-hstack", { id: "lockModalTitle", verticalAlignment: "center", horizontalAlignment: "center", margin: { bottom: 16 } }),
                            this.$render("i-hstack", { verticalAlignment: "center", horizontalAlignment: "center", margin: { bottom: 16 } },
                                this.$render("i-image", { width: 80, height: 80, url: assets_5.default.fullPath('img/warning-icon.png') })),
                            this.$render("i-vstack", { verticalAlignment: "center", padding: { left: 20, right: 20 } },
                                this.$render("i-label", { margin: { bottom: 16 }, caption: "Please confirm the bellow items before you lock the Group Queue" }),
                                this.$render("i-vstack", { verticalAlignment: "center" },
                                    this.$render("i-checkbox", { id: "firstCheckbox", width: "100%", caption: "You understand that you cannot remove any tokens from the offer until the expiry date.", class: "pointer", font: { color: Theme.colors.primary.main }, onChanged: this.onChangeFirstChecked }),
                                    this.$render("i-checkbox", { id: "secondCheckbox", width: "100%", margin: { top: 16 }, caption: "You are aware that you cannot edit the whitelisted addrresses and allocations until the expiry date.", class: "pointer", font: { color: Theme.colors.primary.main }, onChanged: this.onChangeSecondChecked }))),
                            this.$render("i-hstack", { verticalAlignment: "center", horizontalAlignment: "center", gap: "10px", margin: { top: 20, bottom: 10 } },
                                this.$render("i-button", { caption: "Cancel", class: "btn-os btn-cancel", onClick: this.closeLockModal }),
                                this.$render("i-button", { id: "lockOrderBtn", caption: "Lock", enabled: false, class: "btn-os", onClick: this.onConfirmLock })))),
                    this.$render("i-modal", { id: "mdSettings", class: index_css_1.modalStyle, title: "Update Settings", closeIcon: { name: 'times' }, height: 'auto', maxWidth: 640, closeOnBackdropClick: false },
                        this.$render("i-form", { id: "form" })),
                    this.$render("i-scom-wallet-modal", { id: "mdWallet", wallets: [] }),
                    this.$render("i-scom-tx-status-modal", { id: "txStatusModal" }))));
        }
        async handleFlowStage(target, stage, options) {
            let widget;
            if (stage === 'initialSetup') {
                widget = new initialSetup_1.default();
                target.appendChild(widget);
                await widget.ready();
                widget.state = this.state;
                await widget.handleFlowStage(target, stage, options);
            }
            else {
                widget = this;
                if (!options.isWidgetConnected) {
                    target.appendChild(widget);
                    await widget.ready();
                }
                let properties = options.properties;
                let tag = options.tag;
                this.state.handleNextFlowStep = options.onNextStep;
                this.state.handleAddTransactions = options.onAddTransactions;
                this.state.handleJumpToStep = options.onJumpToStep;
                this.state.handleUpdateStepStatus = options.onUpdateStepStatus;
                await this.setData(properties);
                if (tag) {
                    this.setTag(tag);
                }
            }
            return { widget };
        }
    };
    ScomLiquidityProvider = __decorate([
        components_15.customModule,
        (0, components_15.customElements)('i-scom-liquidity-provider')
    ], ScomLiquidityProvider);
    exports.default = ScomLiquidityProvider;
});
