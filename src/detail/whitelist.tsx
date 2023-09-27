import { Module, customElements, ControlElement, Modal, Label, Pagination, observable, Panel, Button, HStack, Input, Container, Styles, Control } from '@ijstech/components';
import { whiteListStyle } from './whitelist.css';
import { BigNumber } from '@ijstech/eth-wallet';
import { IAllocation, formatNumber, isAddressValid, limitInputNumber, renderBalanceTooltip } from '../global/index';
import { tokenStore } from '@scom/scom-token-list';
const Theme = Styles.Theme.ThemeVars;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['manage-whitelist']: ControlElement;
    }
  }
};

const dummyAddressList: string[] = [
  "0xFa8e00000001234567899876543210000000Fa8e",
  "0xFa8e11111111234567899876543211111111Fa8e",
  "0xFa8e22222221234567899876543212222222Fa8e",
  "0xFa8e33333331234567899876543213333333Fa8e",
  "0xFa8e44444441234567899876543214444444Fa8e",
  "0xFa8e55555551234567899876543215555555Fa8e",
  "0xFa8e66666661234567899876543216666666Fa8e",
  "0xFa8e77777771234567899876543217777777Fa8e",
  "0xFa8e88888881234567899876543218888888Fa8e",
  "0xFa8e99999991234567899876543219999999Fa8e",
]
const pageSize = 5;

export interface IData {
  isReadOnly?: boolean,
  balance?: string | number,
  tokenSymbol: string,
  decimals?: number,
  addresses: IAllocation[],
  pairCustomParams?: any,
}

@customElements('manage-whitelist')
export class ManageWhitelist extends Module {
  private _props: IData;
  private balance: string | number | undefined = 0;
  private tokenSymbol: string = '';
  private decimals: number;
  private addresses: IAllocation[] = [];
  private pairCustomParams: any = {};
  private isReadOnly: boolean | undefined;
  private listAddress: IAllocation[] = [];
  private totalAddressLabel: Label;
  private totalAllocationLabel: Label;
  private manageWhitelistModal: Modal;
  private listAddressContainer: Panel;
  private balanceFeeContainer: Panel;
  private addPanel: Panel;
  private batchPanel: Panel;
  private inputBatch: Input;
  private groupBtnElm: HStack;
  private totalFee: Label;
  private balanceLabel: Label;
  private cancelBtn: Button;
  private saveBtn: Button;
  private isAddByBatch = false;
  private searchInput: Input;
  public convertWhitelistedAddresses: any;
  public updateAddress: any;

  @observable()
  private totalPage = 0;
  private pageNumber = 1;
  private itemStart = 0;
  private itemEnd = pageSize;
  private paginationElm: Pagination;

  get props() {
    return this._props;
  }

  set props(value: IData) {
    this._props = value;
    this.isReadOnly = value.isReadOnly;
    this.balance = value.balance;
    this.tokenSymbol = value.tokenSymbol;
    this.decimals = value.decimals || 18;
    this.addresses = value.addresses;
    this.pairCustomParams = value.pairCustomParams;
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.renderUI();
  }

  get totalAddress() {
    let total = 0;
    this.listAddress.forEach((item: IAllocation) => {
      if (item.address) {
        ++total;
      }
    });
    return total;
  };

  get totalAllocation() {
    let total = new BigNumber(0);
    this.listAddress.forEach((item: IAllocation) => {
      if (item.address) {
        const value = this.isReadOnly ? item.allocationVal : item.allocation;
        total = total.plus(value || 0);
      }
    });
    return total.toFixed();
  };

  get fee() {
    if (!this.pairCustomParams || !this.totalAddress) return new BigNumber(0);
    let total = 0;
    this.listAddress.forEach((item: IAllocation) => {
      if (item.address) {
        if (item.isOld) {
          total += (item.oldAllocation !== item.allocation) ? 1 : 0;
        } else {
          ++total;
        }
      }
    });
    return new BigNumber(this.pairCustomParams.feePerTrader).times(total);
  };

  get idxFiltering() {
    if (this.searchInput.value) {
      return this.listAddress.findIndex((item: IAllocation) => item.address.toLowerCase().includes(this.searchInput.value.toLowerCase()));
    }
    return 0;
  }

  get listAddressFiltered() {
    if (this.searchInput.value) {
      return this.listAddress.filter((item: IAllocation) => item.address.toLowerCase().includes(this.searchInput.value.toLowerCase()));
    }
    return this.listAddress;
  };

  get listAddressPagination() {
    return this.listAddressFiltered.slice(this.itemStart, this.itemEnd);
  };

