import { Module, customElements, ControlElement, Label, Panel, Container } from '@ijstech/components';
import { State, tokenSymbol } from '../store/index';
import { DefaultDateTimeFormat, IAllocation, formatDate, renderBalanceTooltip } from '../global/index';
import { BigNumber } from '@ijstech/eth-wallet';
import { ManageWhitelist } from './whitelist';
import { Stage, OfferState, Action } from '../liquidity-utils/index';
import { tokenStore } from '@scom/scom-token-list';
import { LiquidityProgress } from './progress';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['liquidity-summary']: ControlElement;
    }
  }
};

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
  data?: { row1: ISummaryRowData, row2?: ISummaryRowData };
  className?: string;
  shown: boolean
}

@customElements('liquidity-summary')
export class LiquiditySummary extends Module {
  private _state: State;
  private summarySection: Panel;
  private amountRow: Panel;
  private offerPriceRow: Panel;
  private startDateRow: Panel;
  private endDateRow: Panel;
  private statusRow: Panel;
  private whitelistRow: Panel;
  private allocationRow: Panel;
  private receiveRow: Panel;
  private feeRow: Panel;
  private _summaryData: any;
  private _fromTokenAddress: string;
  private _actionType: number;
  private isSummaryLoaded: boolean;
  private _fetchData: any;
  private manageWhitelist: ManageWhitelist;

  constructor(parent?: Container, options?: any) {
    super(parent, options);
  }

  set state(value: State) {
    this._state = value;
  }

  get state() {
    return this._state;
  }

  get chainId() {
    return this.state?.getChainId();
  }

  get fromTokenAddress(): string {
    return this._fromTokenAddress;
  }

  set fromTokenAddress(value: string) {
    this._fromTokenAddress = value;
  }

  get actionType(): number {
    return this._actionType;
  }

  set actionType(value: number) {
    if (this._actionType === value) return;
    this._actionType = value;
    this.isSummaryLoaded = false;
  }

  get summaryData() {
    return this._summaryData;
  }

  set summaryData(value: any) {
    this._summaryData = value;
    if (!this.isSummaryLoaded)
      this.renderSummary();
    else
      this.updateSummaryUI();
  }

  get isPriceError() {
    return this.summaryData.price === null;
  }

  get fetchData(): any {
    return this._fetchData;
  }

  set fetchData(callback: any) {
    this._fetchData = callback;
  }

  formatDate = (date: any) => {
    if (!date) return 'dd/mm/yyyy hh:mm:ss';
    return formatDate(date, DefaultDateTimeFormat, true);
  }

  showAddresses(addresses: IAllocation[]) {
    this.manageWhitelist.props = {
      isReadOnly: true,
      tokenSymbol: tokenSymbol(this.chainId, this.summaryData.fromTokenAddress),
      addresses,
    }
    this.manageWhitelist.showModal();
  }

