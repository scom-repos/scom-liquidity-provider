import { Module, ControlElement, customElements, Styles, observable } from '@ijstech/components';
const Theme = Styles.Theme.ThemeVars;

interface ProgressElement extends ControlElement {
  onProgressDone?: any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['liquidity-progress']: ProgressElement;
    }
  }
};

@customElements('liquidity-progress')
export class LiquidityProgress extends Module {
  private interVal: any;
  private timeout: any;
  @observable()
  private percent: number;
  private _onProgressDone: any;

  get onProgressDone() {
    return this._onProgressDone;
  }
  set onProgressDone(callback: any) {
    this._onProgressDone = callback;
  }
  init() {
    this.percent = 100;
    super.init();
    this.runProgress();
  }
  runProgress() {
    this.interVal = setInterval(() => {
      this.percent -= 1;
      if (this.percent === 0) {
        clearInterval(this.interVal);
        this.timeout = setTimeout(() => {
          if (this.enabled && this._onProgressDone) {
            this._onProgressDone()
          }
          this.percent = 100;
          this.runProgress();
        }, 1000);
      }
    }, 300);
  }
  reStartProgress() {
    if (this.enabled && this._onProgressDone) {
      this._onProgressDone()
    }
    clearInterval(this.interVal);
    clearTimeout(this.timeout);
    this.percent = 100;
    this.runProgress();
  }
  render() {
    return (
      <i-panel class='custom-progress flex'>
        <i-progress id="progress" type="circle" percent={this.percent} width="24" height="24" class="flex align-middle" />
        <i-icon name="sync" width="24" height="24" class="inline-block ml-1 pointer" fill={Theme.colors.primary.main} onClick={this.reStartProgress.bind(this)} />
      </i-panel>
    )
  }
}