  constructor(parent?: Container, options?: any) {
    super(parent, options);
  };

  renderUI = () => {
    this.cancelBtn.caption = this.isReadOnly ? 'Confirm' : 'Cancel';
    if (this.isReadOnly) {
      this.cancelBtn.classList.add('btn-submit');
    } else {
      this.cancelBtn.classList.add('btn-cancel');
      const tokenMap = tokenStore.tokenMap;
      this.balanceLabel.caption = renderBalanceTooltip({ title: 'Balance', value: this.balance, symbol: 'OSWAP' }, tokenMap);
      this.totalFee.caption = renderBalanceTooltip({ value: this.fee, symbol: 'OSWAP' }, tokenMap);
    }
    this.balanceFeeContainer.visible = !this.isReadOnly;
    this.groupBtnElm.visible = !this.isReadOnly;
    this.saveBtn.visible = !this.isReadOnly;
    this.setDefaultAddresses();
  }

  setDefaultAddresses = () => {
    if (this.isReadOnly) {
      this.listAddress = this.addresses.map((address: IAllocation) => {
        return {
          ...address,
          allocation: formatNumber(address.allocation),
          allocationVal: address.allocation,
        }
      });
    } else {
      if (this.isAddByBatch) {
        this.inputBatch.value = '';
      }
      if (this.pageNumber > 1) {
        this.pageNumber = 1;
        this.handlePagination(this.pageNumber);
      };
      const list: IAllocation[] = [];
      this.addresses.forEach((item: IAllocation) => {
        list.push({ ...item });
      });
      this.listAddress = list;
    };
    this.updateTotalValues();
    this.renderAddresses();
  };

  updateTotalValues = () => {
    this.totalAddressLabel.caption = `${this.totalAddress}` || '0';
    this.totalAllocationLabel.caption = renderBalanceTooltip({ value: this.totalAllocation, symbol: this.tokenSymbol }, tokenStore.tokenMap);
    this.totalFee.caption = renderBalanceTooltip({ value: this.fee, symbol: 'OSWAP' }, tokenStore.tokenMap);
    this.saveBtn.enabled = !this.isDisabled;
  }

  renderAddresses = () => {
    this.totalPage = Math.ceil(this.listAddressFiltered.length / pageSize);
    this.paginationElm.visible = this.totalPage > 1;
    this.listAddressContainer.clearInnerHTML();
    if (this.searchInput.value && !this.listAddressPagination.length) {
      this.listAddressContainer.appendChild(<i-label margin={{ top: 10 }} caption={`There is no address: <b>${this.searchInput.value}</b>`} />);
    }
    this.listAddressPagination.forEach((item: IAllocation, idx: number) => {
      const indexVal = (pageSize * (this.pageNumber - 1)) + idx + this.idxFiltering;
      this.listAddressContainer.appendChild(
        <i-hstack verticalAlignment="start" margin={{ top: 4, bottom: 4 }}>
          <i-vstack verticalAlignment="center" width="50%" padding={{ right: 10 }}>
            <i-input
              value={item.address}
              enabled={!(this.isReadOnly || item.isOld)}
              onChanged={(e: Input) => this.onInputAddress(e, indexVal)}
              class="input-address"
              width="100%"
              height={45}
            />
            <i-label id={`err_${indexVal}`} font={{ size: '12px' }} class="text-err text-left" visible={!!item.isDuplicated || !!item.invalid} caption={item.isDuplicated ? 'This address is duplicated' : 'Please input a valid address'} />
          </i-vstack>
          <i-hstack verticalAlignment="center" width="50%" padding={{ left: 10 }}>
            <i-input
              caption={this.tokenSymbol}
              class={`input-allocation ${!this.isReadOnly ? 'w-input' : ''}`}
              inputType={this.isReadOnly ? undefined : 'number'}
              value={item.allocation + ''}
              enabled={!this.isReadOnly}
              onChanged={(e: Input) => this.onInputAllocation(e, indexVal)}
              width="100%"
              height={43}
            />
            {
              !this.isReadOnly && !item.isOld ?
                <i-icon name="trash" fill="#f15e61" class="pointer" margin={{ left: 4 }} height={18} width={18} onClick={() => this.removeAddress(idx, indexVal)} /> :
                []
            }
          </i-hstack>
        </i-hstack>
      )
    });
  }

  get isDisabled() {
    if (this.isAddByBatch) {
      return !this.inputBatch.value;
    }
    return this.listAddress.some((item: IAllocation) => (item.address !== '' && (item.allocation == '' || Number(item.allocation) < 0)) || item.isDuplicated || item.invalid);
  };

