import { BigNumber, IERC20ApprovalAction } from "@ijstech/eth-wallet";
import {
  limitDecimals,
  toWeiInv,
  DefaultDateFormat,
  IAllocation
} from '../global/index';
import {
  getPairInfo,
  getToBeApprovedTokens,
  addLiquidity,
  getQueueStakeToken,
  getLiquidityProviderAddress,
  removeLiquidity,
  getOfferIndexes
} from './API';
import { State, getTokenDecimals } from '../store/index';
import { application, moment } from '@ijstech/components';
import { ITokenObject, tokenStore } from "@scom/scom-token-list";
import { Contracts } from "@scom/oswap-openswap-contract";

export enum Stage {
  NONE,
  SET_AMOUNT,
  SET_OFFER_PRICE,
  SET_START_DATE,
  SET_END_DATE,
  SET_OFFER_TO,
  SET_LOCKED,
  SET_ADDRESS,
  FIRST_TOKEN_APPROVAL,
  WAITING_FOR_FIRST_TOKEN_APPROVAL,
  GOV_TOKEN_APPROVAL,
  WAITING_FOR_GOV_TOKEN_APPROVAL,
  SUBMIT,
}

export enum Action {
  CREATE,
  ADD,
  REMOVE,
  LOCK
}

export enum OfferState {
  Everyone = 'Everyone',
  Whitelist = 'Whitelist Addresses'
}

export enum LockState {
  Locked = 'Locked',
  Unlocked = 'Unlocked'
}

let onApproving: any;
let onApproved: any;
export const setOnApproving = (callback: any) => {
  onApproving = callback
}
export const setOnApproved = (callback: any) => {
  onApproved = callback
}

export const toLastSecond = (datetime: any): any => {
  return moment(datetime).endOf('day');
}

export class Model {
  private state: State;
  private currentStage = Stage.NONE;
  private pairAddress: string;
  private offerIndex: number;
  private fromTokenAddress = '';
  private toTokenAddress = '';
  private actionType = 0;
  private pairIndex = 0;
  private isFirstLoad = true;
  private pairCustomParams: any;
  private fromTokenInput = new BigNumber(0);
  private fromTokenInputText = '';
  private offerPriceText = '';
  private offerTo = OfferState.Everyone;
  private originalFee = '0';
  private whitelistFee: string | null = null;
  private fee = '0';
  private startDate: any;
  private endDate: any;
  private switchLock = LockState.Unlocked;
  private addresses: IAllocation[] = [];

  private approvalModelAction: IERC20ApprovalAction;
  onShowTxStatus: (status: 'success' | 'warning' | 'error', content: string | Error) => void;
  onSubmitBtnStatus: (isLoading: boolean, isApproval?: boolean, offerIndex?: number) => void;
  onBack: () => void;

  private get fromTokenObject() {
    const tokenMap = tokenStore.getTokenMapByChainId(this.state.getChainId());
    return tokenMap[this.fromTokenAddress];
  }
  private get toTokenObject() {
    const tokenMap = tokenStore.getTokenMapByChainId(this.state.getChainId());
    return tokenMap[this.toTokenAddress];
  }
  private get fromTokenSymbol() {
    return this.fromTokenObject ? this.fromTokenObject.symbol : '';
  }

  private summaryData: any = {
    amount: '0',
    offerPrice: this.offerPriceText,
    offerTo: this.offerTo,
    startDate: null,
    endDate: null,
    switchLock: '',
    addresses: [] as IAllocation[],
    reserve: '0',
    maxDur: 3600 * 24 * 180, // default 3 months
  }

  private get enableApproveAllowance(): boolean {
    if (this.actionType !== Action.CREATE) return true;
    return this.fromTokenInputValid;
  }

  private get fromTokenInputValid(): boolean {
    const allowZero = [Action.CREATE, Action.ADD].some(n => n === this.actionType);
    if (allowZero && this.fromTokenInputText === '') {
      return false;
    }
    return (this.fromTokenInput.gt(0) || allowZero) && this.fromTokenInput.lte(this.fromTokenBalanceExact);
  }

