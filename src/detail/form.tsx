import { moment, Control, Module, Label, Input, ControlElement, customElements, Panel, Button, Datepicker, VStack, Modal, Container, Styles } from '@ijstech/components';
import { BigNumber, Wallet } from '@ijstech/eth-wallet';
import { State, fallbackUrl } from '../store/index';
import { getQueueStakeToken, convertWhitelistedAddresses, Stage, OfferState, Action } from '../liquidity-utils';
import { limitInputNumber, renderBalanceTooltip, limitDecimals, IAllocation } from '../global/index';
import { ManageWhitelist } from './whitelist';
import Assets from '../assets';
import ScomTokenInput from '@scom/scom-token-input';
import { ITokenObject, assets as tokenAssets } from '@scom/scom-token-list';
const Theme = Styles.Theme.ThemeVars;

interface LiquidityFormElememt extends ControlElement {
  onCogClick?: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['liquidity-form']: LiquidityFormElememt;
    }
  }
};

let statusList = [
  OfferState.Everyone,
  OfferState.Whitelist
]

@customElements('liquidity-form')
export class LiquidityForm extends Module {
  private _state: State;
  private offerToDropdown: Button;
  private offerToModal: Modal;
  private pnlForm: Panel;
  private firstInput: Input;
  private secondInput: Input;
  private firstTokenInput: ScomTokenInput;
  private secondTokenInput: ScomTokenInput;
  private headerSection: Panel;
  private secondTokenPanel: Panel;
  private datePanel: Panel;
  private startDateContainer: VStack;
  private endDateContainer: VStack;
  private inputStartDate: Datepicker;
  private inputEndDate: Datepicker;
  private btnAddress: Button;
  private lbAddress: Label;
  private statusPanel: Panel;
  private addressPanel: Panel;
  private lbWillGet: Label;
  private lbFee: Label;
  private lbGovBalance: Label;
  private approveAllowancePanel: Panel;
  private nextBtn1: Button;
  private nextBtn2: Button;
  private nextBtn3: Button;
  private nextBtn4: Button;
  private nextBtn5: Button;
  private submitBtn: Button;
  private progress1: Label;
  private progress2: Label;
  private manageWhitelist: ManageWhitelist;
  private addresses: IAllocation[] = [];
  private confirmationModal: Modal;
  private lbOfferPrice1: Label;
  private lbOfferPrice2: Label;
  private isReverse: boolean = false;

  private oswapToken: ITokenObject | null;
  private offerTo: OfferState;
  private _model: any;
  private _actionType: number;
  private _isFlow: boolean;
  private currentFocus?: Element;
  updateHelpContent: () => void;
  updateSummary: () => void;
  onFieldChanged: (state: Stage) => void;
  onFocusChanged: (state: Stage) => void;
  public onCogClick: () => void;

  constructor(parent?: Container, options?: any) {
    super(parent, options);
  }

  set state(value: State) {
    this._state = value;
  }

  get state() {
    return this._state;
  }

  get model() {
    return this._model;
  }

  set model(value: any) {
    this._model = value;
    this._model.setOnApproving(this.onApproving);
    this._model.setOnApproved(this.onApproved);
    this.setData();
    this.renderUI();
  }

  get actionType(): number {
    return this._actionType;
  }

  set actionType(value: number) {
    this._actionType = value;
  }

  get isFlow(): boolean {
    return this._isFlow;
  }

  set isFlow(value: boolean) {
    this._isFlow = value;
  }

  get isCreate() {
    return this.actionType === Action.CREATE;
  }

  get isAdd() {
    return this.actionType === Action.ADD;
  }

  get isRemove() {
    return this.actionType === Action.REMOVE;
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
    return this.currentStage === Stage.SET_AMOUNT;
  }

  get isOfferPriceStage() {
    return this.currentStage === Stage.SET_OFFER_PRICE;
  }

  get isStartDateStage() {
    return this.currentStage === Stage.SET_START_DATE;
  }

  get isEndDateStage() {
    return this.currentStage === Stage.SET_END_DATE;
  }

  get isOfferToStage() {
    return this.currentStage === Stage.SET_OFFER_TO;
  }

  get isAddressStage() {
    return this.currentStage === Stage.SET_ADDRESS;
  }

  get isOfferPriceDisabled() {
    return this.isCreate && this.currentStage < Stage.SET_OFFER_PRICE;
  };