  getBatchValues = () => {
    let items = this.convertWhitelistedAddresses(this.inputBatch.value)
    let list = [];
    for (const item of items) {
      const { address, allocation } = item;
      list.push({
        address,
        allocation: isNaN(allocation) ? '' : allocation,
      })
    }
    return list;
  }

  onSave = () => {
    if (this.isAddByBatch) {
      const oldAddresses = this.listAddress.filter((item: IAllocation) => item.isOld);
      this.listAddress = oldAddresses.concat(this.getBatchValues());
      this.validateForm();
      this.renderAddresses();
      this.updateTotalValues();
      this.isAddByBatch = false;
      this.batchPanel.visible = false;
      this.addPanel.visible = true;
    } else {
      const finalList: IAllocation[] = [];
      this.listAddress.forEach((item: IAllocation) => {
        const { address, allocation } = item;
        if (address && (allocation || allocation == 0)) {
          finalList.push({ ...item });
        }
      });
      if (this.updateAddress) {
        this.updateAddress({ addresses: finalList, fee: this.fee });
      }
      this.closeModal();
    }
  }

  onCancel = () => {
    if (this.isAddByBatch) {
      this.isAddByBatch = false;
      this.saveBtn.enabled = !this.isDisabled;
      this.batchPanel.visible = false;
      this.addPanel.visible = true;
    } else {
      this.closeModal();
    }
  }

  onInputAddress = (e: Input, idx: number) => {
    const item = this.listAddress[idx];
    if (item.isOld || this.isReadOnly) {
      e.value = item.address;
      return;
    }
    this.listAddress[idx] = {
      ...item,
      address: e.value
    }
    this.validateForm();
  }

  onInputAllocation = (e: Input, idx: number) => {
    const item = this.listAddress[idx];
    limitInputNumber(e, this.decimals);
    this.listAddress[idx] = {
      ...item,
      allocation: e.value
    }
    this.updateTotalValues();
  }

  onInputBatch = () => {
    this.saveBtn.enabled = !this.isDisabled;
  };

  validateForm = async () => {
    const array = this.listAddress;
    const valueArr = array.map((item: IAllocation) => { return item.address });
    for (let i = 0; i < valueArr.length; i++) {
      if (valueArr[i]) {
        const isDuplicated = valueArr.some((item: string, index: number) =>
          valueArr[i] === item && i !== index
        );
        let isValid = true;
        this.listAddress[i].isDuplicated = isDuplicated;
        if (!isDuplicated) {
          isValid = await isAddressValid(valueArr[i]);
          this.listAddress[i].invalid = !isValid;
        }
        const elm = this.listAddressContainer.querySelector(`[id="err_${i}"]`) as Label;
        if (elm) {
          elm.visible = (isDuplicated || !isValid);
          if (isDuplicated || !isValid) {
            elm.caption = isDuplicated ? 'This address is duplicated' : 'Please input a valid address';
          }
        }
      }
    }
    this.updateTotalValues();
  }

  onAddBatch = () => {
    this.isAddByBatch = true;
    this.addPanel.visible = false;
    this.batchPanel.visible = true;
    this.saveBtn.enabled = !this.isDisabled;
  }

  onClear = () => {
    this.inputBatch.value = '';
    this.saveBtn.enabled = false;
  }

  onAdd = () => {
    this.listAddress.push({
      address: '',
      allocation: '',
      isDuplicated: false,
      invalid: false,
    });
    this.renderAddresses();
  }

  removeAddress = (index: number, indexVal: number) => {
    const isLastItem = this.listAddress.length === indexVal + 1;
    this.listAddress.splice(indexVal, 1);
    if (isLastItem && index === 0 && this.pageNumber !== 1) {
      this.handlePagination(--this.pageNumber);
    } else {
      setTimeout(() => {
        this.renderAddresses();
        this.validateForm();
      }, 200)
    }
  };

  handlePagination = (value: number) => {
    this.pageNumber = value;
    this.itemStart = (value - 1) * pageSize;
    this.itemEnd = this.itemStart + pageSize;
    this.renderAddresses();
  }

  onSelectIndex = () => {
    this.handlePagination(this.paginationElm.currentPage);
  }

  resetPaging = () => {
    this.pageNumber = 1;
    this.paginationElm.currentPage = 1;
    this.itemStart = 0;
    this.itemEnd = this.itemStart + pageSize;
    this.renderAddresses();
  }

  searchAddress = () => {
    this.resetPaging();
  }

  showModal = () => {
    this.manageWhitelistModal.title = "Manage Whitelist Address";
    this.inputBatch.value = '';
    this.manageWhitelistModal.visible = true;
    this.resetPaging();
  }

