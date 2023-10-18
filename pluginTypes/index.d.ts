/// <reference path="@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@scom/scom-dapp-container/@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@ijstech/eth-contract/index.d.ts" />
/// <amd-module name="@scom/scom-liquidity-provider/assets.ts" />
declare module "@scom/scom-liquidity-provider/assets.ts" {
    function fullPath(path: string): string;
    const _default: {
        fullPath: typeof fullPath;
    };
    export default _default;
}
/// <amd-module name="@scom/scom-liquidity-provider/store/utils.ts" />
declare module "@scom/scom-liquidity-provider/store/utils.ts" {
    import { ERC20ApprovalModel, IERC20ApprovalEventOptions, INetwork } from '@ijstech/eth-wallet';
    export type ProxyAddresses = {
        [key: number]: string;
    };
    export class State {
        slippageTolerance: number;
        transactionDeadline: number;
        networkMap: {
            [key: number]: INetwork;
        };
        infuraId: string;
        proxyAddresses: ProxyAddresses;
        embedderCommissionFee: string;
        rpcWalletId: string;
        approvalModel: ERC20ApprovalModel;
        handleNextFlowStep: (data: any) => Promise<void>;
        handleAddTransactions: (data: any) => Promise<void>;
        handleJumpToStep: (data: any) => Promise<void>;
        constructor(options: any);
        initRpcWallet(chainId: number): string;
        private initData;
        private setNetworkList;
        getProxyAddress(chainId?: number): string;
        getRpcWallet(): import("@ijstech/eth-wallet").IRpcWallet;
        isRpcWalletConnected(): boolean;
        getChainId(): number;
        setApprovalModelAction(options: IERC20ApprovalEventOptions): Promise<import("@ijstech/eth-wallet").IERC20ApprovalAction>;
    }
    export function isClientWalletConnected(): boolean;
}
/// <amd-module name="@scom/scom-liquidity-provider/store/core.ts" />
declare module "@scom/scom-liquidity-provider/store/core.ts" {
    export interface CoreAddress {
        WETH9: string;
        OSWAP_ConfigStore: string;
        OSWAP_RestrictedLiquidityProvider: string;
        OSWAP_RestrictedFactory: string;
    }
    export const coreAddress: {
        [chainId: number]: CoreAddress;
    };
}
/// <amd-module name="@scom/scom-liquidity-provider/store/index.ts" />
declare module "@scom/scom-liquidity-provider/store/index.ts" {
    import { ITokenObject } from '@scom/scom-token-list';
    export const fallbackUrl: string;
    export const getChainNativeToken: (chainId: number) => ITokenObject;
    export const getNetworkInfo: (chainId: number) => any;
    export const viewOnExplorerByAddress: (chainId: number, address: string) => void;
    export const getTokenDecimals: (chainId: number, address: string) => number;
    export const tokenSymbol: (chainId: number, address: string) => string;
    export * from "@scom/scom-liquidity-provider/store/utils.ts";
    export * from "@scom/scom-liquidity-provider/store/core.ts";
}
/// <amd-module name="@scom/scom-liquidity-provider/data.json.ts" />
declare module "@scom/scom-liquidity-provider/data.json.ts" {
    const _default_1: {
        defaultBuilderData: {
            chainId: number;
            tokenIn: string;
            tokenOut: string;
            networks: {
                chainId: number;
            }[];
            wallets: {
                name: string;
            }[];
        };
    };
    export default _default_1;
}
/// <amd-module name="@scom/scom-liquidity-provider/index.css.ts" />
declare module "@scom/scom-liquidity-provider/index.css.ts" {
    export const liquidityProviderContainer: string;
    export const liquidityProviderComponent: string;
    export const liquidityProviderForm: string;
    export const modalStyle: string;
}
/// <amd-module name="@scom/scom-liquidity-provider/global/utils/helper.ts" />
declare module "@scom/scom-liquidity-provider/global/utils/helper.ts" {
    import { BigNumber } from "@ijstech/eth-wallet";
    import { ITokenObject } from "@scom/scom-token-list";
    export type TokenMapType = {
        [token: string]: ITokenObject;
    };
    export interface IBalanceTooltip {
        title?: string;
        value: any;
        symbol?: string;
        icon?: string;
        prefix?: string;
        isWrapped?: boolean | null;
        allowZero?: boolean | null;
    }
    export const DefaultDateTimeFormat = "DD/MM/YYYY HH:mm:ss";
    export const DefaultDateFormat = "DD/MM/YYYY";
    export const formatDate: (date: any, customType?: string, showTimezone?: boolean) => string;
    export const formatNumber: (value: any, decimals?: number) => string;
    export const renderBalanceTooltip: (params: IBalanceTooltip, tokenMap: TokenMapType, isBold?: boolean) => any;
    export const formatNumberValue: (data: IBalanceTooltip, tokenMap: TokenMapType) => any;
    export const isInvalidInput: (val: any) => boolean;
    export const limitInputNumber: (input: any, decimals?: number) => void;
    export const limitDecimals: (value: any, decimals: number) => any;
    export const toWeiInv: (n: string, unit?: number) => BigNumber;
}
/// <amd-module name="@scom/scom-liquidity-provider/global/utils/interfaces.ts" />
declare module "@scom/scom-liquidity-provider/global/utils/interfaces.ts" {
    import { BigNumber } from "@ijstech/eth-contract";
    import { INetworkConfig } from "@scom/scom-network-picker";
    import { IWalletPlugin } from "@scom/scom-wallet-modal";
    export type ActionType = 'create' | 'add' | 'remove';
    export interface ICommissionInfo {
        chainId: number;
        walletAddress: string;
        share: string;
    }
    export interface ILiquidityProvider {
        chainId: number;
        tokenIn?: string;
        tokenOut?: string;
        isCreate?: boolean;
        offerIndex?: number;
        action?: ActionType;
        wallets: IWalletPlugin[];
        networks: INetworkConfig[];
        showHeader?: boolean;
    }
    export interface IAllocation {
        address: string;
        allocation: string | number;
        oldAllocation?: string | number;
        allocationVal?: string | number;
        isOld?: boolean;
        isDuplicated?: boolean;
        invalid?: boolean;
    }
    export interface ProviderGroupQueue {
        pairAddress: string;
        fromTokenAddress: string;
        toTokenAddress: string;
        amount: string;
        offerPrice: string;
        startDate: number;
        endDate: number;
        state: string;
        allowAll: boolean;
        direct: boolean;
        offerIndex: BigNumber;
        addresses: IAllocation[];
        allocation: string;
        willGet: string;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/global/utils/common.ts" />
declare module "@scom/scom-liquidity-provider/global/utils/common.ts" {
    import { ISendTxEventsOptions } from '@ijstech/eth-wallet';
    export const registerSendTxEvents: (sendTxEventHandlers: ISendTxEventsOptions) => void;
}
/// <amd-module name="@scom/scom-liquidity-provider/global/utils/index.ts" />
declare module "@scom/scom-liquidity-provider/global/utils/index.ts" {
    export * from "@scom/scom-liquidity-provider/global/utils/helper.ts";
    export * from "@scom/scom-liquidity-provider/global/utils/interfaces.ts";
    export * from "@scom/scom-liquidity-provider/global/utils/common.ts";
}
/// <amd-module name="@scom/scom-liquidity-provider/global/index.ts" />
declare module "@scom/scom-liquidity-provider/global/index.ts" {
    export * from "@scom/scom-liquidity-provider/global/utils/index.ts";
    export const isAddressValid: (address: string) => Promise<any>;
}
/// <amd-module name="@scom/scom-liquidity-provider/liquidity-utils/API.ts" />
declare module "@scom/scom-liquidity-provider/liquidity-utils/API.ts" {
    import { IAllocation } from "@scom/scom-liquidity-provider/global/index.ts";
    import { BigNumber } from '@ijstech/eth-wallet';
    import { State } from "@scom/scom-liquidity-provider/store/index.ts";
    import { ITokenObject } from '@scom/scom-token-list';
    export function getAddresses(chainId: number): {};
    const getQueueStakeToken: (chainId: number) => ITokenObject | null;
    const getLiquidityProviderAddress: (chainId: number) => any;
    const getPair: (state: State, tokenA: ITokenObject, tokenB: ITokenObject) => Promise<string>;
    const getPairInfo: (state: State, pairAddress: string, tokenAddress: string, offerIndex?: number) => Promise<{
        feePerOrder: string;
        feePerTrader: string;
        maxDur: string;
        pairAddress: string;
        fromTokenAddress: string;
        toTokenAddress: string;
        pairIndex: BigNumber;
    }>;
    function getGroupQueueInfo(state: State, pairAddress: string, token0: ITokenObject, token1: ITokenObject, offerIndex: number): Promise<{
        pairAddress: string;
        fromTokenAddress: string;
        toTokenAddress: string;
        amount: string;
        offerPrice: string;
        startDate: number;
        endDate: number;
        state: string;
        allowAll: boolean;
        direct: boolean;
        offerIndex: number;
        addresses: IAllocation[];
        allocation: string;
        willGet: string;
    }>;
    const getToBeApprovedTokens: (chainId: number, tokenObj: ITokenObject, amount: string, stake: string) => Promise<string[]>;
    const addLiquidity: (chainId: number, tokenA: ITokenObject, tokenB: ITokenObject, tokenIn: ITokenObject, pairIndex: number, offerIndex: number, amountIn: number, allowAll: boolean, restrictedPrice: string, startDate: number, expire: number, deadline: number, whitelistAddress: IAllocation[]) => Promise<any>;
    const removeLiquidity: (chainId: number, tokenA: ITokenObject, tokenB: ITokenObject, tokenOut: ITokenObject, amountOut: string, receivingOut: string, orderIndex: any, deadline: number) => Promise<import("@ijstech/eth-contract").TransactionReceipt>;
    const lockGroupQueueOffer: (chainId: number, pairAddress: string, tokenA: ITokenObject, tokenB: ITokenObject, offerIndex: number | BigNumber) => Promise<import("@ijstech/eth-contract").TransactionReceipt>;
    const convertWhitelistedAddresses: (inputText: string) => IAllocation[];
    function isPairRegistered(state: State, tokenA: string, tokenB: string): Promise<boolean>;
    function getOfferIndexes(state: State, pairAddress: string, tokenA: string, tokenB: string): Promise<BigNumber[]>;
    export { getPair, isPairRegistered, getPairInfo, getToBeApprovedTokens, getLiquidityProviderAddress, addLiquidity, removeLiquidity, lockGroupQueueOffer, getQueueStakeToken, convertWhitelistedAddresses, getOfferIndexes, getGroupQueueInfo };
}
/// <amd-module name="@scom/scom-liquidity-provider/liquidity-utils/model.ts" />
declare module "@scom/scom-liquidity-provider/liquidity-utils/model.ts" {
    import { BigNumber } from "@ijstech/eth-wallet";
    import { IAllocation } from "@scom/scom-liquidity-provider/global/index.ts";
    import { State } from "@scom/scom-liquidity-provider/store/index.ts";
    import { ITokenObject } from "@scom/scom-token-list";
    export enum Stage {
        NONE = 0,
        SET_AMOUNT = 1,
        SET_OFFER_PRICE = 2,
        SET_START_DATE = 3,
        SET_END_DATE = 4,
        SET_OFFER_TO = 5,
        SET_LOCKED = 6,
        SET_ADDRESS = 7,
        FIRST_TOKEN_APPROVAL = 8,
        WAITING_FOR_FIRST_TOKEN_APPROVAL = 9,
        GOV_TOKEN_APPROVAL = 10,
        WAITING_FOR_GOV_TOKEN_APPROVAL = 11,
        SUBMIT = 12
    }
    export enum Action {
        CREATE = 0,
        ADD = 1,
        REMOVE = 2,
        LOCK = 3
    }
    export enum OfferState {
        Everyone = "Everyone",
        Whitelist = "Whitelist Addresses"
    }
    export enum LockState {
        Locked = "Locked",
        Unlocked = "Unlocked"
    }
    export const setOnApproving: (callback: any) => void;
    export const setOnApproved: (callback: any) => void;
    export const toLastSecond: (datetime: any) => any;
    export class Model {
        private state;
        private currentStage;
        private pairAddress;
        private offerIndex;
        private fromTokenAddress;
        private toTokenAddress;
        private actionType;
        private pairIndex;
        private isFirstLoad;
        private pairCustomParams;
        private fromTokenInput;
        private fromTokenInputText;
        private offerPriceText;
        private offerTo;
        private originalFee;
        private whitelistFee;
        private fee;
        private startDate;
        private endDate;
        private switchLock;
        private addresses;
        private approvalModelAction;
        onShowTxStatus: (status: 'success' | 'warning' | 'error', content: string | Error) => void;
        onSubmitBtnStatus: (isLoading: boolean, isApproval?: boolean, offerIndex?: number) => void;
        onBack: () => void;
        private get fromTokenObject();
        private get toTokenObject();
        private get fromTokenSymbol();
        private summaryData;
        private get enableApproveAllowance();
        private get fromTokenInputValid();
        private get offerPriceInputValid();
        private get fromTokenBalanceExact();
        private get govTokenBalanceExact();
        private get getJoinValidation();
        private isProceedButtonDisabled;
        private get proceedButtonText();
        private get nextButtonText();
        private get isFirstTokenApproved();
        private get isGovTokenApproved();
        private get isWaitingForApproval();
        private get newAmount();
        private get listAddress();
        private get newTotalAddress();
        private get newTotalAllocation();
        private get currentTotalAllocation();
        private setCurrentStage;
        getState: () => {
            currentStage: () => Stage;
            setCurrentStage: (stage: Stage) => void;
            fromTokenAddress: () => string;
            toTokenAddress: () => string;
            fromTokenObject: () => ITokenObject;
            toTokenObject: () => ITokenObject;
            fromTokenInput: () => BigNumber;
            fromTokenInputText: () => string;
            isProceedButtonDisabled: () => boolean;
            proceedButtonText: () => string;
            nextButtonText: () => string;
            offerPriceText: () => string;
            offerPriceInputTextChange: (value: string) => void;
            offerTo: () => OfferState;
            offerToChange: (value: OfferState) => void;
            summaryData: () => any;
            adviceTexts: () => any[];
            isFirstTokenApproved: () => boolean;
            isGovTokenApproved: () => boolean;
            isWaitingForApproval: () => boolean;
            fromTokenInputTextChange: (value: string) => Promise<void>;
            fromTokenBalance: () => number;
            govTokenBalance: () => number;
            proceed: () => Promise<void>;
            fetchData: () => Promise<void>;
            fromTokenInputValid: () => boolean;
            enableApproveAllowance: () => boolean;
            startDate: () => any;
            endDate: () => any;
            startDateChange: (value: string | number) => void;
            endDateChange: (value: string | number) => void;
            switchLock: () => LockState;
            addresses: () => IAllocation[];
            addressChange: (value: IAllocation[]) => void;
            pairCustomParams: () => any;
            fee: () => string;
            feeChange: (value: string) => void;
            setMaxBalanceToFromToken: () => void;
            newAmount: () => BigNumber;
            newTotalAddress: () => number;
            newTotalAllocation: () => number;
            setSummaryData: (value: boolean) => void;
        };
        private fetchData;
        private setSummaryData;
        private proceed;
        private get validateEmptyInput();
        private get fromTokenBalance();
        private get govTokenBalance();
        private get fromTokenDecimals();
        private get adviceTexts();
        constructor(state: State, pairAddress: string, fromTokenAddress: string, offerIndex: number, actionType: number);
        private showTxStatus;
        private setSubmitBtnStatus;
        initApprovalModelAction(): Promise<void>;
        private fromTokenInputTextChange;
        private setMaxBalanceToFromToken;
        private fromTokenInputChange;
        private offerPriceInputTextChange;
        private startDateChange;
        private endDateChange;
        private offerToChange;
        private addressChange;
        private feeChange;
        private getNextTokenApprovalStage;
        private approveToken;
        private addLiquidityAction;
        private removeLiquidityAction;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/liquidity-utils/index.ts" />
declare module "@scom/scom-liquidity-provider/liquidity-utils/index.ts" {
    export * from "@scom/scom-liquidity-provider/liquidity-utils/API.ts";
    export * from "@scom/scom-liquidity-provider/liquidity-utils/model.ts";
}
/// <amd-module name="@scom/scom-liquidity-provider/formSchema.ts" />
declare module "@scom/scom-liquidity-provider/formSchema.ts" {
    import { ComboBox } from "@ijstech/components";
    import ScomNetworkPicker from "@scom/scom-network-picker";
    import ScomTokenInput from "@scom/scom-token-input";
    import { State } from "@scom/scom-liquidity-provider/store/index.ts";
    const _default_2: {
        dataSchema: {
            type: string;
            properties: {
                chainId: {
                    type: string;
                    required: boolean;
                };
                tokenIn: {
                    type: string;
                    required: boolean;
                };
                tokenOut: {
                    type: string;
                    required: boolean;
                };
                isCreate: {
                    type: string;
                    title: string;
                    default: boolean;
                };
                offerIndex: {
                    type: string;
                };
                dark: {
                    type: string;
                    properties: {
                        backgroundColor: {
                            type: string;
                            format: string;
                        };
                        fontColor: {
                            type: string;
                            format: string;
                        };
                        inputBackgroundColor: {
                            type: string;
                            format: string;
                        };
                        inputFontColor: {
                            type: string;
                            format: string;
                        };
                    };
                };
                light: {
                    type: string;
                    properties: {
                        backgroundColor: {
                            type: string;
                            format: string;
                        };
                        fontColor: {
                            type: string;
                            format: string;
                        };
                        inputBackgroundColor: {
                            type: string;
                            format: string;
                        };
                        inputFontColor: {
                            type: string;
                            format: string;
                        };
                    };
                };
            };
        };
        uiSchema: {
            type: string;
            elements: ({
                type: string;
                label: string;
                elements: {
                    type: string;
                    elements: ({
                        type: string;
                        scope: string;
                        rule?: undefined;
                    } | {
                        type: string;
                        scope: string;
                        rule: {
                            effect: string;
                            condition: {
                                scope: string;
                                schema: {
                                    const: boolean;
                                };
                            };
                        };
                    })[];
                }[];
            } | {
                type: string;
                label: string;
                elements: {
                    type: string;
                    elements: {
                        type: string;
                        label: string;
                        scope: string;
                    }[];
                }[];
            })[];
        };
        customControls(state: State): {
            "#/properties/chainId": {
                render: () => ScomNetworkPicker;
                getData: (control: ScomNetworkPicker) => number;
                setData: (control: ScomNetworkPicker, value: number) => void;
            };
            "#/properties/tokenIn": {
                render: () => ScomTokenInput;
                getData: (control: ScomTokenInput) => string;
                setData: (control: ScomTokenInput, value: string) => void;
            };
            "#/properties/tokenOut": {
                render: () => ScomTokenInput;
                getData: (control: ScomTokenInput) => string;
                setData: (control: ScomTokenInput, value: string) => void;
            };
            "#/properties/offerIndex": {
                render: () => ComboBox;
                getData: (control: ComboBox) => string;
                setData: (control: ComboBox, value: string) => Promise<void>;
            };
        };
    };
    export default _default_2;
    export function getProjectOwnerSchema(): {
        dataSchema: {
            type: string;
            properties: {
                chainId: {
                    type: string;
                    required: boolean;
                };
                tokenIn: {
                    type: string;
                };
                tokenOut: {
                    type: string;
                };
                isCreate: {
                    type: string;
                    title: string;
                    default: boolean;
                };
                offerIndex: {
                    type: string;
                };
            };
        };
        uiSchema: {
            type: string;
            elements: ({
                type: string;
                scope: string;
                rule?: undefined;
            } | {
                type: string;
                scope: string;
                rule: {
                    effect: string;
                    condition: {
                        scope: string;
                        schema: {
                            const: boolean;
                        };
                    };
                };
            })[];
        };
        customControls(state: State): {
            "#/properties/chainId": {
                render: () => ScomNetworkPicker;
                getData: (control: ScomNetworkPicker) => number;
                setData: (control: ScomNetworkPicker, value: number) => void;
            };
            "#/properties/tokenIn": {
                render: () => ScomTokenInput;
                getData: (control: ScomTokenInput) => string;
                setData: (control: ScomTokenInput, value: string) => void;
            };
            "#/properties/tokenOut": {
                render: () => ScomTokenInput;
                getData: (control: ScomTokenInput) => string;
                setData: (control: ScomTokenInput, value: string) => void;
            };
            "#/properties/offerIndex": {
                render: () => ComboBox;
                getData: (control: ComboBox) => string;
                setData: (control: ComboBox, value: string) => Promise<void>;
            };
        };
    };
    export function getFormSchema(): {
        dataSchema: {
            type: string;
            required: string[];
            properties: {
                chainId: {
                    type: string;
                };
                tokenIn: {
                    type: string;
                };
                tokenOut: {
                    type: string;
                };
                isCreate: {
                    type: string;
                    title: string;
                    default: boolean;
                };
                offerIndex: {
                    type: string;
                };
            };
        };
        uiSchema: {
            type: string;
            elements: ({
                type: string;
                scope: string;
                rule?: undefined;
            } | {
                type: string;
                scope: string;
                rule: {
                    effect: string;
                    condition: {
                        scope: string;
                        schema: {
                            const: boolean;
                        };
                    };
                };
            })[];
        };
        customControls(state: State): {
            "#/properties/chainId": {
                render: () => ScomNetworkPicker;
                getData: (control: ScomNetworkPicker) => number;
                setData: (control: ScomNetworkPicker, value: number) => void;
            };
            '#/properties/tokenIn': {
                render: () => ScomTokenInput;
                getData: (control: ScomTokenInput) => string;
                setData: (control: ScomTokenInput, value: string) => void;
            };
            "#/properties/tokenOut": {
                render: () => ScomTokenInput;
                getData: (control: ScomTokenInput) => string;
                setData: (control: ScomTokenInput, value: string) => void;
            };
            "#/properties/offerIndex": {
                render: () => ComboBox;
                getData: (control: ComboBox) => string;
                setData: (control: ComboBox, value: string) => Promise<void>;
            };
        };
    };
}
/// <amd-module name="@scom/scom-liquidity-provider/detail/whitelist.css.ts" />
declare module "@scom/scom-liquidity-provider/detail/whitelist.css.ts" {
    export const whiteListStyle: string;
}
/// <amd-module name="@scom/scom-liquidity-provider/detail/whitelist.tsx" />
declare module "@scom/scom-liquidity-provider/detail/whitelist.tsx" {
    import { Module, ControlElement, Input, Container } from '@ijstech/components';
    import { BigNumber } from '@ijstech/eth-wallet';
    import { IAllocation } from "@scom/scom-liquidity-provider/global/index.ts";
    import { State } from "@scom/scom-liquidity-provider/store/index.ts";
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['manage-whitelist']: ControlElement;
            }
        }
    }
    export interface IData {
        isReadOnly?: boolean;
        balance?: string | number;
        tokenSymbol: string;
        decimals?: number;
        addresses: IAllocation[];
        pairCustomParams?: any;
    }
    export class ManageWhitelist extends Module {
        private _state;
        private _props;
        private balance;
        private tokenSymbol;
        private decimals;
        private addresses;
        private pairCustomParams;
        private isReadOnly;
        private listAddress;
        private totalAddressLabel;
        private totalAllocationLabel;
        private manageWhitelistModal;
        private listAddressContainer;
        private balanceFeeContainer;
        private addPanel;
        private batchPanel;
        private inputBatch;
        private groupBtnElm;
        private totalFee;
        private balanceLabel;
        private cancelBtn;
        private saveBtn;
        private isAddByBatch;
        private searchInput;
        convertWhitelistedAddresses: any;
        updateAddress: any;
        private totalPage;
        private pageNumber;
        private itemStart;
        private itemEnd;
        private paginationElm;
        set state(value: State);
        get state(): State;
        get props(): IData;
        get chainId(): number;
        set props(value: IData);
        get totalAddress(): number;
        get totalAllocation(): string;
        get fee(): BigNumber;
        get idxFiltering(): number;
        get listAddressFiltered(): IAllocation[];
        get listAddressPagination(): IAllocation[];
        constructor(parent?: Container, options?: any);
        renderUI: () => void;
        setDefaultAddresses: () => void;
        updateTotalValues: () => void;
        renderAddresses: () => void;
        get isDisabled(): boolean;
        getBatchValues: () => any[];
        onSave: () => void;
        onCancel: () => void;
        onInputAddress: (e: Input, idx: number) => void;
        onInputAllocation: (e: Input, idx: number) => void;
        onInputBatch: () => void;
        validateForm: () => Promise<void>;
        onAddBatch: () => void;
        onClear: () => void;
        onAdd: () => void;
        removeAddress: (index: number, indexVal: number) => void;
        handlePagination: (value: number) => void;
        onSelectIndex: () => void;
        resetPaging: () => void;
        searchAddress: () => void;
        showModal: () => void;
        closeModal: () => void;
        init(): void;
        render(): any;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/detail/form.tsx" />
declare module "@scom/scom-liquidity-provider/detail/form.tsx" {
    import { Control, Module, ControlElement, Container } from '@ijstech/components';
    import { State } from "@scom/scom-liquidity-provider/store/index.ts";
    import { Stage, OfferState } from "@scom/scom-liquidity-provider/liquidity-utils/index.ts";
    interface LiquidityFormElememt extends ControlElement {
        onCogClick?: () => void;
    }
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['liquidity-form']: LiquidityFormElememt;
            }
        }
    }
    export class LiquidityForm extends Module {
        private _state;
        private offerToDropdown;
        private offerToModal;
        private pnlForm;
        private firstInput;
        private secondInput;
        private firstTokenInput;
        private secondTokenInput;
        private headerSection;
        private secondTokenPanel;
        private datePanel;
        private startDateContainer;
        private endDateContainer;
        private inputStartDate;
        private inputEndDate;
        private btnAddress;
        private lbAddress;
        private statusPanel;
        private addressPanel;
        private lbWillGet;
        private lbFee;
        private lbGovBalance;
        private approveAllowancePanel;
        private nextBtn1;
        private nextBtn2;
        private nextBtn3;
        private nextBtn4;
        private nextBtn5;
        private submitBtn;
        private progress1;
        private progress2;
        private manageWhitelist;
        private addresses;
        private confirmationModal;
        private lbOfferPrice1;
        private lbOfferPrice2;
        private isReverse;
        private oswapToken;
        private offerTo;
        private _model;
        private _actionType;
        private currentFocus?;
        updateHelpContent: () => void;
        updateSummary: () => void;
        onFieldChanged: (state: Stage) => void;
        onFocusChanged: (state: Stage) => void;
        onCogClick: () => void;
        constructor(parent?: Container, options?: any);
        set state(value: State);
        get state(): State;
        get model(): any;
        set model(value: any);
        get actionType(): number;
        set actionType(value: number);
        get isCreate(): boolean;
        get isAdd(): boolean;
        get isRemove(): boolean;
        get chainId(): number;
        get balanceTitle(): "You Are Selling" | "You Are Collecting";
        get currentStage(): any;
        get fromTokenAddress(): any;
        get toTokenAddress(): any;
        get orderAmountTokenObject(): any;
        get pairCustomParams(): any;
        get isSetOrderAmountStage(): boolean;
        get isOfferPriceStage(): boolean;
        get isStartDateStage(): boolean;
        get isEndDateStage(): boolean;
        get isOfferToStage(): boolean;
        get isAddressStage(): boolean;
        get isOfferPriceDisabled(): boolean;
        get isStartDateDisabled(): boolean;
        get isEndDateDisabled(): boolean;
        get isOfferToDisabled(): boolean;
        get isLockDisabled(): boolean;
        get isAddressDisabled(): boolean;
        get isAddressShown(): boolean;
        get isProceedButtonDisabled(): any;
        get isSubmitButtonDisabled(): any;
        get proceedButtonText(): any;
        get nextButtonText(): any;
        get fromTokenInputText(): any;
        get fromTokenDecimals(): any;
        get offerPriceText(): any;
        get offerTokenDecimals(): number;
        get newAmount(): any;
        get fee(): any;
        get addressText(): string;
        get btnAddressText(): "Manage Address" | "Add Address";
        get oswapIcon(): string;
        get oswapSymbol(): string;
        onUpdateHelpContent: () => void;
        onUpdateSummary: () => Promise<void>;
        onSubmitBtnStatus: (isLoading: boolean, isApproval?: boolean) => void;
        onSetMaxBalance: () => void;
        updateSummaryField: () => void;
        showConfirmation: () => void;
        hideConfirmation: () => void;
        onSubmit: () => void;
        preProceed: (source: Control, stage: Stage) => Promise<void>;
        onProceed: (source: Control) => Promise<void>;
        private handleNext1;
        private handleNext2;
        private handleNext3;
        private handleNext4;
        handleTokenInputState: () => void;
        handleBtnState: () => void;
        handleChangeOfferTo: (value: OfferState) => void;
        handleFocusInput: (source: Control, stage: Stage) => void;
        handleFirstFocusInput(source: Control): void;
        handleSecondFocusInput(source: Control): void;
        setBorder(source: Control): void;
        removeBorder(): void;
        fromTokenInputTextChange(): Promise<void>;
        changeOfferPrice(): void;
        changeStartDate: (value: any) => void;
        changeEndDate: (value: any) => void;
        setAttrDatePicker: () => void;
        updateTextValues: () => void;
        setData: () => void;
        getAddress: (data: any) => void;
        showWhitelistModal: () => void;
        onOfferTo(source: Control): void;
        private onSwitchPrice;
        renderHeader: () => void;
        handleCogClick(): void;
        renderUI: () => Promise<void>;
        renderProgress: () => any;
        updateProgress: () => void;
        onApproving: () => void;
        onApproved: () => void;
        init(): void;
        render(): any;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/detail/progress.tsx" />
declare module "@scom/scom-liquidity-provider/detail/progress.tsx" {
    import { Module, ControlElement } from '@ijstech/components';
    interface ProgressElement extends ControlElement {
        onProgressDone?: any;
    }
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['liquidity-progress']: ProgressElement;
            }
        }
    }
    export class LiquidityProgress extends Module {
        private interVal;
        private timeout;
        private percent;
        private _onProgressDone;
        get onProgressDone(): any;
        set onProgressDone(callback: any);
        init(): void;
        runProgress(): void;
        reStartProgress(): void;
        render(): any;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/detail/summary.tsx" />
declare module "@scom/scom-liquidity-provider/detail/summary.tsx" {
    import { Module, ControlElement, Container } from '@ijstech/components';
    import { State } from "@scom/scom-liquidity-provider/store/index.ts";
    import { IAllocation } from "@scom/scom-liquidity-provider/global/index.ts";
    import { Stage } from "@scom/scom-liquidity-provider/liquidity-utils/index.ts";
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['liquidity-summary']: ControlElement;
            }
        }
    }
    interface ISummaryRowData {
        display: string;
        className?: string;
        onClick?: any;
        shown?: boolean;
        tooltip?: string;
    }
    interface ISummaryData {
        id: string;
        title: string;
        data?: {
            row1: ISummaryRowData;
            row2?: ISummaryRowData;
        };
        className?: string;
        shown: boolean;
    }
    export class LiquiditySummary extends Module {
        private _state;
        private summarySection;
        private amountRow;
        private offerPriceRow;
        private startDateRow;
        private endDateRow;
        private statusRow;
        private whitelistRow;
        private allocationRow;
        private receiveRow;
        private feeRow;
        private _summaryData;
        private _fromTokenAddress;
        private _actionType;
        private isSummaryLoaded;
        private _fetchData;
        private manageWhitelist;
        constructor(parent?: Container, options?: any);
        set state(value: State);
        get state(): State;
        get chainId(): number;
        get fromTokenAddress(): string;
        set fromTokenAddress(value: string);
        get actionType(): number;
        set actionType(value: number);
        get summaryData(): any;
        set summaryData(value: any);
        get isPriceError(): boolean;
        get fetchData(): any;
        set fetchData(callback: any);
        formatDate: (date: any) => string;
        showAddresses(addresses: IAllocation[]): void;
        getSummaryData(stage?: Stage): ISummaryData[];
        renderSummary(): void;
        updateSummaryUI(stage?: Stage): void;
        init(): void;
        onFetchData(): void;
        resetHighlight(): void;
        onHighlight(stage: Stage): void;
        render(): any;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/detail/help.tsx" />
declare module "@scom/scom-liquidity-provider/detail/help.tsx" {
    import { Module, ControlElement } from '@ijstech/components';
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['liquidity-help']: ControlElement;
            }
        }
    }
    export class LiquidityHelp extends Module {
        private rightContainer;
        private _adviceTexts;
        get adviceTexts(): string[];
        set adviceTexts(value: string[]);
        updateAdviceText(): void;
        render(): any;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/detail/index.tsx" />
declare module "@scom/scom-liquidity-provider/detail/index.tsx" {
    export { LiquidityForm } from "@scom/scom-liquidity-provider/detail/form.tsx";
    export { LiquiditySummary } from "@scom/scom-liquidity-provider/detail/summary.tsx";
    export { LiquidityHelp } from "@scom/scom-liquidity-provider/detail/help.tsx";
    export { LiquidityProgress } from "@scom/scom-liquidity-provider/detail/progress.tsx";
}
/// <amd-module name="@scom/scom-liquidity-provider/flow/initialSetup.tsx" />
declare module "@scom/scom-liquidity-provider/flow/initialSetup.tsx" {
    import { Control, ControlElement, Module } from "@ijstech/components";
    import { State } from "@scom/scom-liquidity-provider/store/index.ts";
    interface ScomLiquidityProviderFlowInitialSetupElement extends ControlElement {
        data?: any;
    }
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['i-scom-liquidity-provider-flow-initial-setup']: ScomLiquidityProviderFlowInitialSetupElement;
            }
        }
    }
    export default class ScomLiquidityProviderFlowInitialSetup extends Module {
        private lblTitle;
        private lblConnectedStatus;
        private btnConnectWallet;
        private pnlActions;
        private btnAdd;
        private btnRemove;
        private tokenInInput;
        private tokenOutInput;
        private pnlAdditional;
        private comboOfferIndex;
        private mdWallet;
        private _state;
        private tokenRequirements;
        private executionProperties;
        private walletEvents;
        private action;
        get state(): State;
        set state(value: State);
        private get rpcWallet();
        private get chainId();
        private resetRpcWallet;
        setData(value: any): Promise<void>;
        private initWallet;
        private initializeWidgetConfig;
        connectWallet(): Promise<void>;
        private updateConnectStatus;
        private registerEvents;
        onHide(): void;
        init(): void;
        private handleClickStart;
        private handleSelectToken;
        private updateActionButton;
        private handleClickAdd;
        private handleClickRemove;
        render(): any;
        handleFlowStage(target: Control, stage: string, options: any): Promise<{
            widget: ScomLiquidityProviderFlowInitialSetup;
        }>;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider" />
declare module "@scom/scom-liquidity-provider" {
    import { Module, Container, ControlElement, Control } from '@ijstech/components';
    import { IWalletPlugin } from '@scom/scom-wallet-modal';
    import { INetworkConfig } from '@scom/scom-network-picker';
    import { ILiquidityProvider } from "@scom/scom-liquidity-provider/global/index.ts";
    interface ScomLiquidityProviderElement extends ControlElement, ILiquidityProvider {
        lazyLoad?: boolean;
    }
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['i-scom-liquidity-provider']: ScomLiquidityProviderElement;
            }
        }
    }
    export default class ScomLiquidityProvider extends Module {
        private state;
        private _data;
        tag: any;
        defaultEdit: boolean;
        private loadingElm;
        private txStatusModal;
        private dappContainer;
        private mdWallet;
        private detailForm;
        private detailSummary;
        private detailHelp;
        private model;
        private modelState;
        private panelLiquidity;
        private panelHome;
        private pnlQueueItem;
        private lbMsg;
        private hStackActions;
        private btnAdd;
        private btnRemove;
        private btnLock;
        private hStackSettings;
        private btnSetting;
        private btnRefresh;
        private btnWallet;
        private hStackBack;
        private lockModal;
        private lockModalTitle;
        private firstCheckbox;
        private secondCheckbox;
        private lockOrderBtn;
        private mdSettings;
        private form;
        private actionType;
        private pairAddress;
        private liquidities;
        private rpcWalletEvents;
        private _getActions;
        private getProjectOwnerActions;
        getConfigurators(): ({
            name: string;
            target: string;
            getProxySelectors: (chainId: number) => Promise<any[]>;
            getActions: () => any[];
            getData: any;
            setData: (data: any) => Promise<void>;
            getTag: any;
            setTag: any;
        } | {
            name: string;
            target: string;
            getActions: (category?: string) => any[];
            getData: any;
            setData: (data: any) => Promise<void>;
            getTag: any;
            setTag: any;
            getProxySelectors?: undefined;
        } | {
            name: string;
            target: string;
            getData: () => Promise<{
                chainId: number;
                tokenIn?: string;
                tokenOut?: string;
                isCreate?: boolean;
                offerIndex?: number;
                action?: import("@scom/scom-liquidity-provider/global/index.ts").ActionType;
                wallets: IWalletPlugin[];
                networks: INetworkConfig[];
                showHeader?: boolean;
            }>;
            setData: (properties: ILiquidityProvider, linkParams?: Record<string, any>) => Promise<void>;
            getTag: any;
            setTag: any;
            getProxySelectors?: undefined;
            getActions?: undefined;
        })[];
        private getData;
        private resetRpcWallet;
        private setData;
        private getTag;
        private updateTag;
        private setTag;
        private updateStyle;
        private updateTheme;
        get wallets(): IWalletPlugin[];
        set wallets(value: IWalletPlugin[]);
        get networks(): INetworkConfig[];
        set networks(value: INetworkConfig[]);
        get showHeader(): boolean;
        set showHeader(value: boolean);
        private get chainId();
        private get rpcWallet();
        private get fromTokenAddress();
        private get toTokenAddress();
        private get offerIndex();
        private get fromTokenObject();
        private get toTokenObject();
        constructor(parent?: Container, options?: ControlElement);
        removeRpcWalletEvents(): void;
        onHide(): void;
        private onChainChanged;
        private refreshUI;
        private initializeWidgetConfig;
        private fetchData;
        private renderForm;
        private connectWallet;
        private renderHome;
        private onViewContract;
        private renderQueueItem;
        private onBack;
        private handleAdd;
        private handleRemove;
        private handleLock;
        private onActions;
        private showLockModal;
        private closeLockModal;
        private onChangeFirstChecked;
        private onChangeSecondChecked;
        private onConfirmLock;
        private initWallet;
        private showMessage;
        private checkValidation;
        init(): Promise<void>;
        private handleConfirmClick;
        private onCogClick;
        render(): any;
        handleFlowStage(target: Control, stage: string, options: any): Promise<{
            widget: any;
        }>;
    }
}