  get isStartDateDisabled() {
    return this.isCreate && this.currentStage < Stage.SET_START_DATE;
  };

  get isEndDateDisabled() {
    return this.isCreate && this.currentStage < Stage.SET_END_DATE && (!this.model.startDate() || (this.model.startDate() && this.currentStage !== Stage.SET_START_DATE));
  };

  get isOfferToDisabled() {
    return this.currentStage < Stage.SET_OFFER_TO;
  };

  get isLockDisabled() {
    return this.isCreate && this.currentStage < Stage.SET_LOCKED;
  };

  get isAddressDisabled() {
    return this.isCreate && this.currentStage < Stage.SET_ADDRESS || this.isLockDisabled;
  };

  get isAddressShown() {
    return this.model.offerTo() === OfferState.Whitelist;
  };

  get isProceedButtonDisabled() {
    return this.model.isProceedButtonDisabled();
  }

  get isSubmitButtonDisabled() {
    if (!this.state.isRpcWalletConnected()) return false;
    if (this.isCreate) {
      return this.isProceedButtonDisabled ||
        !(this.currentStage === Stage.SUBMIT || this.currentStage === Stage.FIRST_TOKEN_APPROVAL || this.currentStage === Stage.GOV_TOKEN_APPROVAL) ||
        (new BigNumber(this.model.fee()).gt(this.model.govTokenBalance()));
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
  };

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
    return this.oswapToken && this.oswapToken.address ? tokenAssets.tokenPath(this.oswapToken, this.chainId) : '';
  }

  get oswapSymbol() {
    return this.oswapToken && this.oswapToken.address ? this.state.tokenSymbol(this.chainId, this.oswapToken.address) : this.oswapToken.symbol ?? '';
  }

  onUpdateHelpContent = () => {
    if (this.updateHelpContent) this.updateHelpContent();
  }

  onUpdateSummary = async () => {
    if (this.updateSummary) await this.updateSummary();
    if (this.onFieldChanged) this.onFieldChanged(this.currentStage);
  }

  onSubmitBtnStatus = (isLoading: boolean, isApproval?: boolean) => {
    this.submitBtn.rightIcon.visible = isLoading;
    this.secondTokenPanel.enabled = !isLoading;
    this.secondInput.enabled = !isLoading
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
  }

  onSetMaxBalance = () => {
    this.model.setCurrentStage(Stage.SET_AMOUNT);
    this.setBorder(this.firstTokenInput);
    this.model.setMaxBalanceToFromToken();
    this.firstInput.value = this.fromTokenInputText;
    this.onUpdateSummary();
    this.handleTokenInputState();
  }

  updateSummaryField = () => {
    this.onUpdateHelpContent();
    if (this.onFocusChanged) this.onFocusChanged(this.currentStage);
  }

  showConfirmation = () => {
    this.confirmationModal.visible = true;
  }

  hideConfirmation = () => {
    this.confirmationModal.visible = false;
  }

  onSubmit = () => {
    this.hideConfirmation();
    this.model.proceed();
  }

  preProceed = async (source: Control, stage: Stage) => {
    this.model.setCurrentStage(stage);
    this.onProceed(source);
  }

  onProceed = async (source: Control) => {
    if (!this.state.isRpcWalletConnected()) {
      const clientWallet = Wallet.getClientInstance();
      await clientWallet.switchNetwork(this.state.getChainId());
      return;
    }
    if (this.isCreate && this.currentStage === Stage.SUBMIT) {
      this.showConfirmation();
    } else {
      await this.model.proceed();
    }
    if (this.isCreate) {
      if (this.offerTo === OfferState.Whitelist && ["submitBtn", "nextBtn5"].includes(source.id)) {
        this.removeBorder();
        if (source.id === "nextBtn5") {
          this.updateProgress();
        }
        this.updateSummaryField();
      } else if (this.offerTo === OfferState.Everyone && ["submitBtn", "nextBtn4"].includes(source.id)) {
        this.removeBorder();
        if (source.id === "nextBtn4") {
          this.updateProgress();
        }
        this.updateSummaryField();
      } else {
        this.setBorder(source);
      }
    } else if (["submitBtn", "nextBtn4"].includes(source.id)) {
      this.removeBorder();
      if (source.id === "nextBtn4") {
        this.updateProgress();
      }
      this.updateSummaryField();
    } else {
      this.setBorder(source);
    }
    this.handleTokenInputState();
  }

