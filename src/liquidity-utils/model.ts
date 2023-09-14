import { BigNumber, IERC20ApprovalAction, Wallet } from "@ijstech/eth-wallet";
import {
  limitDecimals,
  toWeiInv,
  DefaultDateFormat
} from '../global/index';
import {
  getGroupQueuePairInfo as getQueuePairInfo,
  getToBeApprovedTokens,
  getEstimatedAmountInUSD,
  addLiquidityToGroupQueue,
  getQueueStakeToken,
  getLiquidityProviderAddress
} from './API';
import { State, getTokenDecimals } from '../store/index';
import { application, IEventBus, moment } from '@ijstech/components';
import { Contracts } from "@scom/oswap-openswap-contract";
import { ITokenObject, tokenStore } from "@scom/scom-token-list";

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
  JOIN = 'join',
  ADD = 'add',
  REMOVE = 'remove',
  MOVE = 'move',
  COLLECT = 'collect',
}

export enum OfferState {
  Everyone = 'Everyone',
  Whitelist = 'Whitelist Addresses'
}

export enum LockState {
  Locked = 'Locked',
  Unlocked = 'Unlocked'
}

export interface InputData {
  fromTokenInputText: string,
  offerPriceText: string,
  startDateStr: string,
  endDateStr: string,
  switchLock: LockState,
  addresses: any[]
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
  private pairIndex = 0;
  private isFirstLoad = true;
  private pairCustomParams: any;
  private fromTokenInput = new BigNumber(0);
  private estimatedAmountInUSD = new BigNumber(0);
  private govTokenInput = new BigNumber(0);
  private fromTokenInputText = '';
  private offerPriceText = '';
  private offerTo = OfferState.Everyone;
  private originalFee = '0';
  private whitelistFee: string | null = null;
  private fee = '0';
  private startDate: any;
  private endDate: any;
  private switchLock = LockState.Unlocked;
  private addresses: any[] = [];

  private approvalModelAction: IERC20ApprovalAction;
  private $eventBus: IEventBus;

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
  private get toTokenSymbol() {
    return this.toTokenObject ? this.toTokenObject.symbol : '';
  }

  private summaryData: any = {
    amount: '0',
    offerPrice: this.offerPriceText,
    offerTo: this.offerTo,
    startDate: null,
    endDate: null,
    switchLock: '',
    addresses: [] as any[],
    reserve: '0',
    maxDur: 3600 * 24 * 180, // default 3 months
  }

  private get enableApproveAllowance(): boolean {
    return this.fromTokenInputValid;
  }

  private get fromTokenInputValid(): boolean {
    return this.fromTokenInput.gt(0) && this.fromTokenInput.lte(this.fromTokenBalanceExact);
  }

  private get offerPriceInputValid(): boolean {
    return this.offerPriceText && new BigNumber(this.offerPriceText).gt(0);
  };

  private get fromTokenBalanceExact() {
    const tokenBalances = tokenStore.tokenBalances || {};
    return tokenBalances[this.fromTokenAddress]
      ? new BigNumber(tokenBalances[this.fromTokenAddress])
      : new BigNumber(0);
  }

  private get govTokenBalanceExact() {
    let StakeToken = getQueueStakeToken(this.state.getChainId());
    if (!StakeToken) return new BigNumber(0);
    const tokenBalances = tokenStore.tokenBalances || {};
    return tokenBalances[StakeToken.address!]
      ? new BigNumber(tokenBalances[StakeToken!.address!])
      : new BigNumber(0);
  }

  private get getJoinGroupQueueValidation() {
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
    if (!this.getJoinGroupQueueValidation) return true;
    if ([Stage.NONE, Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL, Stage.WAITING_FOR_GOV_TOKEN_APPROVAL].includes(this.currentStage)) {
      return true;
    }
    return false;
  }

