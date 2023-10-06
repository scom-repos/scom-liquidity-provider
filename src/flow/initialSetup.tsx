import {
    application,
    Button,
    Container,
    ControlElement,
    customElements,
    IEventBus,
    Label,
    Module,
    Styles
} from "@ijstech/components";
import { isClientWalletConnected, State } from "../store/index";
import ScomWalletModal from "@scom/scom-wallet-modal";
import { Constants, IEventBusRegistry, Wallet } from "@ijstech/eth-wallet";
import ScomTokenInput from "@scom/scom-token-input";
import { tokenStore } from "@scom/scom-token-list";

const Theme = Styles.Theme.ThemeVars;

interface ScomLiquidityProviderFlowInitialSetupElement extends ControlElement {
    data?: any;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            ['i-scom-liquidity-provider-flow-initial-setup']: ScomLiquidityProviderFlowInitialSetupElement;
        }
    }
}

@customElements('i-scom-liquidity-provider-flow-initial-setup')
export default class ScomLiquidityProviderFlowInitialSetup extends Module {
    private lblConnectedStatus: Label;
    private btnConnectWallet: Button;
    private tokenInInput: ScomTokenInput;
    private tokenOutInput: ScomTokenInput;
    private mdWallet: ScomWalletModal;
    private state: State;
    private tokenRequirements: any;
    private executionProperties: any;
    private invokerId: string;
    private $eventBus: IEventBus;
    private walletEvents: IEventBusRegistry[] = [];

    constructor(parent?: Container, options?: ControlElement) {
        super(parent, options);
        this.state = new State({});
        this.$eventBus = application.EventBus;
    }
    private get rpcWallet() {
        return this.state.getRpcWallet();
    }
    private get chainId() {
        return this.executionProperties.chainId || this.executionProperties.defaultChainId;
    }
    private async resetRpcWallet() {
        await this.state.initRpcWallet(this.chainId);
    }
    async setData(value: any) {
        this.executionProperties = value.executionProperties;
        this.tokenRequirements = value.tokenRequirements;
        this.invokerId = value.invokerId;
        await this.resetRpcWallet();
        await this.initializeWidgetConfig();
    }
    private async initWallet() {
        try {
            const rpcWallet = this.rpcWallet;
            await rpcWallet.init();
        } catch (err) {
            console.log(err);
        }
    }
    private async initializeWidgetConfig() {
        const connected = isClientWalletConnected();
        this.updateConnectStatus(connected);
        await this.initWallet();
        this.tokenInInput.chainId = this.chainId;
        this.tokenOutInput.chainId = this.chainId;
        const tokens = tokenStore.getTokenList(this.chainId);
        this.tokenInInput.tokenDataListProp = tokens;
        this.tokenOutInput.tokenDataListProp = tokens;
    }
    async connectWallet() {
        if (!isClientWalletConnected()) {
            if (this.mdWallet) {
                await application.loadPackage('@scom/scom-wallet-modal', '*');
                this.mdWallet.networks = this.executionProperties.networks;
                this.mdWallet.wallets = this.executionProperties.wallets;
                this.mdWallet.showModal();
            }
        }
    }
    private updateConnectStatus(connected: boolean) {
        if (connected) {
            this.lblConnectedStatus.caption = 'Connected with ' + Wallet.getClientInstance().address;
            this.btnConnectWallet.visible = false;
        } else {
            this.lblConnectedStatus.caption = 'Please connect your wallet first';
            this.btnConnectWallet.visible = true;
        }
    }
    private registerEvents() {
        let clientWallet = Wallet.getClientInstance();
        this.walletEvents.push(
            clientWallet.registerWalletEvent(this, Constants.ClientWalletEvent.AccountsChanged, async (payload: Record<string, any>) => {
                const { account } = payload;
                let connected = !!account;
                this.updateConnectStatus(connected);
            })
        );
    }
    onHide() {
        let clientWallet = Wallet.getClientInstance();
        for (let event of this.walletEvents) {
            clientWallet.unregisterWalletEvent(event);
        }
        this.walletEvents = [];
    }
    init() {
        super.init();
        this.tokenInInput.style.setProperty('--input-background', '#232B5A');
        this.tokenInInput.style.setProperty('--input-font_color', '#fff');
        this.tokenOutInput.style.setProperty('--input-bakcground', '#232B5A');
        this.tokenOutInput.style.setProperty('--input-font_color', '#fff');
        this.registerEvents();
    }
    private async handleClickStart() {
        let eventName = `${this.invokerId}:nextStep`;
        this.executionProperties.tokenIn = this.tokenInInput.token?.address || this.tokenInInput.token?.symbol;
        this.executionProperties.tokenOut = this.tokenOutInput.token?.address || this.tokenOutInput.token?.symbol;
        this.$eventBus.dispatch(eventName, {
            isInitialSetup: true,
            tokenRequirements: this.tokenRequirements,
            executionProperties: this.executionProperties
        });
    }
    render() {
        return (
            <i-vstack gap="1rem" padding={{ top: 10, bottom: 10, left: 20, right: 20 }}>
                <i-label caption="Get Ready to Provide Liquidity"></i-label>
                
                <i-vstack gap="1rem">
                    <i-label id="lblConnectedStatus"></i-label>
                    <i-hstack>
                        <i-button
                            id="btnConnectWallet"
                            caption="Connect Wallet"
                            padding={{ top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }}
                            font={{ color: Theme.colors.primary.contrastText }}
                            onClick={this.connectWallet.bind(this)}
                        ></i-button>
                    </i-hstack>
                </i-vstack>
                <i-label caption="Select a Pair"></i-label>
                <i-hstack horizontalAlignment="center" verticalAlignment="center" wrap="wrap" gap={10}>
                    <i-scom-token-input
                        id="tokenInInput"
                        type="combobox"
                        isBalanceShown={false}
                        isBtnMaxShown={false}
                        isInputShown={false}
                        border={{ radius: 12 }}
                    ></i-scom-token-input>
                    <i-label caption="to" font={{ size: "1rem" }}></i-label>
                    <i-scom-token-input
                        id="tokenOutInput"
                        type="combobox"
                        isBalanceShown={false}
                        isBtnMaxShown={false}
                        isInputShown={false}
                        border={{ radius: 12 }}
                    ></i-scom-token-input>
                </i-hstack>
                <i-hstack verticalAlignment="center">
                    <i-button
                        id="btnStart"
                        caption="Start"
                        padding={{ top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }}
                        font={{ color: Theme.colors.primary.contrastText }}
                        onClick={this.handleClickStart.bind(this)}
                    ></i-button>
                </i-hstack>
                <i-scom-wallet-modal id="mdWallet" wallets={[]}></i-scom-wallet-modal>
            </i-vstack>
        )
    }
}