/// <reference path="@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@scom/scom-dapp-container/@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@scom/scom-token-input/@ijstech/eth-wallet/index.d.ts" />
/// <reference path="@scom/scom-token-input/@scom/scom-token-modal/@ijstech/eth-wallet/index.d.ts" />
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
}
/// <amd-module name="@scom/scom-liquidity-provider/formSchema.ts" />
declare module "@scom/scom-liquidity-provider/formSchema.ts" {
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
                        textSecondary: {
                            type: string;
                            title: string;
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
                        textSecondary: {
                            type: string;
                            title: string;
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
                    elements: {
                        type: string;
                        scope: string;
                    }[];
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
                    required: boolean;
                };
                tokenOut: {
                    type: string;
                    required: boolean;
                };
            };
        };
        uiSchema: {
            type: string;
            elements: {
                type: string;
                scope: string;
            }[];
        };
    };
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
    export const formatNumberWithSeparators: (value: number, precision?: number) => string;
    export const renderBalanceTooltip: (params: IBalanceTooltip, tokenMap: TokenMapType, isBold?: boolean) => any;
    export const formatNumberValue: (data: IBalanceTooltip, tokenMap: TokenMapType) => any;
    export const isInvalidInput: (val: any) => boolean;
    export const limitInputNumber: (input: any, decimals?: number) => void;
    export const limitDecimals: (value: any, decimals: number) => any;
    export const toWeiInv: (n: string, unit?: number) => BigNumber;
}
/// <amd-module name="@scom/scom-liquidity-provider/global/utils/common.ts" />
declare module "@scom/scom-liquidity-provider/global/utils/common.ts" {
    import { ISendTxEventsOptions } from "@ijstech/eth-wallet";
    export const registerSendTxEvents: (sendTxEventHandlers: ISendTxEventsOptions) => void;
}
/// <amd-module name="@scom/scom-liquidity-provider/global/utils/interfaces.ts" />
declare module "@scom/scom-liquidity-provider/global/utils/interfaces.ts" {
    import { INetworkConfig } from "@scom/scom-network-picker";
    import { IWalletPlugin } from "@scom/scom-wallet-modal";
    export interface ICommissionInfo {
        chainId: number;
        walletAddress: string;
        share: string;
    }
    export interface ILiquidityProvider {
        chainId: number;
        tokenIn: string;
        tokenOut: string;
        wallets: IWalletPlugin[];
        networks: INetworkConfig[];
        showHeader?: boolean;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/global/utils/index.ts" />
declare module "@scom/scom-liquidity-provider/global/utils/index.ts" {
    export * from "@scom/scom-liquidity-provider/global/utils/helper.ts";
    export { registerSendTxEvents } from "@scom/scom-liquidity-provider/global/utils/common.ts";
    export * from "@scom/scom-liquidity-provider/global/utils/interfaces.ts";
}
/// <amd-module name="@scom/scom-liquidity-provider/global/index.ts" />
declare module "@scom/scom-liquidity-provider/global/index.ts" {
    export * from "@scom/scom-liquidity-provider/global/utils/index.ts";
    export const isAddressValid: (address: string) => Promise<any>;
}
/// <amd-module name="@scom/scom-liquidity-provider/liquidity-utils/API.ts" />
declare module "@scom/scom-liquidity-provider/liquidity-utils/API.ts" {
    import { BigNumber } from '@ijstech/eth-wallet';
    import { State } from "@scom/scom-liquidity-provider/store/index.ts";
    import { ITokenObject } from '@scom/scom-token-list';
    export interface AllocationMap {
        address: string;
        allocation: string;
    }
    export function getAddresses(chainId: number): {};
    const getQueueStakeToken: (chainId: number) => ITokenObject | null;
    const getLiquidityProviderAddress: (chainId: number) => any;
    const getPair: (chainId: number, tokenA: ITokenObject, tokenB: ITokenObject) => Promise<string>;
    const getGroupQueuePairInfo: (state: State, pairAddress: string, tokenAddress: string, provider?: string, offerIndex?: number) => Promise<{
        feePerOrder: string;
        feePerTrader: string;
        maxDur: string;
        pairAddress: string;
        fromTokenAddress: string;
        toTokenAddress: string;
        pairIndex: BigNumber;
    }>;
    const getToBeApprovedTokens: (chainId: number, tokenObj: ITokenObject, amount: string, stake: string) => Promise<string[]>;
    const approveLPMax: (chainId: number, tokenObj: ITokenObject, callback: any, confirmationCallback: any) => Promise<import("@ijstech/eth-contract").TransactionReceipt>;
    const getEstimatedAmountInUSD: (chainId: number, tokenObj: ITokenObject, amount: string) => Promise<string>;
    const approvePairMax: (chainId: number, pairAddress: string, callback: any, confirmationCallback: any) => Promise<import("@ijstech/eth-contract").TransactionReceipt>;
    const addLiquidityToGroupQueue: (chainId: number, tokenA: ITokenObject, tokenB: ITokenObject, tokenIn: ITokenObject, pairIndex: number, offerIndex: number, amountIn: number, allowAll: boolean, restrictedPrice: string, startDate: number, expire: number, deadline: number, whitelistAddress: any[]) => Promise<any>;
    export interface QueueBasicInfo {
        firstToken: string;
        secondToken: string;
        queueSize: BigNumber;
        topStake: BigNumber | undefined;
        totalOrder: BigNumber;
        totalStake: BigNumber | undefined;
        pairAddress: string;
        isOdd: boolean;
    }
    const convertGroupQueueWhitelistedAddresses: (inputText: string) => {
        address: string;
        allocation: number;
    }[];
    function isPairRegistered(state: State, tokenA: string, tokenB: string): Promise<boolean>;
    export { getPair, isPairRegistered, getGroupQueuePairInfo, getToBeApprovedTokens, approveLPMax, getLiquidityProviderAddress, getEstimatedAmountInUSD, approvePairMax, addLiquidityToGroupQueue, getQueueStakeToken, convertGroupQueueWhitelistedAddresses };
}
/// <amd-module name="@scom/scom-liquidity-provider/liquidity-utils/model.ts" />
declare module "@scom/scom-liquidity-provider/liquidity-utils/model.ts" {
    import { BigNumber } from "@ijstech/eth-wallet";
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
        JOIN = "join",
        ADD = "add",
        REMOVE = "remove",
        MOVE = "move",
        COLLECT = "collect"
    }
    export enum OfferState {
        Everyone = "Everyone",
        Whitelist = "Whitelist Addresses"
    }
    export enum LockState {
        Locked = "Locked",
        Unlocked = "Unlocked"
    }
    export interface InputData {
        fromTokenInputText: string;
        offerPriceText: string;
        startDateStr: string;
        endDateStr: string;
        switchLock: LockState;
        addresses: any[];
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
        private pairIndex;
        private isFirstLoad;
        private pairCustomParams;
        private fromTokenInput;
        private estimatedAmountInUSD;
        private govTokenInput;
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
        private $eventBus;
        private get fromTokenObject();
        private get toTokenObject();
        private get fromTokenSymbol();
        private get toTokenSymbol();
        private summaryData;
        private get enableApproveAllowance();
        private get fromTokenInputValid();
        private get offerPriceInputValid();
        private get fromTokenBalanceExact();
        private get govTokenBalanceExact();
        private get getJoinGroupQueueValidation();
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
            estimatedAmountInUSD: () => BigNumber;
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
            addresses: () => any[];
            addressChange: (value: any) => void;
            pairCustomParams: () => any;
            fee: () => string;
            feeChange: (value: string) => void;
            setMaxBalanceToFromToken: () => void;
            newAmount: () => BigNumber;
            newTotalAddress: () => any;
            newTotalAllocation: () => any;
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
        constructor(state: State, pairAddress: string, fromTokenAddress: string, offerIndex: number);
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
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/liquidity-utils/index.ts" />
declare module "@scom/scom-liquidity-provider/liquidity-utils/index.ts" {
    export * from "@scom/scom-liquidity-provider/liquidity-utils/API.ts";
    export * from "@scom/scom-liquidity-provider/liquidity-utils/model.ts";
}
/// <amd-module name="@scom/scom-liquidity-provider/whitelist/index.css.ts" />
declare module "@scom/scom-liquidity-provider/whitelist/index.css.ts" {
    export const whiteListStyle: string;
}
/// <amd-module name="@scom/scom-liquidity-provider/whitelist/index.tsx" />
declare module "@scom/scom-liquidity-provider/whitelist/index.tsx" {
    import { Module, ControlElement, Container } from '@ijstech/components';
    import { BigNumber } from '@ijstech/eth-wallet';
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
        addresses: any[];
        pairCustomParams?: any;
    }
    export class ManageWhitelist extends Module {
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
        convertGroupQueueWhitelistedAddresses: any;
        updateAddress: any;
        private totalPage;
        private pageNumber;
        private itemStart;
        private itemEnd;
        private paginationElm;
        get props(): IData;
        set props(value: IData);
        get totalAddress(): number;
        get totalAllocation(): string;
        get fee(): BigNumber;
        get idxFiltering(): any;
        get listAddressFiltered(): any;
        get listAddressPagination(): any;
        constructor(parent?: Container, options?: any);
        renderUI: () => void;
        setDefaultAddresses: () => void;
        updateTotalValues: () => void;
        renderAddresses: () => void;
        get isDisabled(): any;
        getBatchValues: () => any[];
        onSave: () => void;
        onCancel: () => void;
        onInputAddress: (e: any, idx: number) => void;
        onInputAllocation: (e: any, idx: number) => void;
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
    global {
        namespace JSX {
            interface IntrinsicElements {
                ['liquidity-form']: ControlElement;
            }
        }
    }
    export class LiquidityForm extends Module {
        private _state;
        private balanceLb;
        private offerToDropdown;
        private offerToModal;
        private queueForm;
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
        private currentFocus?;
        private $eventBus;
        updateHelpContent: any;
        updateSummary: any;
        constructor(parent?: Container, options?: any);
        set state(value: State);
        get state(): State;
        get model(): any;
        set model(value: any);
        get chainId(): number;
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
        onSetMaxBalance: () => void;
        updateSummaryField: () => void;
        showConfirmation: (value: boolean) => void;
        onSubmit: () => void;
        preProceed: (source: Control, stage: Stage) => Promise<void>;
        onProceed: (source: Control) => Promise<void>;
        handleTokenInputState: () => void;
        handleBtnState: () => void;
        handleChangeOfferTo: (value: OfferState) => void;
        handleFocusInput: (source: Control, stage: Stage) => void;
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
        private settingLb;
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
        private $eventBus;
        private _fromTokenAddress;
        private isSummaryLoaded;
        private _fetchData;
        private manageWhitelist;
        constructor(parent?: Container, options?: any);
        registerEvent(): void;
        onWalletConnect: (connected: boolean) => Promise<void>;
        set state(value: State);
        get state(): State;
        get chainId(): number;
        get fromTokenAddress(): string;
        set fromTokenAddress(value: string);
        get summaryData(): any;
        set summaryData(value: any);
        get isPriceError(): boolean;
        get fetchData(): any;
        set fetchData(callback: any);
        formatDate: (date: any) => string;
        showSetting(): void;
        showAddresses(addresses: any): void;
        getSummaryData(stage?: Stage): ISummaryData[];
        renderSummary(): void;
        updateSummaryUI(stage?: Stage): void;
        renderSetting(value: boolean): void;
        init(): void;
        onFetchData(): void;
        resetHighlight(): void;
        onHighlightQueue(params: {
            source: string;
            stage: Stage;
        }): void;
        onFormFieldChange(params: {
            source: string;
            stage: Stage;
        }): void;
        render(): any;
    }
}
/// <amd-module name="@scom/scom-liquidity-provider/detail/index.tsx" />
declare module "@scom/scom-liquidity-provider/detail/index.tsx" {
    export { LiquidityForm } from "@scom/scom-liquidity-provider/detail/form.tsx";
    export { LiquiditySummary } from "@scom/scom-liquidity-provider/detail/summary.tsx";
    export { LiquidityProgress } from "@scom/scom-liquidity-provider/detail/progress.tsx";
}
/// <amd-module name="@scom/scom-liquidity-provider" />
declare module "@scom/scom-liquidity-provider" {
    import { Module, Container, ControlElement } from '@ijstech/components';
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
        private model;
        private modelState;
        private $eventBus;
        private panelLiquidity;
        private lbConnectNetwork;
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
        constructor(parent?: Container, options?: ControlElement);
        removeRpcWalletEvents(): void;
        onHide(): void;
        private onChainChanged;
        private refreshUI;
        private initializeWidgetConfig;
        private fetchData;
        private renderForm;
        private renderEmpty;
        private initWallet;
        private showMessage;
        private connectWallet;
        private checkValidation;
        init(): Promise<void>;
        render(): any;
    }
}