  private get offerPriceInputValid(): boolean {
    return this.offerPriceText && new BigNumber(this.offerPriceText).gt(0);
  }

  private get fromTokenBalanceExact() {
    const tokenBalances = tokenStore.tokenBalances || {};
    if ([Action.CREATE, Action.ADD].some(n => n === this.actionType)) {
      return tokenBalances[this.fromTokenAddress]
        ? new BigNumber(tokenBalances[this.fromTokenAddress])
        : new BigNumber(0);
    }
    if (this.actionType === Action.REMOVE) {
      return new BigNumber(this.summaryData.amount);
    }
  }

  private get govTokenBalanceExact() {
    let stakeToken = getQueueStakeToken(this.state.getChainId());
    if (!stakeToken) return new BigNumber(0);
    const tokenBalances = tokenStore.tokenBalances || {};
    return tokenBalances[stakeToken.address!]
      ? new BigNumber(tokenBalances[stakeToken!.address!])
      : new BigNumber(0);
  }

  private get getJoinValidation() {
    switch (this.currentStage) {
      case Stage.SET_AMOUNT:
        return this.fromTokenInputValid;
      case Stage.SET_OFFER_PRICE:
        return this.offerPriceInputValid;
      case Stage.SET_START_DATE:
      case Stage.SET_END_DATE:
        return this.startDate && this.endDate &&
          this.startDate.isSameOrAfter(moment()) && this.startDate.isSameOrBefore(this.endDate) &&
          this.endDate.isSameOrBefore(moment().add(this.summaryData.maxDur, 'seconds'));
      default:
        return true;
    }
  }

  private isProceedButtonDisabled = () => {
    if (!this.state.isRpcWalletConnected()) return false;
    if (Action.CREATE === this.actionType) {
      if (!this.getJoinValidation) return true;
    } else {
      if (!this.validateEmptyInput || !this.fromTokenInputValid) return true;
      if (Action.ADD === this.actionType && this.fromTokenInput.eq(0) && this.newTotalAddress === this.summaryData.addresses.length && this.currentTotalAllocation == this.newTotalAllocation) {
        return true;
      }
    }
    if ([Stage.NONE, Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL, Stage.WAITING_FOR_GOV_TOKEN_APPROVAL].includes(this.currentStage)) {
      return true;
    }
    return false;
  }