  private handleNext1() {
    this.onProceed(this.secondInput);
  }

  private handleNext2() {
    this.onProceed(this.inputStartDate);
  }

  private handleNext3() {
    this.preProceed(this.offerToDropdown, Stage.SET_END_DATE);
  }

  private handleNext4() {
    this.onProceed(this.isAddressShown ? this.btnAddress : this.nextBtn4);
  }

  handleTokenInputState = () => {
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
  }

  handleBtnState = () => {
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
  }

  handleChangeOfferTo = (value: OfferState) => {
    this.offerToModal.visible = false;
    if (value === this.offerTo) return;
    this.offerTo = value;
    this.offerToDropdown.caption = value;
    this.model.offerToChange(value);
    this.handleBtnState();
    this.addressPanel.visible = this.isAddressShown;
    this.updateTextValues();
    this.onUpdateSummary();
  }

  handleFocusInput = (source: Control, stage: Stage) => {
    this.model.setCurrentStage(stage);
    this.setBorder(source);
    this.handleTokenInputState();
    this.updateProgress();
  }

  handleFirstFocusInput(source: Control) {
    this.handleFocusInput(source, Stage.SET_AMOUNT);
  }

  handleSecondFocusInput(source: Control) {
    this.handleFocusInput(source, Stage.SET_OFFER_PRICE);
  }

  setBorder(source: Control) {
    this.removeBorder();
    this.onUpdateHelpContent();
    const focusItem = source.closest('i-hstack.input--token-box');
    if (focusItem) {
      focusItem.classList.add("bordered");
      this.currentFocus = focusItem;
      if (this.onFocusChanged) this.onFocusChanged(this.currentStage);
    }
  }

  removeBorder() {
    if (this.currentFocus) {
      this.currentFocus.classList.remove("bordered");
    }
  }

  async fromTokenInputTextChange() {
    limitInputNumber(this.firstInput, this.fromTokenDecimals);
    await this.model.fromTokenInputTextChange(this.firstInput.value || '');
    this.updateTextValues();
    this.handleBtnState();
    this.onUpdateSummary();
  }

  changeOfferPrice() {
    const decimals = this.isReverse ? this.fromTokenDecimals : this.offerTokenDecimals;
    limitInputNumber(this.secondInput, decimals || 18);
    const val = this.isReverse && Number(this.secondInput.value) > 0 ? new BigNumber(1).dividedBy(this.secondInput.value) : new BigNumber(this.secondInput.value || 0);
    const offerPrice = limitDecimals(val.toFixed(), decimals || 18);
    this.model.offerPriceInputTextChange(offerPrice || '0');
    this.updateTextValues();
    this.handleBtnState();
    this.onUpdateSummary();
  };

  changeStartDate = (value: any) => {
    this.model.startDateChange(value);
    const inputEndDate = this.inputEndDate.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    if (inputEndDate) {
      const date = moment(value, 'DD/MM/YYYY HH:mm');
      const val = date;
      inputEndDate.min = val.format('YYYY-MM-DD HH:mm');
    }
    if (this.isCreate) {
      this.onUpdateSummary();
    }
  };

  changeEndDate = (value: any) => {
    this.model.endDateChange(value);
    const inputStartDate = this.inputStartDate.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    if (inputStartDate) {
      const date = moment(value, 'DD/MM/YYYY HH:mm');
      const val = date;
      inputStartDate.max = val.format('YYYY-MM-DD HH:mm');
    }
    this.handleBtnState();
    this.onUpdateSummary();
  };

