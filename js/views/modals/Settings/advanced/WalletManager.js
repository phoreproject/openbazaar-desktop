import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        seed: '',
        isEncrypted: '',
        isFetching: false,
        ...options.initialState || {},
      },
      ...options,
    };

    super(opts);
    this.options = opts;
    this.listenTo(this.model, 'change', () => this.render());
  }

  className() {
    return 'walletManage gutterH';
  }

  events() {
    return {
      'click .js-showSeed': 'onClickShowManager',
      'click .js-lock': 'onClickLockWallet',
      'click .js-unlock': 'onClickUnlockWallet',
    };
  }

  onClickShowManager() {
    this.trigger('clickShowManager');
  }

  onClickLockWallet() {
    this.trigger('clickLockWallet');
  }

  onClickUnlockWallet() {
    this.trigger('clickUnlockWallet');
  }

  render() {
    super.render();
    loadTemplate('modals/settings/advanced/walletManager.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