  getSummaryData(stage?: Stage) {
    const {
      amount,
      newAmount,
      newOfferPrice,
      newStartDate,
      newEndDate,
      switchLock,
      offerTo,
      fee,
      addresses,
      newAddresses,
      newTotalAddress,
      newTotalAllocation,
      toTokenAddress
    } = this.summaryData;

    let amountRow: ISummaryData[] = [];
    let offerPriceRow: ISummaryData[] = [];
    let startDateRow: ISummaryData[] = [];
    let endDateRow: ISummaryData[] = [];
    let statusRow: ISummaryData[] = [];
    let whitelistRow: ISummaryData[] = [];
    let receiveRow: ISummaryData[] = [];
    let feeRow: ISummaryData[] = [];
    const fromSymbol = tokenSymbol(this.chainId, this.fromTokenAddress);
    const toSymbol = tokenSymbol(this.chainId, toTokenAddress);
    const tokenMap = tokenStore.getTokenMapByChainId(this.chainId);
    const isOfferPriceValid = newOfferPrice ? new BigNumber(newOfferPrice).gt(0) : false;

    if (this.actionType === Action.CREATE) {
      amountRow = [
        {
          id: 'amountRow',
          title: 'Amount',
          data: {
            row1: {
              display: renderBalanceTooltip({ value: newAmount || 0, symbol: fromSymbol }, tokenMap),
              className: 'highlight-value'
            }
          },
          shown: true
        }
      ]
    } else {
      amountRow = [
        {
          id: 'amountRow',
          title: 'Amount',
          data: {
            row1: {
              display: renderBalanceTooltip({ value: amount || 0, symbol: fromSymbol }, tokenMap),
              className: 'text-left'
            },
            row2: {
              display: renderBalanceTooltip({ value: newAmount || 0, symbol: fromSymbol }, tokenMap),
              className: 'highlight-value text-right'
            }
          },
          className: 'summary-row--one',
          shown: true
        }
      ]
    }
    offerPriceRow = [
      {
        id: 'offerPriceRow',
        title: 'Offer Price per Token',
        data: {
          row1: {
            display: isOfferPriceValid ?
              renderBalanceTooltip({ prefix: `1 ${fromSymbol} = `, value: newOfferPrice, symbol: toSymbol }, tokenMap) :
              newOfferPrice ? renderBalanceTooltip({ value: newOfferPrice, symbol: toSymbol }, tokenMap) : '-',
            className: 'highlight-value text-right'
          },
          row2: {
            display: renderBalanceTooltip({ prefix: `1 ${toSymbol} = `, value: 1 / newOfferPrice, symbol: fromSymbol, isWrapped: true }, tokenMap),
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
    ]
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
        shown: this.actionType === Action.CREATE || this.actionType === Action.REMOVE
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
        shown: this.actionType === Action.CREATE || this.actionType === Action.REMOVE
      }
    ]
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
            display: offerTo === OfferState.Whitelist ? `${newTotalAddress} ${newTotalAddress === 1 ? 'Address' : 'Addresses'}` : offerTo,
            className: 'highlight-value',
            onClick: offerTo === OfferState.Whitelist && newTotalAddress ? () => this.showAddresses(newAddresses) : undefined,
          }
        },
        shown: true
      },
      {
        id: 'allocationRow',
        title: 'Total Allocation',
        data: {
          row1: {
            display: renderBalanceTooltip({ value: offerTo === OfferState.Whitelist ? newTotalAllocation : newAmount, symbol: fromSymbol }, tokenMap),
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
            display: renderBalanceTooltip({ value: newAmount * newOfferPrice, symbol: toSymbol }, tokenMap),
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
            display: renderBalanceTooltip({ value: fee || 0, symbol: 'OSWAP' }, tokenMap),
            className: 'highlight-value'
          }
        },
        shown: true
      }
    ];
    switch (stage) {
      case Stage.SET_AMOUNT:
        return [...amountRow, ...receiveRow];
      case Stage.SET_OFFER_PRICE:
        return [...offerPriceRow, ...receiveRow];
      case Stage.SET_START_DATE:
        return startDateRow;
      case Stage.SET_END_DATE:
        return endDateRow;
      case Stage.SET_OFFER_TO:
      case Stage.SET_END_DATE:
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
    this.summarySection.innerHTML = ''
    const summaryRows = this.getSummaryData();
    const checkDisplay = (data: any) => {
      if (data.row1 && data.row2) {
        return (
          <i-panel class={`summary-inner flex-col`}>
            <i-label
              class={`first-data ${data.row1.className || ''} ${data.row1.shown === false ? 'hidden' : ''}`}
              caption={data.row1.display}
            />
            <i-label
              class={`second-data ${data.row2.className || ''} ${data.row2.shown === false ? 'hidden' : ''}`}
              caption={`${data.row2.display}`}
            />
          </i-panel>
        )
      } else {
        const className = `first-data ${data.row1.className || ''} ${data.row1.shown === false ? 'hidden' : ''} ${data.row1.onClick ? 'text-underline pointer' : ''}`;
        const label: Label = <i-label class={className} caption={data.row1.display} />
        if (data.row1.onClick) {
          label.onClick = data.row1.onClick;
        }
        return label;
      }
    }

    childElm = (
      <i-panel>
        {
          summaryRows.map(summary => {
            return (
              <i-hstack
                id={summary.id}
                horizontalAlignment='space-between'
                class={`summary-row ${summary.className || ''} ${summary.shown === false ? 'hidden' : ''}`}
              >
                <i-panel class="text-left">
                  <i-label class="summary-row_label" caption={summary.title} />
                </i-panel>
                <i-panel>
                  {
                    summary.data ?
                      <i-panel class="summary-row_body">
                        {checkDisplay(summary.data)}
                      </i-panel>
                      : <i-label />
                  }
                </i-panel>
              </i-hstack>
            )
          })
        }
      </i-panel>
    )
    this.summarySection.appendChild(childElm);
    this.isSummaryLoaded = true;
  }

  updateSummaryUI(stage?: Stage) {
    const summaryRows = this.getSummaryData(stage);
    summaryRows.forEach(summary => {
      const elmId = summary.id as keyof LiquiditySummary;
      if (this[elmId]) {
        const row: Panel = this[elmId];
        if (summary.shown)
          row.classList.remove("hidden");
        else
          row.classList.add("hidden")
        if (summary.data) {
          const row1Data = summary.data.row1;
          const row2Data = summary.data.row2;
          if (row2Data) {
            const firstDataLabel = row.querySelector('.summary-row_body i-label.first-data') as Label;
            const secondDataLabel = row.querySelector('.summary-row_body i-label.second-data') as Label;
            firstDataLabel.caption = row1Data.display;
            if (row1Data.shown === false) {
              firstDataLabel.classList.add("hidden")
            } else {
              firstDataLabel.classList.remove("hidden")
            }
            secondDataLabel.caption = row2Data.display;
            if (row2Data.shown === false) {
              secondDataLabel.classList.add("hidden")
            } else {
              secondDataLabel.classList.remove("hidden")
            }
          } else {
            const label = row.querySelector('.summary-row_body > i-label') as Label;
            label.caption = row1Data.display;
            if (row1Data.onClick) {
              label.onClick = row1Data.onClick;
              label.classList.add('text-underline', 'pointer');
            } else {
              label.onClick = () => { };
              label.classList.remove('text-underline', 'pointer');
            }
          }
        }
      }
    })
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

  onHighlight(stage: Stage) {
    this.resetHighlight();
    switch (stage) {
      case Stage.SET_AMOUNT:
        this.amountRow?.classList.add("highlight-row");
        this.receiveRow?.classList.add("highlight-row");
        break;
      case Stage.SET_OFFER_PRICE:
        this.offerPriceRow?.classList.add("highlight-row");
        this.receiveRow?.classList.add("highlight-row");
        break;
      case Stage.SET_START_DATE:
        this.startDateRow?.classList.add("highlight-row");
        break;
      case Stage.SET_END_DATE:
        this.endDateRow?.classList.add("highlight-row");
        break;
      case Stage.SET_OFFER_TO:
      case Stage.SET_ADDRESS:
        this.whitelistRow?.classList.add("highlight-row");
        this.allocationRow?.classList.add("highlight-row");
        break;
    }
  }

  render() {
    return (
      <i-panel class='detail-col detail-col--summary'>
        <i-hstack class="detail-col_header" horizontalAlignment="space-between">
          <i-label caption="Order Summary" />
          <i-hstack verticalAlignment="center" class="custom-group--icon">
            <liquidity-progress onProgressDone={this.onFetchData} />
          </i-hstack>
        </i-hstack>
        <i-panel id="summarySection" class="summary" />
        <manage-whitelist id="manageWhitelist" />
      </i-panel>
    )
  }
}
