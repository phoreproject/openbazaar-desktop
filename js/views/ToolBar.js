import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import UnlockBtn from './modals/wallet/UnlockBtn';
import $ from 'jquery';


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

    this.boundOnDocClick = this.documentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  events() {
    return {
      'click .js-lockWallet': 'lockWalletClick',
      'click .js-unlockWallet': 'unlockWalletClick',
    };
  }

  documentClick(e) {
    const unlockBtn = this.getCachedEl('.js-unlockBtnPlaceholder')[0];
    const lockWallet = this.getCachedEl('.js-lockWallet')[0];

    if (this.unlockBtn && this.unlockBtn.getState().unlockBtnVisible &&
      !$.contains(unlockBtn, e.target) && unlockBtn !== e.target &&
      !$.contains(lockWallet, e.target) && lockWallet !== e.target) {
      this.unlockBtn.setState({ unlockBtnVisible: false });
    }
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
      this.$('.js-unlockBtnPlaceholder')
        .append(this.unlockBtn.render().el);
    });

    return this;
  }
}
