import {
    application,
    Button,
    ComboBox,
    ControlElement,
    customElements,
    IComboItem,
    Label,
    Module,
    Styles,
    VStack
} from "@ijstech/components";
import { isClientWalletConnected, State } from "../store/index";
import ScomWalletModal from "@scom/scom-wallet-modal";
import { Constants, IEventBusRegistry, Wallet } from "@ijstech/eth-wallet";
import ScomTokenInput from "@scom/scom-token-input";
import { tokenStore } from "@scom/scom-token-list";
import { getOfferIndexes, getPair } from "../liquidity-utils/index";
import { ActionType } from "../global";

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
    private btnCreate: Button;
    private btnAdd: Button;
    private btnRemove: Button;
    private tokenInInput: ScomTokenInput;
    private tokenOutInput: ScomTokenInput;
    private pnlAdditional: VStack;
    private comboOfferIndex: ComboBox;
    private mdWallet: ScomWalletModal;
    private _state: State;
    private tokenRequirements: any;
    private executionProperties: any;
    private walletEvents: IEventBusRegistry[] = [];
    private action: ActionType;

    get state(): State {
        return this._state;
    }
    set state(value: State) {
        this._state = value;
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
        this.tokenOutInput.style.setProperty('--input-background', '#232B5A');
        this.tokenOutInput.style.setProperty('--input-font_color', '#fff');
        this.registerEvents();
    }
    private async handleClickStart() {
        this.executionProperties.chainId = this.chainId;
        this.executionProperties.tokenIn = this.tokenInInput.token?.address || this.tokenInInput.token?.symbol;
        this.executionProperties.tokenOut = this.tokenOutInput.token?.address || this.tokenOutInput.token?.symbol;
        if (this.action !== 'create' && this.comboOfferIndex.selectedItem) {
            this.executionProperties.offerIndex = (this.comboOfferIndex.selectedItem as IComboItem).value;
        }
        if (this.action) {
            this.executionProperties.action = this.action;
        }
        if (this.state.handleNextFlowStep)
            this.state.handleNextFlowStep({
                isInitialSetup: true,
                tokenRequirements: this.tokenRequirements,
                executionProperties: this.executionProperties
            });
    }
    private async handleSelectToken() {
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
                const pairAddress = await getPair(this.state, this.tokenInInput.token, this.tokenOutInput.token);
                const fromTokenAddress = this.tokenInInput.token.address?.toLowerCase() || this.tokenInInput.token.symbol;
                const toTokenAddress = this.tokenOutInput.token.address?.toLowerCase() || this.tokenOutInput.token.symbol;
                const offerIndexes = await getOfferIndexes(this.state, pairAddress, fromTokenAddress, toTokenAddress);
                this.comboOfferIndex.items = offerIndexes.map(v => { return { label: v.toString(), value: v.toString() } });
            } else {
                this.comboOfferIndex.items = [];
            }
        } catch {
            this.comboOfferIndex.items = [];
        } finally {
            this.comboOfferIndex.icon.name = 'angle-down';
            this.comboOfferIndex.icon.spin = false;
            this.comboOfferIndex.enabled = true;
        }
    }
    private updateActionButton() {
        const buttons: Button[] = [this.btnCreate, this.btnAdd, this.btnRemove];
        const index = this.action === 'create' ? 0 : this.action === 'add' ? 1 : 2;
        const target: Button = buttons.splice(index, 1)[0];
        target.background.color = Theme.colors.primary.main;
        target.font = { color: Theme.colors.primary.contrastText };
        target.icon.name = 'check-circle';
        buttons.forEach(button => {
            button.background.color = Theme.colors.primary.contrastText;
            button.font = { color: Theme.colors.primary.main };
            button.icon = undefined;
        })
    }
    private async handleClickCreate() {
        this.action = 'create';
        this.updateActionButton();
        this.pnlAdditional.visible = false;
    }
    private async handleClickAdd() {
        this.action = 'add';
        this.updateActionButton();
        this.pnlAdditional.visible = true;
    }
    private async handleClickRemove() {
        this.action = 'remove';
        this.updateActionButton();
        this.pnlAdditional.visible = true;
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
                <i-label caption="What would you like to do?"></i-label>
                <i-hstack verticalAlignment="center" gap="0.5rem">
                    <i-button
                        id="btnCreate"
                        caption="Create New Offer"
                        font={{ color: Theme.colors.primary.main }}
                        padding={{ top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }}
                        border={{ width: 1, style: 'solid', color: Theme.colors.primary.main }}
                        background={{ color: Theme.colors.primary.contrastText }}
                        onClick={this.handleClickCreate.bind(this)}
                    ></i-button>
                    <i-button
                        id="btnAdd"
                        caption="Add Liquidity"
                        font={{ color: Theme.colors.primary.main }}
                        padding={{ top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }}
                        border={{ width: 1, style: 'solid', color: Theme.colors.primary.main }}
                        background={{ color: Theme.colors.primary.contrastText }}
                        onClick={this.handleClickAdd.bind(this)}
                    ></i-button>
                    <i-button
                        id="btnRemove"
                        caption="Remove Liquidity"
                        font={{ color: Theme.colors.primary.main }}
                        padding={{ top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }}
                        border={{ width: 1, style: 'solid', color: Theme.colors.primary.main }}
                        background={{ color: Theme.colors.primary.contrastText }}
                        onClick={this.handleClickRemove.bind(this)}
                    ></i-button>
                </i-hstack>
                <i-label caption="Select a Pair"></i-label>
                <i-hstack horizontalAlignment="center" verticalAlignment="center" wrap="wrap" gap={10}>
                    <i-scom-token-input
                        id="tokenInInput"
                        type="combobox"
                        isBalanceShown={false}
                        isBtnMaxShown={false}
                        isInputShown={false}
                        border={{ radius: 12 }}
                        onSelectToken={this.handleSelectToken.bind(this)}
                    ></i-scom-token-input>
                    <i-label caption="to" font={{ size: "1rem" }}></i-label>
                    <i-scom-token-input
                        id="tokenOutInput"
                        type="combobox"
                        isBalanceShown={false}
                        isBtnMaxShown={false}
                        isInputShown={false}
                        border={{ radius: 12 }}
                        onSelectToken={this.handleSelectToken.bind(this)}
                    ></i-scom-token-input>
                </i-hstack>
                <i-vstack id="pnlAdditional" gap="1rem" visible={false}>
                    <i-label caption="Select Offer Index"></i-label>
                    <i-hstack width="50%" verticalAlignment="center">
                        <i-combo-box id="comboOfferIndex" height={43} items={[]}></i-combo-box>
                    </i-hstack>
                </i-vstack>
                <i-hstack horizontalAlignment="center">
                    <i-button
                        id="btnStart"
                        caption="Start"
                        padding={{ top: '0.25rem', bottom: '0.25rem', left: '0.75rem', right: '0.75rem' }}
                        font={{ color: Theme.colors.primary.contrastText, size: '1.5rem' }}
                        onClick={this.handleClickStart.bind(this)}
                    ></i-button>
                </i-hstack>
                <i-scom-wallet-modal id="mdWallet" wallets={[]}></i-scom-wallet-modal>
            </i-vstack>
        )
    }
}