  private get proceedButtonText() {
    const StakeToken = getQueueStakeToken(this.state.getChainId());
    if (!StakeToken) return '';
    if (this.fromTokenInput.gt(this.fromTokenBalanceExact)) {
      return `Insufficient ${this.fromTokenSymbol} balance`;
    }
    if (this.fromTokenInput.lte(0)) {
      return 'Amount must be greater than 0';
    }
    if (this.offerPriceText && !this.offerPriceInputValid) {
      return 'Offer Price must be greater than 0';
    }
    if (new BigNumber(this.fee).gt(this.govTokenBalanceExact)) {
      return `Insufficient ${StakeToken.symbol} balance`;
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
  };

  private get nextButtonText() {
    const StakeToken = getQueueStakeToken(this.state.getChainId());
    if (!StakeToken) return '';
    if (this.fromTokenInput.gt(this.fromTokenBalanceExact)) {
      return `Insufficient ${this.fromTokenSymbol} balance`;
    }
    if (this.fromTokenInput.lte(0)) {
      return 'Amount must be greater than 0';
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
      return `Insufficient ${StakeToken.symbol} balance`;
    }
    return `Next`;
  };

  private get isFirstTokenApproved() {
    return this.currentStage >= Stage.GOV_TOKEN_APPROVAL;
  };

  private get isGovTokenApproved() {
    return this.currentStage == Stage.SUBMIT;
  };

  private get isWaitingForApproval() {
    return [Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL, Stage.WAITING_FOR_GOV_TOKEN_APPROVAL].includes(this.currentStage);
  };

  private get newAmount() {
    return this.fromTokenInput;
  };

  private get listAddress() {
    const newAddresses = this.addresses || [];
    const oldAddresses = this.summaryData.addresses || [];
    let list: any = [];
    for (const item of newAddresses.concat(oldAddresses)) {
      if (!list.find((f: any) => f.address === item.address)) {
        list.push(item);
      }
    }
    return list;
  }

  private get newTotalAddress() {
    return this.listAddress.length;
  };

  private get newTotalAllocation() {
    const totalAddress = this.listAddress.reduce((pv: any, cv: any) => pv + parseFloat(cv.allocation), 0);
    return totalAddress;
  };

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
      estimatedAmountInUSD: () => this.estimatedAmountInUSD,
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
  };

  private fetchData = async () => {
    const response = await getQueuePairInfo(this.state, this.pairAddress, this.fromTokenAddress);
    this.toTokenAddress = response.toTokenAddress || '';
    if (this.isFirstLoad) {
      this.isFirstLoad = false;
      this.fee = response.feePerOrder;
      this.originalFee = response.feePerOrder;
    }
    this.setSummaryData(response);
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
    const StakeToken = getQueueStakeToken(this.state.getChainId());
    if (!StakeToken) return;
    if (this.currentStage === Stage.SET_AMOUNT) {
      this.currentStage = Stage.SET_OFFER_PRICE;
    } else if (this.currentStage === Stage.SET_OFFER_PRICE) {
      this.currentStage = Stage.SET_START_DATE;
    } else if (this.currentStage === Stage.SET_START_DATE) {
      this.currentStage = Stage.SET_END_DATE;
    } else if (this.currentStage === Stage.SET_END_DATE) {
      this.currentStage = Stage.SET_OFFER_TO;
    } else if (this.currentStage === Stage.SET_OFFER_TO) {
      const isAddressShown = this.offerTo === OfferState.Whitelist;
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
      await this.approveToken(StakeToken);
    } else if (this.currentStage === Stage.SUBMIT) {
      this.approvalModelAction.doPayAction();
    }
  };