  setAttrDatePicker = () => {
    if (!this.isCreate) return;
    this.inputStartDate.onChanged = (datepickerElm: any) => this.changeStartDate(datepickerElm.inputElm.value);
    this.inputEndDate.onChanged = (datepickerElm: any) => this.changeEndDate(datepickerElm.inputElm.value);
    const minDate = moment().format('YYYY-MM-DDTHH:mm');
    const maxDate = moment().add(this.model.summaryData().maxDur, 'seconds').format('YYYY-MM-DDTHH:mm');
    const startTextElm = this.inputStartDate.querySelector('input[type="text"]') as HTMLInputElement;
    const startDateElm = this.inputStartDate.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    const endTextElm = this.inputEndDate.querySelector('input[type="text"]') as HTMLInputElement;
    const endDateElm = this.inputEndDate.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    if (startDateElm) {
      startDateElm.min = minDate;
      startDateElm.max = maxDate;
      startDateElm.onfocus = (e: any) => {
        this.handleFocusInput(e.target, Stage.SET_START_DATE)
      }
      startDateElm.onchange = (e: any) => {
        this.model.setCurrentStage(Stage.SET_START_DATE);
        this.onProceed(this.inputEndDate);
      }
    }
    if (startTextElm) {
      startTextElm.placeholder = 'dd/mm/yyyy hh:mm';
      startTextElm.onfocus = (e: any) => {
        this.handleFocusInput(e.target, Stage.SET_START_DATE)
      }
    }
    if (endDateElm) {
      endDateElm.min = minDate;
      endDateElm.max = maxDate;
      endDateElm.onfocus = (e: any) => {
        this.handleFocusInput(e.target, Stage.SET_END_DATE)
      }
    }
    if (endTextElm) {
      endTextElm.placeholder = 'dd/mm/yyyy hh:mm';
      endTextElm.onfocus = (e: any) => {
        this.handleFocusInput(e.target, Stage.SET_END_DATE)
      }
    }
  }

  updateTextValues = () => {
    if (!(this.isCreate || this.isAdd)) return;
    const tokenMap = this.state.getTokenMapByChainId(this.chainId);
    this.lbWillGet.caption = renderBalanceTooltip({ value: this.newAmount.multipliedBy(this.offerPriceText || 0).toNumber(), symbol: this.state.tokenSymbol(this.chainId, this.toTokenAddress) }, tokenMap);
    this.lbFee.caption = renderBalanceTooltip({ value: this.fee, symbol: this.oswapSymbol }, tokenMap);
  }

  setData = () => {
    this.oswapToken = getQueueStakeToken(this.chainId) || null;
    this.offerTo = this.model.offerTo();
    if (this.model.addresses()) {
      this.addresses = this.model.addresses().map((v: IAllocation) => {
        return {
          ...v,
          isOld: true,
          oldAllocation: v.allocation,
        }
      });
      this.model.addressChange(this.addresses);
    }
  }

  getAddress = (data: any) => {
    this.addresses = data.addresses;
    this.model.addressChange(this.addresses);
    if (this.isCreate) {
      this.model.feeChange(data.fee.plus(this.pairCustomParams.feePerOrder).toFixed());
    } else {
      this.model.feeChange(data.fee.toFixed());
      this.handleBtnState();
    }
    this.lbAddress.caption = this.addressText;
    this.btnAddress.caption = this.btnAddressText;
    this.onUpdateSummary();
    this.updateTextValues();
  };

  showWhitelistModal = () => {
    this.handleFocusInput(this.btnAddress, Stage.SET_ADDRESS);
    this.updateSummaryField();
    if (this.manageWhitelist) {
      this.manageWhitelist.props = {
        tokenSymbol: this.state.tokenSymbol(this.chainId, this.fromTokenAddress),
        decimals: this.fromTokenDecimals,
        addresses: this.addresses,
        balance: this.model.govTokenBalance(),
        pairCustomParams: this.pairCustomParams,
      }
      this.manageWhitelist.convertWhitelistedAddresses = convertWhitelistedAddresses
      if (!this.manageWhitelist.updateAddress) {
        this.manageWhitelist.updateAddress = (data: any) => this.getAddress(data);
      }
      this.manageWhitelist.showModal();
    }
  }

  onOfferTo(source: Control) {
    this.offerToModal.width = +this.offerToDropdown.width + 34;
    this.offerToModal.visible = !this.offerToModal.visible;
    this.handleFocusInput(source, Stage.SET_OFFER_TO);
  }

  private onSwitchPrice = () => {
    this.isReverse = !this.isReverse;
    const token = this.isReverse ? this.model.fromTokenObject() : this.model.toTokenObject()
    this.secondTokenInput.token = token;
    const firstSymbol = this.state.tokenSymbol(this.chainId, this.fromTokenAddress);
    const secondSymbol = this.state.tokenSymbol(this.chainId, this.toTokenAddress);
    this.lbOfferPrice1.caption = `(${this.isReverse ? firstSymbol : secondSymbol}`;
    this.lbOfferPrice2.caption = `${this.isReverse ? secondSymbol : firstSymbol})`;
    if (Number(this.secondInput.value) > 0) {
      this.changeOfferPrice();
    }
  }