  closeModal = () => {
    this.manageWhitelistModal.visible = false;
  }

  init() {
    super.init();
  }

  render() {
    return (
      <i-modal
        id="manageWhitelistModal"
        closeIcon={{ name: 'times' }}
        class={whiteListStyle}
      >
        <i-panel class="i-modal_content text-center">
          <i-panel id="addPanel">
            <i-panel class="search-box">
              <i-icon name="search" fill={Theme.input.fontColor} width={16} height={16} margin={{ right: 4 }} />
              <i-input id="searchInput" class="input-search" placeholder="Search" width="100%" height={40} onChanged={this.searchAddress} />
            </i-panel>
            <i-hstack horizontalAlignment="space-between">
              <i-hstack class="total-info" horizontalAlignment="space-between" width="50%" padding={{ left: 8, right: 10 }}>
                <i-label caption="Address" />
                <i-hstack gap={4}>
                  <i-label caption="Total:" />
                  <i-label id="totalAddressLabel" font={{ color: Theme.colors.primary.main }} caption="0 Addresses" />
                </i-hstack>
              </i-hstack>
              <i-hstack class="total-info" horizontalAlignment="space-between" width="50%" padding={{ left: 10, right: 8 }}>
                <i-label caption="Allocation" />
                <i-hstack gap={4}>
                  <i-label caption="Total:" />
                  <i-label id="totalAllocationLabel" font={{ color: Theme.colors.primary.main }} caption="-" />
                </i-hstack>
              </i-hstack>
            </i-hstack>
            <i-vstack id="listAddressContainer" />
            <i-hstack horizontalAlignment="end" wrap='wrap' margin={{ top: 10 }}>
              <i-hstack id="groupBtnElm" horizontalAlignment="center" verticalAlignment="center" gap="10px">
                <i-button class="btn-os" icon={{ name: "plus-square" }} caption="Add" onClick={this.onAdd} />
                <i-button class="btn-os" icon={{ name: "plus-square" }} caption="Add By Batch" onClick={this.onAddBatch} />
              </i-hstack>
              <i-pagination
                id="paginationElm"
                margin={{ top: 16, bottom: 16, left: 12, right: 12 }}
                width="auto"
                currentPage={this.pageNumber}
                totalPages={this.totalPage}
                onPageChanged={this.onSelectIndex}
              />
            </i-hstack>
            <i-vstack
              id="balanceFeeContainer" verticalAlignment="start"
              margin={{ bottom: 10 }} padding={{ bottom: 16 }}
              border={{ top: { color: Theme.input.background, width: '2px', style: 'solid' } }}
            >
              <i-vstack verticalAlignment="start" margin={{ top: 16 }}>
                <i-hstack width="100%" verticalAlignment="start" horizontalAlignment="space-between">
                  <i-label caption="OSWAP Fee" />
                  <i-label id="totalFee" font={{ color: Theme.colors.primary.main }} class="text-right" caption="-" />
                </i-hstack>
                <i-vstack width="100%" verticalAlignment="end" horizontalAlignment="end">
                  <i-label id="balanceLabel" caption="-" />
                </i-vstack>
              </i-vstack>
            </i-vstack>
          </i-panel>
          <i-panel id="batchPanel" visible={false} padding={{ left: 16, right: 16 }}>
            <i-hstack horizontalAlignment="space-between">
              <i-label caption="Add by Batch" />
              <i-label class="pointer" font={{ color: Theme.colors.primary.main }} caption="Clear" onClick={this.onClear} />
            </i-hstack>
            <i-vstack verticalAlignment="center" horizontalAlignment="center" margin={{ top: 10 }}>
              <i-label class="text-note" caption="Please enter one address and amount on each line" />
              <i-label class="text-note" caption={`${dummyAddressList[0]},250`} />
              <i-label class="text-note" caption={`${dummyAddressList[1]},1000`} />
            </i-vstack>
            <i-panel width="100%" margin={{ top: 20 }}>
              <i-input id="inputBatch" class="input-batch" width="100%" inputType="textarea" rows={4} onChanged={this.onInputBatch} />
            </i-panel>
          </i-panel>
          <i-hstack verticalAlignment="center" horizontalAlignment="center" gap="10px" margin={{ top: 20, bottom: 10 }}>
            <i-button
              id="cancelBtn"
              caption="Cancel"
              class="btn-os"
              onClick={this.onCancel}
            />
            <i-button
              id="saveBtn"
              caption="Save"
              enabled={false}
              class="btn-os btn-submit"
              onClick={this.onSave}
            />
          </i-hstack>
        </i-panel>
      </i-modal>
    )
  }
}