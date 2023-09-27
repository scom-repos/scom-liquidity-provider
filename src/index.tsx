import { Module, Panel, Label, Container, ControlElement, customModule, customElements, HStack, application, moment, Button, Styles, Modal, Checkbox, Control, Form, IDataSchema, IUISchema } from '@ijstech/components';
import { Constants, IEventBusRegistry, Wallet } from '@ijstech/eth-wallet';
import Assets from './assets';
import {
	State,
	fallbackUrl,
	isClientWalletConnected,
	tokenSymbol
} from './store/index';
import { tokenStore, WETHByChainId, assets as tokenAssets } from '@scom/scom-token-list';
import configData from './data.json';
import { liquidityProviderComponent, liquidityProviderContainer, liquidityProviderForm, modalStyle } from './index.css';
import ScomDappContainer from '@scom/scom-dapp-container';
import ScomWalletModal, { IWalletPlugin } from '@scom/scom-wallet-modal';
import ScomTxStatusModal from '@scom/scom-tx-status-modal';
import { INetworkConfig } from '@scom/scom-network-picker';
import formSchema, { getFormSchema } from './formSchema';
import { LiquidityForm, LiquidityHelp, LiquiditySummary } from './detail/index';
import { Action, Model, Stage, getOfferIndexes, getPair, getPairInfo, isPairRegistered, lockGroupQueueOffer } from './liquidity-utils/index';
import { ILiquidityProvider, ProviderGroupQueue, registerSendTxEvents } from './global/index';
const Theme = Styles.Theme.ThemeVars;

interface ScomLiquidityProviderElement extends ControlElement, ILiquidityProvider {
	lazyLoad?: boolean;
}

declare global {
	namespace JSX {
		interface IntrinsicElements {
			['i-scom-liquidity-provider']: ScomLiquidityProviderElement;
		}
	}
}

@customModule
@customElements('i-scom-liquidity-provider')
export default class ScomLiquidityProvider extends Module {
	private state: State;
	private _data: ILiquidityProvider;
	tag: any = {};
	defaultEdit: boolean = true;

	private loadingElm: Panel;
	private txStatusModal: ScomTxStatusModal;
	private dappContainer: ScomDappContainer;
	private mdWallet: ScomWalletModal;

	private detailForm: LiquidityForm;
	private detailSummary: LiquiditySummary;
	private detailHelp: LiquidityHelp;

	private model: Model;
	private modelState: any;
	private panelLiquidity: Panel;
	private panelHome: Panel;
	private lbMsg: Label;
	private hStackActions: HStack;
	private btnAdd: Button;
	private btnRemove: Button;
	private btnLock: Button;
	private hStackSettings: HStack;
	private btnSetting: Button;
	private btnRefresh: Button;
	private btnWallet: Button;
	private hStackBack: HStack;
	private lockModal: Modal;
	private lockModalTitle: HStack;
	private firstCheckbox: Checkbox;
	private secondCheckbox: Checkbox;
	private lockOrderBtn: Button;
	private mdSettings: Modal;
	private form: Form;
	private actionType: Action = 0;
	private newOfferIndex: number = 0;
	private pairAddress: string = '';
	private liquidities: ProviderGroupQueue[] = [];

	private rpcWalletEvents: IEventBusRegistry[] = [];