  renderHeader = () => {
    this.headerSection.innerHTML = '';
    const fromToken = this.model.fromTokenObject();
    const toToken = this.model.toTokenObject();
    const iconCog = !this.isFlow ?
      <i-icon class="pointer" name="cog" width={20} height={20} fill={Theme.text.primary} margin={{ left: 'auto' }} onClick={this.handleCogClick.bind(this)}></i-icon> :
      [];
    const elm = (
      <i-hstack verticalAlignment="center">
        <i-image width="20px" class="inline-block" url={fromToken?.logoURI || tokenAssets.tokenPath(fromToken, this.chainId)} fallbackUrl={fallbackUrl} />
        <i-image width="20px" class="icon-right inline-block" url={toToken?.logoURI || tokenAssets.tokenPath(toToken, this.chainId)} fallbackUrl={fallbackUrl} />
        <i-label caption={this.state.tokenSymbol(this.chainId, this.fromTokenAddress)} class="small-label" margin={{ right: 8 }} />
        <i-icon name="arrow-right" width="16" height="16" fill={Theme.text.primary} margin={{ right: 8 }} />
        <i-label caption={this.state.tokenSymbol(this.chainId, this.toTokenAddress)} class="small-label" />
        {iconCog}
      </i-hstack>
    )
    this.headerSection.appendChild(elm);
  }

  handleCogClick() {
    if (this.onCogClick) this.onCogClick();
  }

