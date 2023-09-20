import { BigNumber } from "@ijstech/eth-wallet";
import { FormatUtils, moment } from '@ijstech/components';
import { ITokenObject } from "@scom/scom-token-list";

export type TokenMapType = { [token: string]: ITokenObject };
export interface IBalanceTooltip {
  title?: string;
  value: any;
  symbol?: string;
  icon?: string;
  prefix?: string;
  isWrapped?: boolean | null;
  allowZero?: boolean | null;
};

export const DefaultDateTimeFormat = 'DD/MM/YYYY HH:mm:ss';
export const DefaultDateFormat = 'DD/MM/YYYY';

export const formatDate = (date: any, customType?: string, showTimezone?: boolean) => {
  const formatType = customType || DefaultDateFormat;
  const formatted = moment(date).format(formatType);
  if (showTimezone) {
    return `${formatted} (UTC+${moment().utcOffset() / 60})`;
  }
  return formatted;
}

export const formatNumber = (value: any, decimals?: number) => {
  let val = value;
  const minValue = '0.0000001';
  if (typeof value === 'string') {
    val = new BigNumber(value).toNumber();
  } else if (typeof value === 'object') {
    val = value.toNumber();
  }
  if (val != 0 && new BigNumber(val).lt(minValue)) {
    return `<${minValue}`;
  }
  return FormatUtils.formatNumberWithSeparators(val, decimals || 4);
}

export const renderBalanceTooltip = (params: IBalanceTooltip, tokenMap: TokenMapType, isBold?: boolean) => {
  const data = formatNumberValue(params, tokenMap);
  if (typeof data === "object") {
    const { result, tooltip } = data;
    if (isBold) {
      return `<i-label class="bold" tooltip='${JSON.stringify({ content: tooltip })}'>${result}</i-label>`
    }
    return `<i-label tooltip='${JSON.stringify({ content: tooltip })}'>${result}</i-label>`;
  }
  return data;
}

export const formatNumberValue = (data: IBalanceTooltip, tokenMap: TokenMapType) => {
  const { title, value, symbol, icon, prefix, isWrapped, allowZero } = data;
  try {
    let limitDecimals = 18;
    if (symbol) {
      let symb = symbol;
      if (symb.includes('/')) {
        symb = symb.split('/')[0];
      }
      if (symbol === 'USD') {
        limitDecimals = 2;
      } else {
        const tokenObj = Object.values(tokenMap).find((token: ITokenObject) => token.symbol === symb);
        if (tokenObj) {
          limitDecimals = tokenObj.decimals || 18;
        }
      }
    }
    const val = parseFloat(value);
    const minValue = 0.0001;
    let result;
    let tooltip = `${value}`;
    if (val === 0) {
      result = `0`;
    } else if (val < minValue) {
      if (prefix === '$') {
        result = `< ${prefix}${minValue}`;
      } else if (prefix) {
        result = `${prefix.replace('=', '')} < ${minValue}`;
      } else {
        result = `< ${minValue}`;
      }
      tooltip = val.toLocaleString('en-US', { maximumFractionDigits: limitDecimals });
    } else {
      const stringValue = value.toString();
      const decimalsIndex = stringValue.indexOf('.');
      const length = decimalsIndex < 0 ? stringValue.length : stringValue.length - 1;
      let valueFormatted = val.toLocaleString('en-US', { maximumFractionDigits: limitDecimals });
      const arr = valueFormatted.split('.');
      valueFormatted = arr[0];
      if (arr[1]) {
        valueFormatted = `${arr[0]}.${arr[1].substr(0, 4)}`;
      }
      if (length <= 7) {
        result = valueFormatted;
      } else if (decimalsIndex > 7) {
        result = `${valueFormatted.substr(0, 9)}...`;
      } else if (decimalsIndex > -1) {
        result = valueFormatted;
      } else {
        const finalVal = valueFormatted.substr(0, 13);
        result = `${finalVal}${length > 10 ? '...' : ''}`;
      }
      if (result.length > 20 && !result.includes('...')) {
        result = `${result.substr(0, 13)}...`;
      }

      // Format value for the tooltip
      const parts = stringValue.split('.');
      const intVal = parseInt(parts[0]).toLocaleString('en-US');
      tooltip = `${intVal}`;
      if (parts[1]) {
        let decVal = parts[1];
        if (parts[1].length > limitDecimals) {
          decVal = parseFloat(`0.${parts[1]}`).toLocaleString('en-US', { maximumFractionDigits: limitDecimals });
          if (decVal == 1) {
            decVal = parts[1].substr(0, limitDecimals);
          } else {
            decVal = decVal.substr(2);
          }
        }
        tooltip += `.${decVal}`;
      }
    }
    if (icon) {
      result += ` <img width="20" src="${icon}" style="padding-bottom: 0.15rem" />`;
    }
    if (symbol) {
      result += ` ${symbol}`;
      tooltip += ` ${symbol}`;
    }
    if (prefix) {
      result = `${(val < minValue && !allowZero) ? '' : prefix}${result}`;
      tooltip = `${prefix}${tooltip}`;
    }
    if (title) {
      result = `${title}: ${result}`;
    }
    if (isWrapped) {
      result = `(${result})`;
    }
    if (symbol === 'USD') {
      return result;
    }
    return { result, tooltip }
  } catch {
    return '-';
  }
}

export const isInvalidInput = (val: any) => {
  const value = new BigNumber(val);
  if (value.lt(0)) return true;
  return (val || '').toString().substring(0, 2) === '00' || val === '-';
};

export const limitInputNumber = (input: any, decimals?: number) => {
  const amount = input.value;
  if (isInvalidInput(amount)) {
    input.value = '0';
    return;
  }
  if (!new BigNumber(amount).isNaN()) {
    input.value = limitDecimals(amount, decimals || 18);
  }
}

export const limitDecimals = (value: any, decimals: number) => {
  let val = value;
  if (typeof value !== 'string') {
    val = val.toString();
  }
  let chart;
  if (val.includes('.')) {
    chart = '.';
  } else if (val.includes(',')) {
    chart = ',';
  } else {
    return value;
  }
  const parts = val.split(chart);
  let decimalsPart = parts[1];
  if (decimalsPart && decimalsPart.length > decimals) {
    parts[1] = decimalsPart.substr(0, decimals);
  }
  return parts.join(chart);
}

export const toWeiInv = (n: string, unit?: number) => {
  if (new BigNumber(n).eq(0)) return new BigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'); 
  return new BigNumber('1').shiftedBy((unit || 18)*2).idiv(new BigNumber(n).shiftedBy(unit || 18));
}