	private _getActions(category?: string) {
		const actions = [];
		if (category && category !== 'offers') {
			actions.push(
				{
					name: 'Edit',
					icon: 'edit',
					command: (builder: any, userInputData: any) => {
						let oldData: ILiquidityProvider = {
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
								const {
									chainId,
									tokenIn,
									tokenOut,
									offerIndex,
									...themeSettings
								} = userInputData;

								const generalSettings = {
									chainId,
									tokenIn,
									tokenOut,
									offerIndex
								};
								if (generalSettings.chainId !== undefined) this._data.chainId = generalSettings.chainId;
								if (generalSettings.tokenIn !== undefined) this._data.tokenIn = generalSettings.tokenIn;
								if (generalSettings.tokenOut !== undefined) this._data.tokenOut = generalSettings.tokenOut;
								if (generalSettings.offerIndex !== undefined) this._data.offerIndex = generalSettings.offerIndex || 0;
								await this.resetRpcWallet();
								this.refreshUI();
								if (builder?.setData) builder.setData(this._data);

								oldTag = JSON.parse(JSON.stringify(this.tag));
								if (builder) builder.setTag(themeSettings);
								else this.setTag(themeSettings);
								if (this.dappContainer) this.dappContainer.setTag(themeSettings);
							},
							undo: async () => {
								this._data = JSON.parse(JSON.stringify(oldData));
								this.refreshUI();
								if (builder?.setData) builder.setData(this._data);

								this.tag = JSON.parse(JSON.stringify(oldTag));
								if (builder) builder.setTag(this.tag);
								else this.setTag(this.tag);
								if (this.dappContainer) this.dappContainer.setTag(userInputData);
							},
							redo: () => { }
						}
					},
					userInputDataSchema: formSchema.dataSchema,
					userInputUISchema: formSchema.uiSchema,
					customControls: formSchema.customControls(this.rpcWallet?.instanceId, this.state)
				}
			);
		}
		return actions;
	}

    private getProjectOwnerActions() {
        const actions: any[] = [
			{
				name: 'Settings',
				userInputDataSchema: formSchema.dataSchema,
				userInputUISchema: formSchema.uiSchema,
				customControls: formSchema.customControls(this.rpcWallet?.instanceId, this.state)
			}
        ];
        return actions;
    }

	getConfigurators() {
		return [
            {
                name: 'Project Owner Configurator',
                target: 'Project Owners',
                getProxySelectors: async (chainId: number) => {
                    return [];
                },
                getActions: () => {
                    return this.getProjectOwnerActions();
                },
                getData: this.getData.bind(this),
                setData: async (data: any) => {
                    await this.setData(data);
                },
                getTag: this.getTag.bind(this),
                setTag: this.setTag.bind(this)
            },
			{
				name: 'Builder Configurator',
				target: 'Builders',
				getActions: (category?: string) => {
					return this._getActions(category);
				},
				getData: this.getData.bind(this),
				setData: async (data: any) => {
					const defaultData = configData.defaultBuilderData;
					await this.setData({ ...defaultData, ...data });
				},
				getTag: this.getTag.bind(this),
				setTag: this.setTag.bind(this)
			},
            {
                name: 'Embedder Configurator',
                target: 'Embedders',
                getData: async () => {
                    return { ...this._data }
                },
                setData: async (properties: ILiquidityProvider, linkParams?: Record<string, any>) => {
                    let resultingData = {
                      ...properties
                    };
                    await this.setData(resultingData);
                },
                getTag: this.getTag.bind(this),
                setTag: this.setTag.bind(this)
            }
		]
	}

	private async getData() {
		return this._data;
	}

	private async resetRpcWallet() {
		this.removeRpcWalletEvents();
		const rpcWalletId = await this.state.initRpcWallet(this.chainId);
		const rpcWallet = this.rpcWallet;
		const chainChangedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.ChainChanged, async (chainId: number) => {
			this.newOfferIndex = 0;
			this.onChainChanged();
		});
		const connectedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.Connected, async (connected: boolean) => {
			this.newOfferIndex = 0;
			this.initializeWidgetConfig();
		});
		this.rpcWalletEvents.push(chainChangedEvent, connectedEvent);

		const data = {
			defaultChainId: this.chainId,
			wallets: this.wallets,
			networks: this.networks,
			showHeader: this.showHeader,
			rpcWalletId: rpcWallet.instanceId
		}
		if (this.dappContainer?.setData) this.dappContainer.setData(data);
	}

	private async setData(value: any) {
		this._data = value;
		await this.resetRpcWallet();
		this.newOfferIndex = 0;
		this.initializeWidgetConfig();
	}

	private async getTag() {
		return this.tag;
	}

	private updateTag(type: 'light' | 'dark', value: any) {
		this.tag[type] = this.tag[type] ?? {};
		for (let prop in value) {
			if (value.hasOwnProperty(prop))
				this.tag[type][prop] = value[prop];
		}
	}

	private async setTag(value: any) {
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

	private updateStyle(name: string, value: any) {
		value ?
			this.style.setProperty(name, value) :
			this.style.removeProperty(name);
	}

	private updateTheme() {
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

	set wallets(value: IWalletPlugin[]) {
		this._data.wallets = value;
	}

	get networks() {
		return this._data.networks ?? [];
	}

	set networks(value: INetworkConfig[]) {
		this._data.networks = value;
	}

	get showHeader() {
		return this._data.showHeader ?? true;
	}

	set showHeader(value: boolean) {
		this._data.showHeader = value;
	}

	private get chainId() {
		return this._data.chainId;
	}

	private get rpcWallet() {
		return this.state.getRpcWallet();
	}

	private get fromTokenAddress() {
		const address = this._data.tokenIn || '';
		return address.startsWith('0x') ? address.toLowerCase() : address;
	}

	private get toTokenAddress() {
		const address = this._data.tokenOut || '';
		return address.startsWith('0x') ? address.toLowerCase() : address;
	}

	private get offerIndex() {
		return this._data.offerIndex || this.newOfferIndex || 0;
	}

	private get fromTokenObject() {
		return tokenStore.getTokenMapByChainId(this.state.getChainId())[this.fromTokenAddress];
	}

	private get toTokenObject() {
		return tokenStore.getTokenMapByChainId(this.state.getChainId())[this.toTokenAddress];
	}

	constructor(parent?: Container, options?: ControlElement) {
		super(parent, options);
		this.state = new State(configData);
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

	private onChainChanged = async () => {
		this.initializeWidgetConfig();
	}

	private refreshUI = () => {
		this.newOfferIndex = 0;
		this.initializeWidgetConfig();
	}

	private initializeWidgetConfig = (hideLoading?: boolean) => {
		setTimeout(async () => {
			if (!hideLoading && this.loadingElm) {
				this.loadingElm.visible = true;
			}
			if (!isClientWalletConnected() || !this._data || !this.checkValidation()) {
				await this.renderHome();
				return;
			}
			await this.initWallet();
			const chainId = this.state.getChainId();
			const tokenA = this.fromTokenAddress.startsWith('0x') ? this.fromTokenAddress : WETHByChainId[chainId].address || this.fromTokenAddress;
			const tokenB = this.toTokenAddress.startsWith('0x') ? this.toTokenAddress : WETHByChainId[chainId].address || this.toTokenAddress;
			const isRegistered = await isPairRegistered(this.state, tokenA, tokenB);
			if (!isRegistered) {
				await this.renderHome(undefined, 'Pair is not registered, please register the pair first!');
				return;
			}
			tokenStore.updateTokenMapData(chainId);
			const rpcWallet = this.rpcWallet;
			if (rpcWallet.address) {
				await tokenStore.updateAllTokenBalances(rpcWallet);
			}
			this.pairAddress = await getPair(this.state, this.fromTokenObject, this.toTokenObject);
			if (this.offerIndex) {
				const offerIndexes = await getOfferIndexes(this.state, this.pairAddress, this.fromTokenAddress, this.toTokenAddress);
				if (offerIndexes.some(v => v.eq(this.offerIndex))) {
					await this.renderHome(this.pairAddress);
				} else {
					await this.renderForm();
				}
			} else {
				await this.renderForm();
			}
			if (!hideLoading && this.loadingElm) {
				this.loadingElm.visible = false;
			}
		})
	}

	private fetchData = async () => {
		try {
			await this.modelState.fetchData();
			this.detailSummary.fromTokenAddress = this.fromTokenAddress;
			this.detailSummary.actionType = this.actionType;
			this.detailSummary.summaryData = this.modelState.summaryData();
		} catch (err) {
			console.log(err)
		}
	}

	private renderForm = async () => {
		this.model = new Model(this.state, this.pairAddress, this.fromTokenAddress, this.offerIndex, this.actionType);
		this.model.onBack = () => this.onBack();
		this.model.onShowTxStatus = (status, content) => {
			this.showMessage(status, content);
		}
		this.model.onSubmitBtnStatus = (isLoading, isApproval, offerIndex) => {
			this.detailForm.onSubmitBtnStatus(isLoading, isApproval);
			this.hStackActions.enabled = !isLoading;
			this.hStackSettings.visible = false;
			if (offerIndex) {
				this.loadingElm.visible = true;
				this.newOfferIndex = offerIndex;
				this.renderHome(this.pairAddress);
			}
		}
		this.modelState = this.model.getState();
		this.detailForm.state = this.state;
		this.detailSummary.state = this.state;
		this.detailSummary.fetchData = this.fetchData.bind(this);
		this.detailForm.updateHelpContent = () => {
			this.detailHelp.adviceTexts = this.modelState.adviceTexts();
		}
		this.detailForm.updateSummary = async () => {
			await this.modelState.setSummaryData(true);
			this.detailSummary.summaryData = this.modelState.summaryData();
		}
		this.detailForm.onFieldChanged = (stage: Stage) => {
			this.detailSummary.updateSummaryUI(stage);
		}
		this.detailForm.onFocusChanged = (stage: Stage) => {
			this.detailSummary.onHighlight(stage);
		}
		this.detailHelp.adviceTexts = this.modelState.adviceTexts();

		try {
			await this.modelState.fetchData();
			this.detailSummary.fromTokenAddress = this.fromTokenAddress;
			this.detailSummary.actionType = this.actionType;
			this.detailSummary.summaryData = this.modelState.summaryData();
			this.panelHome.visible = false;
			this.panelLiquidity.visible = true;
			this.hStackBack.visible = this.actionType === Action.ADD || this.actionType === Action.REMOVE;
		} catch (err) {
			this.lbMsg.caption = 'Cannot fetch data!';
			this.lbMsg.visible = true;
			this.panelHome.visible = true;
			this.panelLiquidity.visible = false;
		}
		this.detailForm.actionType = this.actionType;
		this.detailForm.model = this.modelState;
	}

	private connectWallet = async () => {
		if (!isClientWalletConnected()) {
			if (this.mdWallet) {
				await application.loadPackage('@scom/scom-wallet-modal', '*');
				this.mdWallet.networks = this.networks;
				this.mdWallet.wallets = this.wallets;
				this.mdWallet.showModal();
			}
			return;
		}
		if (!this.state.isRpcWalletConnected()) {
			const chainId = this.state.getChainId();
			const clientWallet = Wallet.getClientInstance();
			await clientWallet.switchNetwork(chainId);
		}
	}

	private renderHome = async (pairAddress?: string, msg?: string) => {
		const walletConnected = isClientWalletConnected();
		const isRpcWalletConnected = this.state.isRpcWalletConnected();
		if (pairAddress) {
			this.lbMsg.visible = false;
			this.hStackActions.visible = true;
			const info: any = await getPairInfo(this.state, pairAddress, this.fromTokenAddress, this.offerIndex);
			const { startDate, expire, locked } = info;
			const expired = moment(Date.now()).isAfter(expire);
			this.btnAdd.visible = !expired;
			this.btnAdd.enabled = isRpcWalletConnected;
			this.btnRemove.enabled = isRpcWalletConnected && !(locked && !moment(startDate).isSameOrBefore());
			this.btnLock.enabled = isRpcWalletConnected && !locked;
			this.btnLock.caption = locked ? 'Locked' : 'Lock';
		} else {
			this.hStackActions.visible = false;
			this.lbMsg.caption = msg ?? (!walletConnected ? 'Please connect with your wallet' : 'Invalid configurator data');
			this.lbMsg.visible = true;
		}
		this.hStackSettings.visible = isRpcWalletConnected;
		this.btnSetting.visible = isRpcWalletConnected;
		this.btnRefresh.visible = isRpcWalletConnected && !pairAddress;
		this.btnWallet.visible = !walletConnected || !isRpcWalletConnected;
		this.btnWallet.caption = !walletConnected ? 'Connect Wallet' : 'Switch Wallet';
		this.panelHome.visible = true;
		this.panelLiquidity.visible = false;
		if (this.loadingElm) {
			this.loadingElm.visible = false;
		}
	}

	private onBack = () => {
		this.panelLiquidity.visible = false;
		this.panelHome.visible = true;
	}

	private onActions = async (action: Action) => {
		this.actionType = action;
		if (action === Action.LOCK) {
			this.showLockModal();
		} else {
			if (this.loadingElm) this.loadingElm.visible = true;
			await this.renderForm();
			if (this.loadingElm) this.loadingElm.visible = false;
		}
	}

	private showLockModal = () => {
		const chainId = this.state.getChainId();
		this.firstCheckbox.value = false;
		this.secondCheckbox.value = false;
		this.firstCheckbox.checked = false;
		this.secondCheckbox.checked = false;
		this.lockOrderBtn.enabled = false;
		this.lockModalTitle.clearInnerHTML();
		this.lockModalTitle.appendChild(
			<i-hstack gap={4} verticalAlignment="center">
				<i-image width={28} height={28} url={tokenAssets.tokenPath(this.fromTokenObject, chainId)} fallbackUrl={fallbackUrl} />
				<i-image width={28} height={28} url={tokenAssets.tokenPath(this.toTokenObject, chainId)} fallbackUrl={fallbackUrl} />
				<i-label caption={tokenSymbol(chainId, this.fromTokenAddress)} font={{ size: '24px', bold: true, color: Theme.colors.primary.main }} />
				<i-icon name="arrow-right" fill={Theme.colors.primary.main} width="14" height="14" />
				<i-label class="hightlight-yellow" caption={tokenSymbol(chainId, this.toTokenAddress)} font={{ size: '24px', bold: true, color: Theme.colors.primary.main }} />
				<i-label class="hightlight-yellow" caption={`#${this.offerIndex}`} font={{ size: '24px', bold: true, color: Theme.colors.primary.main }} />
			</i-hstack>
		)
		this.lockModal.visible = true;
	}

	private closeLockModal = () => {
		this.lockModal.visible = false;
	}

	private onChangeFirstChecked(source: Control, event: Event) {
		this.firstCheckbox.checked = (source as Checkbox).checked;
		this.lockOrderBtn.enabled = (source as Checkbox).checked && this.secondCheckbox.checked;
	}

	private onChangeSecondChecked(source: Control, event: Event) {
		this.secondCheckbox.checked = (source as Checkbox).checked;
		this.lockOrderBtn.enabled = this.firstCheckbox.checked && (source as Checkbox).checked;
	}

	private onConfirmLock = async () => {
		this.showMessage('warning', 'Confirming');
		const callback = async (err: Error, receipt?: string) => {
			if (err) {
				this.showMessage('error', err);
			} else if (receipt) {
				this.closeLockModal();
				this.showMessage('success', receipt);
				this.btnLock.enabled = false;
				this.btnLock.rightIcon.visible = true;
				this.btnLock.caption = 'Locking';
				this.btnRemove.enabled = false;
			}
		};

		const confirmationCallback = async (receipt: any) => {
			this.btnLock.rightIcon.visible = false;
			this.btnLock.caption = 'Locked';
		};

		registerSendTxEvents({
			transactionHash: callback,
			confirmation: confirmationCallback
		});

		lockGroupQueueOffer(this.chainId, this.pairAddress, this.fromTokenObject, this.toTokenObject, this.offerIndex);
	}

	private initWallet = async () => {
		try {
			await Wallet.getClientInstance().init();
			const rpcWallet = this.rpcWallet;
			await rpcWallet.init();
		} catch (err) {
			console.log(err);
		}
	}

	private showMessage = (status: 'warning' | 'success' | 'error', content?: string | Error) => {
		if (!this.txStatusModal) return;
		let params: any = { status };
		if (status === 'success') {
			params.txtHash = content;
		} else {
			params.content = content;
		}
		this.txStatusModal.message = { ...params };
		this.txStatusModal.showModal();
	}

	private checkValidation = () => {
		if (!this._data) return false;
		const { chainId, tokenIn, tokenOut } = this._data;
		if (!chainId || !tokenIn || !tokenOut) return false;
		return true;
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

	private async handleConfirmClick() {
		const data = await this.form.getFormData();
		this._data.tokenIn = data.tokenIn;
		this._data.tokenOut = data.tokenOut;
		this._data.offerIndex = data.offerIndex || 0;
		this.mdSettings.visible = false;
		this.refreshUI();
	}

	private onCogClick() {
		if (!this.form.jsonSchema) {
			const formSchema = getFormSchema();
			this.form.jsonSchema = formSchema.dataSchema as IDataSchema;
			this.form.uiSchema = formSchema.uiSchema as IUISchema;
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
				customControls: formSchema.customControls(this.rpcWallet?.instanceId, this.state)
			}
			this.form.renderForm();
			this.form.clearFormData();
			this.form.setFormData({
				chainId: this._data.chainId || this.state.getChainId(),
				tokenIn: this._data.tokenIn,
				tokenOut: this._data.tokenOut,
				offerIndex: this._data.offerIndex
			});
		}
		this.mdSettings.visible = true;
	}

	render() {
		return (
			<i-scom-dapp-container id="dappContainer" class={liquidityProviderContainer}>
				<i-panel class={liquidityProviderComponent} minHeight={200}>
					<i-panel class={liquidityProviderForm}>
						<i-panel id="queue-container">
							<i-panel>
								<i-vstack id="loadingElm" class="i-loading-overlay">
									<i-vstack class="i-loading-spinner" horizontalAlignment="center" verticalAlignment="center">
										<i-icon
											class="i-loading-spinner_icon"
											image={{ url: Assets.fullPath('img/loading.svg'), width: 36, height: 36 }}
										/>
										<i-label
											caption="Loading..." font={{ color: '#FD4A4C', size: '1.5em' }}
											class="i-loading-spinner_text"
										/>
									</i-vstack>
								</i-vstack>
								<i-panel id="panelHome" visible={false}>
									<i-vstack verticalAlignment="center" alignItems="center">
										<i-image url={Assets.fullPath('img/TrollTrooper.svg')} />
										<i-label id="lbMsg" margin={{ top: 10 }} />
										<i-hstack id="hStackActions" gap={10} margin={{ top: 10 }} verticalAlignment="center" horizontalAlignment="center" wrap="wrap">
											<i-button
												id="btnAdd"
												caption="Add"
												class="btn-os"
												minHeight={36}
												width={120}
												rightIcon={{ spin: true, visible: false }}
												onClick={() => this.onActions(Action.ADD)}
											/>
											<i-button
												id="btnRemove"
												caption="Remove"
												class="btn-os"
												minHeight={36}
												width={120}
												rightIcon={{ spin: true, visible: false }}
												onClick={() => this.onActions(Action.REMOVE)}
											/>
											<i-button
												id="btnLock"
												caption="Lock"
												class="btn-os"
												minHeight={36}
												width={120}
												rightIcon={{ spin: true, visible: false }}
												onClick={() => this.onActions(Action.LOCK)}
											/>
										</i-hstack>
										<i-hstack id="hStackSettings" gap={10} margin={{ top: 10 }} verticalAlignment="center" horizontalAlignment="center" wrap="wrap">
											<i-button
												id="btnSetting"
												class="btn-os"
												minHeight={36}
												width={240}
												maxWidth="90%"
												caption="Update Settings"
												visible={false}
												onClick={this.onCogClick.bind(this)}
											></i-button>
											<i-button
												id="btnRefresh"
												class="btn-os"
												minHeight={36}
												width={36}
												icon={{ name: 'sync', width: 18, height: 18, fill: '#fff' }}
												visible={false}
												onClick={this.refreshUI.bind(this)}
											></i-button>
										</i-hstack>
										<i-button
											id="btnWallet"
											caption="Connect Wallet"
											visible={false}
											class="btn-os"
											minHeight={36}
											maxWidth="90%"
											width={240}
											margin={{ top: 10 }}
											onClick={this.connectWallet}
										/>
									</i-vstack>
								</i-panel>
								<i-panel id="panelLiquidity">
									<i-hstack id="hStackBack" margin={{ bottom: 10 }} gap={4} verticalAlignment="center" width="fit-content" class="pointer" onClick={this.onBack}>
										<i-icon name="arrow-left" fill={Theme.colors.primary.main} width={20} height={20} />
										<i-label caption="Back" font={{ bold: true, color: Theme.colors.primary.main, size: '20px' }} lineHeight="18px" />
									</i-hstack>
									<i-hstack gap="20px" margin={{ bottom: 16 }} wrap="wrap">
										<i-panel class="custom-container">
											<liquidity-form id="detailForm" onCogClick={this.onCogClick.bind(this)} />
										</i-panel>
										<i-panel class="custom-container">
											<i-panel id="summarySection" >
												<liquidity-summary id="detailSummary" />
											</i-panel>
											<liquidity-help id="detailHelp" />
										</i-panel>
									</i-hstack>
								</i-panel>
							</i-panel>
						</i-panel>
					</i-panel>

					<i-modal id="lockModal" class="bg-modal" title="Lock the order" closeIcon={{ name: 'times' }}>
						<i-panel class="i-modal_content text-center">
							<i-hstack id="lockModalTitle" verticalAlignment="center" horizontalAlignment="center" margin={{ bottom: 16 }} />
							<i-hstack verticalAlignment="center" horizontalAlignment="center" margin={{ bottom: 16 }}>
								<i-image width={80} height={80} url={Assets.fullPath('img/warning-icon.png')} />
							</i-hstack>
							<i-vstack verticalAlignment="center" padding={{ left: 20, right: 20 }}>
								<i-label margin={{ bottom: 16 }} caption="Please confirm the bellow items before you lock the Group Queue" />
								<i-vstack verticalAlignment="center">
									<i-checkbox
										id="firstCheckbox"
										width="100%"
										caption="You understand that you cannot remove any tokens from the offer until the expiry date."
										class="pointer"
										font={{ color: Theme.colors.primary.main }}
										onChanged={this.onChangeFirstChecked}
									/>
									<i-checkbox
										id="secondCheckbox"
										width="100%"
										margin={{ top: 16 }}
										caption="You are aware that you cannot edit the whitelisted addrresses and allocations until the expiry date."
										class="pointer"
										font={{ color: Theme.colors.primary.main }}
										onChanged={this.onChangeSecondChecked}
									/>
								</i-vstack>
							</i-vstack>
							<i-hstack verticalAlignment="center" horizontalAlignment="center" gap="10px" margin={{ top: 20, bottom: 10 }}>
								<i-button
									caption="Cancel"
									class="btn-os btn-cancel"
									onClick={this.closeLockModal}
								/>
								<i-button
									id="lockOrderBtn"
									caption="Lock"
									enabled={false}
									class="btn-os"
									onClick={this.onConfirmLock}
								/>
							</i-hstack>
						</i-panel>
					</i-modal>
					<i-modal
						id="mdSettings"
						class={modalStyle}
						title="Update Settings"
						closeIcon={{ name: 'times' }}
						height='auto'
						maxWidth={640}
						closeOnBackdropClick={false}
					>
						<i-form id="form"></i-form>
					</i-modal>
					<i-scom-wallet-modal id="mdWallet" wallets={[]} />
					<i-scom-tx-status-modal id="txStatusModal" />
				</i-panel>
			</i-scom-dapp-container>
		)
	}
}
