import { Module, ControlElement, customElements, Panel } from '@ijstech/components';
import assets from '../assets';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['liquidity-help']: ControlElement;
    }
  }
};

@customElements('liquidity-help')
export class LiquidityHelp extends Module {
  private rightContainer: Panel;

  private _adviceTexts: string[] = [];

  get adviceTexts(): string[] {
    return this._adviceTexts;
  }

  set adviceTexts(value: string[]) {
    this._adviceTexts = value;
    this.updateAdviceText();
  }

  updateAdviceText() {
    this.rightContainer.innerHTML = '';
    this._adviceTexts.forEach((text: string, index: number) => {
      const prefix = this._adviceTexts.length > 1 ? `${index + 1}. ` : '';
      const adviceLabel = <i-label class="inline-block" caption={prefix + text} />
      this.rightContainer.appendChild(adviceLabel);
    })
  }

  render() {
    return (
      <i-panel class="detail-col">
        <i-panel class="detail-col_header">
          <i-label caption="Help" />
        </i-panel>
        <i-hstack verticalAlignment="center" margin={{ top: 16 }}>
          <i-panel>
            <i-image width="50" height="50" class="inline-block" margin={{ right: 8 }} url={assets.fullPath('img/Help-Troll-Icon-Full-Body.svg')} />
          </i-panel>
          <i-panel id="rightContainer">
          </i-panel>
        </i-hstack>
      </i-panel>
    )
  }
}