  renderUI = async () => {
    this.pnlForm.clearInnerHTML();
    this.currentFocus = undefined;
    const tokenMap = this.state.getTokenMapByChainId(this.chainId);
    if (this.isCreate) {
      this.inputStartDate = await Datepicker.create({ type: 'dateTime', enabled: !this.isStartDateDisabled, width: '100%', height: '60px' });
      this.inputStartDate.classList.add('custom-datepicker');
      if (this.model.startDate && this.model.startDate()) {
        this.inputStartDate.value = this.model.startDate();
      }
      this.inputEndDate = await Datepicker.create({ type: 'dateTime', enabled: !this.isEndDateDisabled, width: '100%', height: '60px' });
      this.inputEndDate.classList.add('custom-datepicker');
      if (this.model.endDate && this.model.endDate()) {
        this.inputEndDate.value = this.model.endDate();
      }
    }
    const fromToken = this.model.fromTokenObject();
    let newElm = (
      <i-panel>
        <i-panel class="token-box">
          <i-vstack class="input--token-container">
            <i-hstack horizontalAlignment="space-between" verticalAlignment="end" width="100%">
              <i-vstack width="50%">
                <i-label caption="You Are Selling" font={{ bold: true }} />
              </i-vstack>
              <i-vstack width="50%" horizontalAlignment="end">
                <i-label class="text-right" opacity={0.8} margin={{ left: 'auto' }} caption={renderBalanceTooltip({ title: 'Balance', value: this.model.fromTokenBalance() }, tokenMap)} />
              </i-vstack>
            </i-hstack>
            <i-panel class="bg-box" width="100%">
              <i-hstack class="input--token-box" verticalAlignment="center" horizontalAlignment="space-between" width="100%">
                <i-vstack width="calc(100% - 160px)" height={48}>
                  <i-input
                    id="firstInput"
                    value={this.fromTokenInputText}
                    inputType="number"
                    placeholder="0.0"
                    margin={{ right: 4 }}
                    class="token-input w-100"
                    width="100%"
                    onChanged={this.fromTokenInputTextChange.bind(this)}
                    onFocus={this.handleFirstFocusInput.bind(this)}
                  />
                </i-vstack>
                <i-vstack maxWidth="155px">
                  <i-scom-token-input
                    id="firstTokenInput"
                    class="float-right"
                    width="100%"
                    background={{ color: Theme.input.background }}
                    tokenReadOnly={true}
                    isInputShown={false}
                    isBalanceShown={false}
                  />
                </i-vstack>
              </i-hstack>
            </i-panel>
          </i-vstack>
          <i-button
            id="nextBtn1"
            class="btn-os btn-next"
            visible={this.isCreate && this.isSetOrderAmountStage}
            caption={this.nextButtonText}
            onClick={this.handleNext1.bind(this)}
            enabled={!this.isProceedButtonDisabled}
          />
        </i-panel>
        {
          this.isCreate ? (
            <i-panel id="secondTokenPanel" class="token-box" enabled={!this.isOfferPriceDisabled}>
              <i-vstack class="input--token-container" >
                <i-hstack class="balance-info" horizontalAlignment="space-between" verticalAlignment="center" width="100%">
                  <i-hstack gap={4} verticalAlignment="center">
                    <i-label font={{ bold: true }} caption="Offer Price" />
                    <i-label id="lbOfferPrice1" font={{ bold: true }} caption={`(${this.state.tokenSymbol(this.chainId, this.toTokenAddress)}`} />
                    <i-icon name="arrow-right" width="16" height="16" fill={Theme.text.primary} />
                    <i-label id="lbOfferPrice2" font={{ bold: true }} caption={`${this.state.tokenSymbol(this.chainId, this.fromTokenAddress)})`} />
                  </i-hstack>
                  <i-icon tooltip={{ content: 'Switch Price' }} width={32} height={32} class="toggle-icon" name="arrows-alt-v" fill={Theme.input.fontColor} background={{ color: Theme.input.background }} onClick={this.onSwitchPrice} />
                </i-hstack>
                <i-panel class="bg-box" width="100%">
                  <i-hstack class={`input--token-box ${this.isOfferPriceStage && 'bordered'}`} verticalAlignment="center" horizontalAlignment="space-between" width="100%">
                    <i-vstack width="calc(100% - 160px)" height={48}>
                      <i-input
                        id="secondInput"
                        value={this.offerPriceText}
                        inputType="number"
                        placeholder="0.0"
                        margin={{ right: 4 }}
                        class="token-input w-100"
                        width="100%"
                        enabled={!this.isOfferPriceDisabled}
                        onChanged={this.changeOfferPrice.bind(this)}
                        onFocus={this.handleSecondFocusInput.bind(this)}
                      />
                    </i-vstack>
                    <i-vstack maxWidth="155px">
                      <i-scom-token-input
                        class="float-right"
                        width="100%"
                        id="secondTokenInput"
                        background={{ color: 'transparent' }}
                        tokenReadOnly={true}
                        isInputShown={false}
                        isBtnMaxShown={false}
                        isBalanceShown={false}
                      />
                    </i-vstack>
                  </i-hstack>
                </i-panel>
              </i-vstack>
              <i-button
                id="nextBtn2"
                class="btn-os btn-next"
                visible={this.isOfferPriceStage}
                caption={this.nextButtonText}
                onClick={this.handleNext2.bind(this)}
                enabled={!this.isProceedButtonDisabled}
              />
            </i-panel>) : []
        }
        {
          this.isCreate ? (
            <i-panel id="datePanel" class="token-box">
              <i-hstack gap="10px">
                <i-vstack id="startDateContainer" enabled={!this.isStartDateDisabled} class="input--token-container" >
                  <i-hstack horizontalAlignment="space-between" verticalAlignment="center" width="100%">
                    <i-label font={{ bold: true }} caption="Start Date" />
                  </i-hstack>
                  <i-panel class="bg-box" width="100%">
                    <i-hstack class="input--token-box" verticalAlignment="center" width="100%">
                      <i-vstack width="100%">
                        {this.inputStartDate}
                      </i-vstack>
                    </i-hstack>
                  </i-panel>
                </i-vstack>
                <i-vstack id="endDateContainer" enabled={!this.isEndDateDisabled} class="input--token-container">
                  <i-hstack horizontalAlignment="space-between" verticalAlignment="center" width="100%">
                    <i-label font={{ bold: true }} caption="End Date" />
                  </i-hstack>
                  <i-panel class="bg-box" width="100%">
                    <i-hstack class="input--token-box" verticalAlignment="center" width="100%">
                      <i-vstack width="100%">
                        {this.inputEndDate}
                      </i-vstack>
                    </i-hstack>
                  </i-panel>
                </i-vstack>
              </i-hstack>
              <i-button
                id="nextBtn3"
                class="btn-os btn-next"
                visible={this.isStartDateStage || this.isEndDateStage}
                caption={this.nextButtonText}
                onClick={this.handleNext3.bind(this)}
                enabled={!this.isProceedButtonDisabled}
              />
            </i-panel>) : []
        }
        {
          this.isCreate ? (
            <i-panel id="statusPanel" class="token-box" enabled={!this.isOfferToDisabled}>
              <i-vstack class="input--token-container">
                <i-label caption="Offer To" font={{ bold: true }} />
                <i-panel class="bg-box" width="100%">
                  <i-hstack class="input--token-box" height={60} padding={{ left: 0, right: 0 }} verticalAlignment="center" width="100%">
                    <i-panel class="btn-dropdown">
                      <i-button
                        id="offerToDropdown"
                        width="calc(100% - 1px)"
                        enabled={!this.isOfferToDisabled}
                        caption={this.offerTo}
                        onClick={this.onOfferTo.bind(this)}
                      ></i-button>
                      <i-modal
                        id="offerToModal"
                        showBackdrop={false}
                        height='auto'
                        popupPlacement='bottom'
                      >
                        <i-panel>
                          {
                            statusList.map((status: OfferState) =>
                              <i-button
                                caption={status}
                                onClick={() => this.handleChangeOfferTo(status)}
                              />
                            )
                          }
                        </i-panel>
                      </i-modal>
                    </i-panel>
                  </i-hstack>
                </i-panel>
              </i-vstack>
              <i-button
                id="nextBtn4"
                class="btn-os btn-next"
                visible={this.isOfferToStage}
                caption={this.nextButtonText}
                onClick={this.handleNext4.bind(this)}
                enabled={!this.isProceedButtonDisabled}
              />
            </i-panel>) : []
        }
        {
          !this.isRemove ? (
            <i-panel id="addressPanel" class="token-box" visible={this.isAddressShown} enabled={!this.isAddressDisabled}>
              <i-vstack class="input--token-container">
                <i-hstack verticalAlignment="center">
                  <i-label caption="Whitelist Address" margin={{ right: 4 }} font={{ bold: true }} />
                  <i-icon name="question-circle" width={15} height={15}
                    tooltip={{
                      content: 'Only whitelisted address(es) are allowed to buy the tokens at your offer price.'
                    }}
                    class="custom-question-icon"
                  />
                </i-hstack>
                <i-hstack width="100%" horizontalAlignment="space-between" verticalAlignment="center">
                  <i-label id="lbAddress" font={{ bold: true }} caption={this.addressText} />
                  <i-button id="btnAddress" class="btn-os btn-address" enabled={!this.isAddressDisabled} caption={this.btnAddressText} onClick={this.showWhitelistModal} />
                </i-hstack>
              </i-vstack>
              <i-button
                id="nextBtn5"
                class="btn-os btn-next"
                visible={this.isAddressStage}
                caption={this.nextButtonText}
                onClick={this.onProceed}
                enabled={!this.isProceedButtonDisabled}
              />
            </i-panel>) : []
        }
        {
          this.isCreate || this.isAdd ? (
            <i-panel class="token-box">
              <i-vstack class="input--token-container">
                <i-hstack verticalAlignment="center" horizontalAlignment="space-between">
                  <i-label caption="You will get" />
                  <i-hstack verticalAlignment="center">
                    <i-label caption="OSWAP Fee" margin={{ right: 4 }} />
                    <i-icon name="question-circle" width={15} height={15}
                      tooltip={{
                        content: 'The OSWAP fee is calculated by a fixed offer fee + whitelist address fee * no. of whitelisted addresses'
                      }}
                    />
                  </i-hstack>
                </i-hstack>
                <i-hstack width="100%" horizontalAlignment="space-between">
                  <i-label id="lbWillGet" font={{ bold: true }} />
                  <i-label id="lbFee" font={{ bold: true }} />
                </i-hstack>
                <i-hstack horizontalAlignment="end">
                  <i-label id="lbGovBalance" opacity={0.8} margin={{ left: 'auto' }} caption={renderBalanceTooltip({ title: 'Balance', value: this.model.govTokenBalance() }, tokenMap)} />
                </i-hstack>
              </i-vstack>
            </i-panel>) : []
        }
        {
          this.isCreate ? (
            <i-panel id="approveAllowancePanel" class="token-box">
              <i-vstack class="input--token-container">
                <i-label caption="Approve Allowance" font={{ bold: true }} />
                <i-panel class="bg-box" width="100%">
                  <i-hstack class="input--token-box" verticalAlignment="center" horizontalAlignment="center" width="100%" gap="15px" height={60}>
                    <i-label caption={this.state.tokenSymbol(this.chainId, this.fromTokenAddress)} font={{ bold: true }} />
                    <i-image url={fromToken?.logoURI || tokenAssets.tokenPath(fromToken, this.chainId)} fallbackUrl={fallbackUrl} width="30" class="inline-block" />
                    <i-label caption="-" class="inline-block" margin={{ right: 8, left: 8 }} font={{ bold: true }} />
                    <i-image url={this.oswapIcon} width="30" class="inline-block" />
                    <i-label caption={this.oswapSymbol} font={{ bold: true }} />
                  </i-hstack>
                </i-panel>
              </i-vstack>
            </i-panel>) : []
        }
        {this.isCreate ? this.renderProgress() : []}
        <i-button
          id="submitBtn"
          class="btn-os btn-next"
          caption={this.proceedButtonText}
          enabled={!this.isSubmitButtonDisabled}
          rightIcon={{ spin: true, visible: false }}
          onClick={this.onProceed}
        />
        {!this.isRemove ? <manage-whitelist id="manageWhitelist" /> : []}
      </i-panel>
    )
    if (this.firstTokenInput) this.firstTokenInput.chainId = this.chainId;
    if (this.secondTokenInput) this.secondTokenInput.chainId = this.chainId;
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
  }