  private get proceedButtonText() {
    if (!this.state.isRpcWalletConnected()) {
      return 'Switch Network';
    }
    const stakeToken = getQueueStakeToken(this.state.getChainId());
    if (!stakeToken) return '';
    if (this.fromTokenInput.gt(this.fromTokenBalanceExact)) {
      return `Insufficient ${this.fromTokenSymbol} balance`;
    }
    if (this.actionType === Action.CREATE && this.offerPriceText && !this.offerPriceInputValid) {
      return 'Offer Price must be greater than 0';
    }
    if (new BigNumber(this.fee).gt(this.govTokenBalanceExact)) {
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

  private get nextButtonText() {
    if (!this.state.isRpcWalletConnected()) {
      return 'Switch Network';
    }
    const stakeToken = getQueueStakeToken(this.state.getChainId());
    if (!stakeToken) return '';
    if (this.fromTokenInput.gt(this.fromTokenBalanceExact)) {
      return `Insufficient ${this.fromTokenSymbol} balance`;
    }
    if (this.offerPriceText && !this.offerPriceInputValid) {
      return 'Offer Price must be greater than 0';
    }
    if (this.startDate) {
      if (this.startDate.isBefore(moment())) {
        return 'Start time cannot be earlier than current time';
      }
      if (this.endDate && this.startDate.isAfter(this.endDate)) {
        return 'End time cannot be earlier than start time';
      }
      const maxDate = moment().add(this.summaryData.maxDur, 'seconds');
      if (this.endDate && this.endDate.isAfter(maxDate)) {
        return `End time must be same or before ${maxDate.format(DefaultDateFormat)}`;
      }
    }
    if (new BigNumber(this.fee).gt(this.govTokenBalanceExact) && this.currentStage === Stage.SUBMIT) {
      return `Insufficient ${stakeToken.symbol} balance`;
    }
    return `Next`;
  }

  private get isFirstTokenApproved() {
    return this.currentStage >= Stage.GOV_TOKEN_APPROVAL;
  }

  private get isGovTokenApproved() {
    return this.currentStage == Stage.SUBMIT;
  }

  private get isWaitingForApproval() {
    return [Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL, Stage.WAITING_FOR_GOV_TOKEN_APPROVAL].includes(this.currentStage);
  }

  private get newAmount() {
    if (this.actionType === Action.CREATE) {
      return this.fromTokenInput;
    }
    const amount = this.summaryData.amount;
    if (this.actionType === Action.ADD) {
      return new BigNumber(amount).plus(this.fromTokenInput);
    }
    if (this.actionType === Action.REMOVE) {
      return new BigNumber(amount).minus(this.fromTokenInput);
    }
    return new BigNumber(amount);
  }

  private get listAddress() {
    const newAddresses = this.addresses || [];
    const oldAddresses = this.summaryData.addresses || [];
    let list: IAllocation[] = [];
    for (const item of newAddresses.concat(oldAddresses)) {
      if (!list.find((f: IAllocation) => f.address === item.address)) {
        list.push(item);
      }
    }
    return list;
  }

  private get newTotalAddress() {
    return this.listAddress.length;
  }

  private get newTotalAllocation() {
    const totalAddress = this.listAddress.reduce((pv: number, cv: any) => pv + parseFloat(cv.allocation), 0);
    return totalAddress;
  }

  private get currentTotalAllocation() {
    const totalAddress = this.summaryData.addresses.reduce((pv: any, cv: any) => pv + parseFloat(cv.allocation), 0);
    return totalAddress;
  }

  private setCurrentStage = (stage: Stage) => {
    this.currentStage = stage;
  }

  public getState = () => {
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
      setSummaryData: (value: boolean) => this.setSummaryData({}, value),
    };
  }

  private fetchData = async () => {
    if (this.actionType === Action.CREATE) {
      const response = await getPairInfo(this.state, this.pairAddress, this.fromTokenAddress);
      this.toTokenAddress = response.toTokenAddress || '';
      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        this.fee = response.feePerOrder;
        this.originalFee = response.feePerOrder;
      }
      this.setSummaryData(response);
    } else if (this.actionType === Action.ADD) {
      const response: any = await getPairInfo(this.state, this.pairAddress, this.fromTokenAddress, this.offerIndex);
      this.toTokenAddress = response.toTokenAddress;
      if (this.isFirstLoad) {
        this.isFirstLoad = false;
        this.offerPriceText = response.offerPrice;
        this.startDate = moment(response.startDate);
        this.endDate = moment(response.expire);
        this.switchLock = response.locked ? LockState.Locked : LockState.Unlocked;
        this.offerTo = response.allowAll ? OfferState.Everyone : OfferState.Whitelist;
        this.addresses = response.addresses;
        await this.fromTokenInputTextChange('');
        await this.getNextTokenApprovalStage();
      }
      this.setSummaryData(response);
    } else {
      const response: any = await getPairInfo(this.state, this.pairAddress, this.fromTokenAddress, this.offerIndex);
      this.toTokenAddress = response.toTokenAddress;
      this.offerPriceText = response.offerPrice;
      this.startDate = moment(response.startDate);
      this.endDate = moment(response.expire);
      this.switchLock = response.locked ? LockState.Locked : LockState.Unlocked;
      this.offerTo = response.allowAll ? OfferState.Everyone : OfferState.Whitelist;
      this.addresses = response.addresses;
      this.setSummaryData(response);
    }
  };

