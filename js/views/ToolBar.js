import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import UnlockBtn from './modals/wallet/UnlockBtn';


export default class extends BaseVw {

  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        unlockBtnVisible: false,
        ...options.initialState || {},
      },
    };

    super(opts);
    this.options = opts;

    this.unlockBtn = this.createChild(UnlockBtn);
  }

  events() {
    return {
      'click .js-lockWallet': 'lockWalletClick',
      'click .js-unlockWallet': 'unlockWalletClick',
    };
  }

  lockWalletClick() {
    this.unlockBtn.setState({ unlockBtnVisible: true });
  }

  // TODO impl
  unlockWalletClick() {
  }

  render() {
    const state = this.getState();

    loadTemplate('toolBar.html', (t) => {
      this.$el.html(t(...state));
      super.render();

      this.unlockBtn.delegateEvents();
      this.$('.js-unlockBtn').append(this.unlockBtn.render().el);
    });

    return this;
  }
}