  private get validateEmptyInput() {
    const fromTokenInputCheck = this.fromTokenInput && this.fromTokenInput.gt(0);
    const offerPriceCheck = this.offerPriceInputValid;
    const startDateCheck = !!this.startDate;
    const endDateCheck = !!this.endDate;
    const stateCheck = !!this.switchLock;
    const addressesCheck = this.addresses && this.addresses.length;
    if (!fromTokenInputCheck || !offerPriceCheck || !startDateCheck || !endDateCheck || !stateCheck || !addressesCheck) {
      return false;
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
        msg = `Input the total amount of ${this.fromTokenSymbol} you would like to sell.`;
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
  };

  constructor(state: State, pairAddress: string, fromTokenAddress: string, offerIndex: number) {
    this.state = state;
    this.pairAddress = pairAddress;
    this.fromTokenAddress = fromTokenAddress;
    this.offerIndex = offerIndex;
    this.currentStage = Stage.SET_AMOUNT;
    this.$eventBus = application.EventBus;
    tokenStore.updateAllTokenBalances(this.state.getRpcWallet());
    this.initApprovalModelAction();
  }

  async initApprovalModelAction() {
    const address = getLiquidityProviderAddress(this.state.getChainId());
    this.approvalModelAction = await this.state.setApprovalModelAction({
      sender: this,
      payAction: async () => {
        const deadline = Math.floor(Date.now() / 1000) + this.state.transactionDeadline * 60;
        this.addLiquidityAction(this.endDate.unix(), deadline);
      },
      onToBeApproved: async (token: ITokenObject) => {
      },
      onToBePaid: async (token: ITokenObject) => {
      },
      onApproving: async (token: ITokenObject, receipt?: string) => {
        let waitingStage = this.currentStage === Stage.FIRST_TOKEN_APPROVAL ? Stage.WAITING_FOR_FIRST_TOKEN_APPROVAL : Stage.WAITING_FOR_GOV_TOKEN_APPROVAL;
        this.currentStage = waitingStage;
        // this.$eventBus.dispatch(EventId.SetResultMessage, {
        //   status: 'success',
        //   txtHash: receipt,
        // });
        // this.$eventBus.dispatch(EventId.ShowResult);
        if (onApproving)
          onApproving(token, receipt);
      },
      onApproved: async (token: ITokenObject) => {
        await this.getNextTokenApprovalStage();
        if (onApproved)
          onApproved(token);
      },
      onApprovingError: async (token: ITokenObject, err: Error) => {
        // this.$eventBus.dispatch(EventId.SetResultMessage, {
        //   status: 'error',
        //   content: err,
        // });
        // this.$eventBus.dispatch(EventId.ShowResult);
      },
      onPaying: async (receipt?: string) => {
        // setGroupQueueActionsStatus(this.actionKey, true, this.keyTab);
        // this.$eventBus.dispatch(EventId.SetResultMessage, {
        //   status: 'success',
        //   txtHash: receipt,
        //   customRedirect: { name: 'group-queue', params: { keyTab: this.keyTab } },
        // });
        // this.$eventBus.dispatch(EventId.ShowResult);
      },
      onPaid: async (receipt?: any) => {
        tokenStore.updateAllTokenBalances(this.state.getRpcWallet());
        // setGroupQueueActionsStatus(this.actionKey, false, this.keyTab);
      },
      onPayingError: async (err: Error) => {
        // this.$eventBus.dispatch(EventId.SetResultMessage, {
        //   status: 'error',
        //   content: err,
        // });
        // this.$eventBus.dispatch(EventId.ShowResult);
      }
    });
    this.state.approvalModel.spenderAddress = address;
  }

  private fromTokenInputTextChange = async (value: string) => {
    this.fromTokenInputText = limitDecimals(value, this.fromTokenDecimals);
    this.fromTokenInput = new BigNumber(this.fromTokenInputText);
    if (this.fromTokenInput.isNaN()) {
      this.fromTokenInput = new BigNumber(0);
      this.estimatedAmountInUSD = new BigNumber(0);
    } else {
      this.fromTokenInputChange();
    }
  };

  private setMaxBalanceToFromToken = () => {
    this.fromTokenInput = this.fromTokenBalanceExact;
    this.fromTokenInputText = this.fromTokenInput.toString();
    this.fromTokenInputChange();
  };

  private fromTokenInputChange = async () => {
    let amount = await getEstimatedAmountInUSD(this.state.getChainId(), this.fromTokenObject, this.fromTokenInput.toString());
    this.estimatedAmountInUSD = new BigNumber(amount);
  };

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

  private addressChange = (value: any) => {
    this.addresses = value;
  }

  private feeChange = (value: string) => {
    this.whitelistFee = value;
    this.fee = value;
  }

  private async getNextTokenApprovalStage() {
    const chainId = this.state.getChainId();
    const StakeToken = getQueueStakeToken(chainId);
    if (!StakeToken) return;
    const tokens: string[] = await getToBeApprovedTokens(
      chainId,
      this.fromTokenObject,
      this.fromTokenInput.toString(),
      this.fee.toString(),
    );
    if (tokens && tokens.length > 0) {
      if (tokens.includes(this.fromTokenAddress)) {
        this.currentStage = Stage.FIRST_TOKEN_APPROVAL;
      } else if (tokens.includes(StakeToken.address!)) {
        this.currentStage = Stage.GOV_TOKEN_APPROVAL;
      }
    } else {
      this.currentStage = Stage.SUBMIT;
    }
  }

  private async approveToken(tokenObj: ITokenObject) {
    // this.$eventBus.dispatch(EventId.SetResultMessage, {
    //   status: 'warning',
    //   content: `Approving ${tokenObj.symbol} allowance`
    // });
    // this.$eventBus.dispatch(EventId.ShowResult);
    const amount = this.currentStage === Stage.FIRST_TOKEN_APPROVAL ? this.fromTokenInput.toString() : this.fee.toString();
    this.approvalModelAction.doApproveAction(tokenObj, amount);
  }

  private async addLiquidityAction(endDate: number, deadline: number) {
    // this.$eventBus.dispatch(EventId.SetResultMessage, {
    //   status: 'warning',
    //   content: '',
    // });
    const restrictedPrice = toWeiInv(this.offerPriceText).shiftedBy(-Number(18)).toFixed();
    const allowAll = this.offerTo === OfferState.Everyone;
    const arrWhitelist = (allowAll || this.switchLock === LockState.Locked) ? [] : this.addresses as any;
    // this.$eventBus.dispatch(EventId.ShowResult);
    addLiquidityToGroupQueue(
      this.state.getChainId(),
      this.fromTokenObject,
      this.toTokenObject,
      this.fromTokenObject,
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
  }
}