  private setSummaryData(response: any, updateField?: boolean) {
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
      }
      this.summaryData.amount = response.amount;
      this.summaryData.newAmount = this.newAmount;
      this.summaryData.offerPrice = response.offerPrice;
      this.summaryData.newOfferPrice = this.offerPriceText;
      this.summaryData.offerTo = this.offerTo;
      this.summaryData.fee = this.fee;
      this.summaryData.startDate = moment(response.startDate);
      this.summaryData.newStartDate = this.startDate;
      this.summaryData.endDate = moment(response.expire);
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
      this.summaryData.oldExpiryDate = moment(response.expire).format('YYYY-MM-DD');
      this.summaryData.pairCustomParams = response.pairCustomParams;
      this.summaryData.maxDur = response.maxDur;
    }
  }

  private proceed = async () => {
    const stakeToken = getQueueStakeToken(this.state.getChainId());
    if (!stakeToken) return;
    if (this.actionType === Action.ADD) {
      await this.getNextTokenApprovalStage();
    } else if (this.actionType === Action.REMOVE) {
      this.currentStage = Stage.SUBMIT;
    }
    if (this.currentStage === Stage.SET_AMOUNT) {
      this.currentStage = Stage.SET_OFFER_PRICE;
    } else if (this.currentStage === Stage.SET_OFFER_PRICE) {
      this.currentStage = Stage.SET_START_DATE;
    } else if (this.currentStage === Stage.SET_START_DATE) {
      this.currentStage = Stage.SET_END_DATE;
    } else if (this.currentStage === Stage.SET_END_DATE) {
      this.currentStage = Stage.SET_OFFER_TO;
    } else if (this.currentStage === Stage.SET_OFFER_TO) {
      const isCreation = Action.CREATE === this.actionType;
      const isAddressShown = !isCreation || (isCreation && this.offerTo === OfferState.Whitelist);
      if (isAddressShown) {
        this.currentStage = Stage.SET_ADDRESS;
      } else {
        await this.getNextTokenApprovalStage();
      }
    } else if (this.currentStage === Stage.SET_ADDRESS) {
      await this.getNextTokenApprovalStage();
    } else if (this.currentStage === Stage.FIRST_TOKEN_APPROVAL) {
      await this.approveToken(this.fromTokenObject);
    } else if (this.currentStage === Stage.GOV_TOKEN_APPROVAL) {
      await this.approveToken(stakeToken);
    } else if (this.currentStage === Stage.SUBMIT) {
      this.approvalModelAction.doPayAction();
    }
  }

  private get validateEmptyInput() {
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
    } else if (this.actionType === Action.ADD) {
      if (!offerPriceCheck || !startDateCheck || !endDateCheck) {
        return false;
      }
    }
    return true;
  }

  private get fromTokenBalance() {
    return this.fromTokenBalanceExact.toNumber();
  }

  private get govTokenBalance() {
    return this.govTokenBalanceExact.toNumber();
  }

  private get fromTokenDecimals() {
    return getTokenDecimals(this.state.getChainId(), this.fromTokenAddress);
  }

  private get adviceTexts() {
    let arr = [];
    switch (this.currentStage) {
      case Stage.NONE:
        arr.push('Please edit the input field to update your queue');
        break;
      case Stage.SET_AMOUNT:
        let msg: string;
        if (this.actionType === Action.CREATE) {
          msg = `Input the total amount of ${this.fromTokenSymbol} you would like to sell.`;
        } else if (this.actionType === Action.ADD) {
          msg = 'Please input the amount of the token you wish to add to the liquidity.';
        } else {
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
        } else {
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

  constructor(state: State, pairAddress: string, fromTokenAddress: string, offerIndex: number, actionType: number) {
    this.state = state;
    this.pairAddress = pairAddress;
    this.fromTokenAddress = fromTokenAddress;
    this.offerIndex = offerIndex;
    this.actionType = actionType;
    if (this.actionType === Action.CREATE) {
      this.currentStage = Stage.SET_AMOUNT;
    } else {
      this.currentStage = Stage.NONE;
    }
    tokenStore.updateAllTokenBalances(this.state.getRpcWallet());
    this.initApprovalModelAction();
  }

  private showTxStatus(status: 'success' | 'warning' | 'error', content: string | Error) {
    if (this.onShowTxStatus) {
      this.onShowTxStatus(status, content);
    }
  }

  private setSubmitBtnStatus(isLoading: boolean, isApproval?: boolean, offerIndex?: number) {
    if (this.onSubmitBtnStatus) {
      this.onSubmitBtnStatus(isLoading, isApproval, offerIndex);
    }
  }

  async initApprovalModelAction() {
    const address = getLiquidityProviderAddress(this.state.getChainId());
    this.approvalModelAction = await this.state.setApprovalModelAction({
      sender: this,
      payAction: async () => {
        const deadline = Math.floor(Date.now() / 1000) + this.state.transactionDeadline * 60;
        if (this.actionType === Action.CREATE) {
          this.addLiquidityAction(this.endDate.unix(), deadline);
        } else if (this.actionType === Action.ADD) {
          let pair = new Contracts.OSWAP_RestrictedPair(this.state.getRpcWallet(), this.pairAddress);
          let direction = (await pair.token0()).toLowerCase() == this.toTokenAddress.toLowerCase()
          let endDatetime = (await pair.offers({ param1: direction, param2: this.offerIndex })).expire;
          this.addLiquidityAction(endDatetime.toNumber(), deadline);
        } else {
          this.removeLiquidityAction(deadline, false);
        }
      },
      onToBeApproved: async (token: ITokenObject) => {
      },
      onToBePaid: async (token: ITokenObject) => {
      },
      onApproving: async (token: ITokenObject, receipt?: string) => {
        let waitingStage = this.currentStage === Stage.FIRST_TOKEN_APPROVAL ? Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL : Stage.WAITING_FOR_GOV_TOKEN_APPROVAL;
        this.currentStage = waitingStage;
        this.showTxStatus('success', receipt);
        this.setSubmitBtnStatus(true, true);
        if (onApproving)
          onApproving(token, receipt);
      },
      onApproved: async (token: ITokenObject) => {
        await this.getNextTokenApprovalStage();
        this.setSubmitBtnStatus(false, true);
        if (onApproved)
          onApproved(token);
      },
      onApprovingError: async (token: ITokenObject, err: Error) => {
        this.showTxStatus('error', err);
        this.setSubmitBtnStatus(false, true);
      },
      onPaying: async (receipt?: string) => {
        this.showTxStatus('success', receipt);
        this.setSubmitBtnStatus(true);
      },
      onPaid: async (receipt?: any) => {
        tokenStore.updateAllTokenBalances(this.state.getRpcWallet());
        if (this.actionType === Action.CREATE) {
          const offerIndexes = await getOfferIndexes(this.state, this.pairAddress, this.fromTokenAddress, this.toTokenAddress);
          console.log(offerIndexes);
          this.setSubmitBtnStatus(false, false, Number(offerIndexes[offerIndexes.length - 1]));
        } else {
          this.setSubmitBtnStatus(false, false);
          if (this.onBack) this.onBack();
        }
      },
      onPayingError: async (err: Error) => {
        this.showTxStatus('error', err);
        this.setSubmitBtnStatus(false);
      }
    });
    this.state.approvalModel.spenderAddress = address;
  }

  private fromTokenInputTextChange = async (value: string) => {
    this.fromTokenInputText = limitDecimals(value, this.fromTokenDecimals);
    this.fromTokenInput = new BigNumber(this.fromTokenInputText);
    if (this.fromTokenInput.isNaN()) {
      this.fromTokenInput = new BigNumber(0);
    } else {
      this.fromTokenInputChange();
    }
  }

  private setMaxBalanceToFromToken = () => {
    this.fromTokenInput = this.fromTokenBalanceExact;
    this.fromTokenInputText = this.fromTokenInput.toString();
    this.fromTokenInputChange();
  }

  private fromTokenInputChange = async () => {
    if (this.actionType != Action.CREATE) {
      if (this.fromTokenInputValid) {
        await this.getNextTokenApprovalStage();
      }
    }
  }

  private offerPriceInputTextChange = (value: string) => {
    this.offerPriceText = value;
  }

  private startDateChange = (value: string | number) => {
    this.startDate = value ? moment(value, 'DD/MM/YYYY HH:mm') : null;
  }

  private endDateChange = (value: string | number) => {
    this.endDate = value ? moment(value, 'DD/MM/YYYY HH:mm') : null;
  }

  private offerToChange = (value: OfferState) => {
    this.offerTo = value;
    if (value === OfferState.Everyone) {
      this.fee = this.originalFee.toString();
    } else {
      this.fee = this.whitelistFee === null ? this.originalFee.toString() : this.whitelistFee.toString();
    }
  }

  private addressChange = (value: IAllocation[]) => {
    this.addresses = value;
  }

  private feeChange = (value: string) => {
    this.whitelistFee = value;
    this.fee = value;
  }

  private async getNextTokenApprovalStage() {
    const chainId = this.state.getChainId();
    const stakeToken = getQueueStakeToken(chainId);
    if (!stakeToken) return;
    const tokens: string[] = await getToBeApprovedTokens(
      chainId,
      this.fromTokenObject,
      this.fromTokenInput.toString(),
      this.fee.toString(),
    );
    if ([Action.CREATE, Action.ADD].some(n => n === this.actionType) && tokens && tokens.length > 0) {
      if (tokens.includes(this.fromTokenAddress)) {
        this.currentStage = Stage.FIRST_TOKEN_APPROVAL;
      } else if (tokens.includes(stakeToken.address!)) {
        this.currentStage = Stage.GOV_TOKEN_APPROVAL;
      }
    } else {
      this.currentStage = Stage.SUBMIT;
    }
  }

  private async approveToken(tokenObj: ITokenObject) {
    this.showTxStatus('warning', `Approving ${tokenObj.symbol} allowance`);
    const amount = this.currentStage === Stage.FIRST_TOKEN_APPROVAL ? this.fromTokenInput.toString() : this.fee.toString();
    this.approvalModelAction.doApproveAction(tokenObj, amount);
  }

  private async addLiquidityAction(endDate: number, deadline: number) {
    this.showTxStatus('warning', '');
    const restrictedPrice = toWeiInv(this.offerPriceText).shiftedBy(-Number(18)).toFixed();
    const allowAll = this.offerTo === OfferState.Everyone;
    const arrWhitelist = (allowAll || this.switchLock === LockState.Locked) ? [] : this.addresses;
    const chainId = this.state.getChainId();
    const fromToken = this.fromTokenObject;
    const toToken = this.toTokenObject;
    const action = this.actionType === Action.CREATE ? "Create" : "Add";
    const receipt = await addLiquidity(
      chainId,
      fromToken,
      toToken,
      fromToken,
      this.pairIndex,
      this.offerIndex ? Number(this.offerIndex) : 0,
      this.fromTokenInput.toNumber(),
      allowAll,
      restrictedPrice,
      this.startDate.unix(),
      endDate,
      deadline,
      arrWhitelist
    );
    if (this.state.handleAddTransactions && receipt) {
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
  }

  private async removeLiquidityAction(deadline: number, collectFromProceeds: boolean) {
    this.showTxStatus('warning', '');
    let amountOut = '';
    let reserveOut = '';
    if (collectFromProceeds) {
      reserveOut = this.fromTokenInput.toString();
    } else {
      amountOut = this.fromTokenInput.toString();
    }
    const chainId = this.state.getChainId();
    const fromToken = this.fromTokenObject;
    const toToken = this.toTokenObject;
    const receipt = await removeLiquidity(
      this.state.getChainId(),
      fromToken,
      toToken,
      fromToken,
      amountOut,
      reserveOut,
      this.offerIndex,
      deadline
    );
    if (this.state.handleAddTransactions && receipt) {
        const timestamp = await this.state.getRpcWallet().getBlockTimestamp(receipt.blockNumber.toString());
        const transactionsInfoArr = [
            {
                desc: `Remove Group Queue ${fromToken.symbol}/${toToken.symbol}`,
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
  }
}
