import { Module, Panel, Label, Container, ControlElement, customModule, customElements } from '@ijstech/components';
import { Constants, IEventBusRegistry, Wallet } from '@ijstech/eth-wallet';
import Assets from './assets';
import {
	State,
	isClientWalletConnected
} from './store/index';
import { tokenStore, WETHByChainId } from '@scom/scom-token-list';
import configData from './data.json';
import { liquidityProviderComponent, liquidityProviderContainer, liquidityProviderForm } from './index.css';
import ScomDappContainer from '@scom/scom-dapp-container';
import ScomWalletModal, { IWalletPlugin } from '@scom/scom-wallet-modal';
import ScomTxStatusModal from '@scom/scom-tx-status-modal';
import { INetworkConfig } from '@scom/scom-network-picker';
import formSchema from './formSchema';
import { LiquidityForm, LiquidityHelp, LiquiditySummary } from './detail/index';
import { Model, Stage, getPair, isPairRegistered } from './liquidity-utils/index';
import { ILiquidityProvider } from './global/index';

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
	private panelMsg: Panel;
	private lbMsg: Label;

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
									...themeSettings
								} = userInputData;

								const generalSettings = {
									chainId,
									tokenIn,
									tokenOut
								};
								if (generalSettings.chainId !== undefined) this._data.chainId = generalSettings.chainId;
								if (generalSettings.tokenIn !== undefined) this._data.tokenIn = generalSettings.tokenIn;
								if (generalSettings.tokenOut !== undefined) this._data.tokenOut = generalSettings.tokenOut;
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
					customControls: formSchema.customControls(this.rpcWallet?.instanceId)
				}
			);
		}
		return actions;
	}

	getConfigurators() {
		return [
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
			this.onChainChanged();
		});
		const connectedEvent = rpcWallet.registerWalletEvent(this, Constants.RpcWalletEvent.Connected, async (connected: boolean) => {
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
		this.initializeWidgetConfig();
	}

	private initializeWidgetConfig = (hideLoading?: boolean) => {
		setTimeout(async () => {
			if (!hideLoading && this.loadingElm) {
				this.loadingElm.visible = true;
			}
			if (!isClientWalletConnected() || !this._data || !this.checkValidation()) {
				await this.renderEmpty();
				return;
			}
			await this.initWallet();
			const chainId = this.state.getChainId();
			const tokenA = this.fromTokenAddress.startsWith('0x') ? this.fromTokenAddress : WETHByChainId[chainId].address || this.fromTokenAddress;
			const tokenB = this.toTokenAddress.startsWith('0x') ? this.toTokenAddress : WETHByChainId[chainId].address || this.toTokenAddress;
			const isRegistered = await isPairRegistered(this.state, tokenA, tokenB);
			if (!isRegistered) {
				await this.renderEmpty('Pair is not registered, please register the pair first!');
				return;
			}
			tokenStore.updateTokenMapData(this.chainId);
			const rpcWallet = this.rpcWallet;
			if (rpcWallet.address) {
				await tokenStore.updateAllTokenBalances(rpcWallet);
			}
			await this.renderForm();
			if (!hideLoading && this.loadingElm) {
				this.loadingElm.visible = false;
			}
		})
	}

	private fetchData = async () => {
		try {
			this.model.getState()
			await this.modelState.fetchData();
			this.detailSummary.fromTokenAddress = this.fromTokenAddress;
			this.detailSummary.summaryData = this.modelState.summaryData();
		} catch (err) {
			console.log(err)
		}
	}

	private renderForm = async () => {
		const chainId = this.state.getChainId();
		const tokenMap = tokenStore.getTokenMapByChainId(chainId);
		const tokenA = tokenMap[this.fromTokenAddress];
		const tokenB = tokenMap[this.toTokenAddress];
		const pairAddress = await getPair(this.state, tokenA, tokenB);
		this.model = new Model(this.state, pairAddress, this.fromTokenAddress, 0);
		this.model.onShowTxStatus = (status, content) => {
			this.showMessage(status, content);
		}
		this.model.onSubmitBtnStatus = (isLoading, isApproval, isResetForm) => {
			this.detailForm.onSubmitBtnStatus(isLoading, isApproval);
			if (isResetForm) {
				this.initializeWidgetConfig();
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
			this.detailSummary.summaryData = this.modelState.summaryData();
			this.panelMsg.visible = false;
			this.lbMsg.caption = '';
			this.panelLiquidity.visible = true;
		} catch (err) {
			this.lbMsg.caption = 'Cannot fetch data!';
			this.panelMsg.visible = true;
			this.panelLiquidity.visible = false;
		}
		this.detailForm.model = this.modelState;
	}

	private renderEmpty = async (msg?: string) => {
		this.lbMsg.caption = msg ?? (!isClientWalletConnected() ? 'Please connect with your wallet' : 'Invalid configurator data');
		this.panelMsg.visible = true;
		this.panelLiquidity.visible = false;
		if (this.loadingElm) {
			this.loadingElm.visible = false;
		}
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
		const lazyLoad = this.getAttribute('lazyLoad', true, false);
		if (!lazyLoad) {
			const chainId = this.getAttribute('chainId', true);
			const tokenIn = this.getAttribute('tokenIn', true);
			const tokenOut = this.getAttribute('tokenOut', true);
			const wallets = this.getAttribute('wallets', true, []);
			const networks = this.getAttribute('networks', true, []);
			const showHeader = this.getAttribute('showHeader', true, true);
			await this.setData({ chainId, tokenIn, tokenOut, wallets, networks, showHeader });
		}
		this.isReadyCallbackQueued = false;
		this.executeReadyCallback();
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
								<i-panel id="panelMsg" visible={false}>
									<i-vstack gap={10} verticalAlignment="center" alignItems="center">
										<i-image url={Assets.fullPath('img/TrollTrooper.svg')} />
										<i-label id="lbMsg" />
									</i-vstack>
								</i-panel>
								<i-panel id="panelLiquidity">
									<i-hstack gap="20px" margin={{ bottom: 16 }} wrap="wrap">
										<i-panel class="custom-container">
											<liquidity-form id="detailForm" />
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
					<i-scom-wallet-modal id="mdWallet" wallets={[]} />
					<i-scom-tx-status-modal id="txStatusModal" />
				</i-panel>
			</i-scom-dapp-container>
		)
	}
}