  renderProgress = () => {
    return (
      <i-hstack verticalAlignment="center" horizontalAlignment="center" width="100%">
        <i-label id="progress1" caption="1" class="progress-number" />
        <i-hstack height={2} width="100px" background={{ color: Theme.text.primary }}></i-hstack>
        <i-label id="progress2" caption="2" class="progress-number" />
      </i-hstack>
    )
  }

  updateProgress = () => {
    if (this.progress1 && this.progress2) {
      if (this.model.isFirstTokenApproved()) {
        this.progress1.caption = "";
        this.progress1.classList.add("progress-complete");
        this.progress1.classList.remove("progress-number");
      } else {
        this.progress1.caption = "1";
        this.progress1.classList.add("progress-number");
        this.progress1.classList.remove("progress-complete");
      }
      if (this.model.isGovTokenApproved()) {
        this.progress2.caption = "";
        this.progress2.classList.add("progress-complete");
        this.progress2.classList.remove("progress-number");
      } else {
        this.progress2.caption = "2";
        this.progress2.classList.add("progress-number");
        this.progress2.classList.remove("progress-complete");
      }
    }
  }

  onApproving = () => {
    this.submitBtn.rightIcon.visible = true
  }

  onApproved = () => {
    this.submitBtn.rightIcon.visible = false;
    this.submitBtn.enabled = !this.isSubmitButtonDisabled;
    this.submitBtn.caption = this.proceedButtonText;
    this.updateProgress();
  }

  render() {
    return (
      <i-panel class="detail-col">
        <i-panel class="detail-col_header" id="headerSection" />
        <i-panel id="pnlForm" />

        <i-modal
          id="confirmationModal"
          class="bg-modal"
          closeIcon={{ name: 'times' }}
        >
          <i-panel class="header">
            <i-icon
              width={24}
              height={24}
              name="times"
              class="pointer"
              onClick={this.hideConfirmation}
            />
          </i-panel>
          <i-panel class="i-modal_content text-center">
            <i-hstack verticalAlignment="center" horizontalAlignment="center" margin={{ bottom: 16 }}>
              <i-image width={80} height={80} url={Assets.fullPath('img/warning-icon.png')} />
            </i-hstack>
            <i-vstack verticalAlignment="center" padding={{ left: 20, right: 20 }}>
              <i-label class="text-warning" margin={{ bottom: 16 }} caption="Please double-check and confirm that the information is accurate! Once this order is submitted, you are not allowed to edit the price, the start date, and the end date of the offer." />
              {/* <i-label class="text-warning" margin={{ bottom: 16 }} caption="1. Adding tokens into the queue or Removing tokens from the queue." />
              <i-label class="text-warning" margin={{ bottom: 16 }} caption="2. Editing the whitelist addressess and allocations of the queue if the offer is not set to Everyone." /> */}
            </i-vstack>
            <i-hstack verticalAlignment="center" horizontalAlignment="center" gap="10px" margin={{ top: 20, bottom: 10 }}>
              <i-button
                caption="Cancel"
                class="btn-os btn-cancel"
                onClick={this.hideConfirmation}
              />
              <i-button
                caption="Proceed"
                class="btn-os"
                onClick={this.onSubmit}
              />
            </i-hstack>
          </i-panel>
        </i-modal>
      </i-panel>
    )
  }
}
