import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import UnlockBtn from './modals/wallet/UnlockBtn';
import $ from 'jquery';
import app from '../app';
import { openSimpleMessage } from './modals/SimpleMessage';
import { getWallet } from '../utils/modalManager';

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
    this.listenTo(this.unlockBtn, 'walletUnlocked', () => {
      this.setState({ walletLocked: false });
    });

    this.boundOnDocClick = this.documentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  events() {
    return {
      'click .js-lockWallet': 'onLockClick',
      'click .js-unlockWallet': 'onUnlockClick',
    };
  }

  documentClick(e) {
    const unlockBtn = this.getCachedEl('.js-unlockBtnPlaceholder')[0];
    const unlockWallet = this.getCachedEl('.js-unlockWallet')[0];

    if (this.unlockBtn && this.unlockBtn.getState().unlockBtnVisible &&
      !$.contains(unlockBtn, e.target) && unlockBtn !== e.target &&
      !$.contains(unlockWallet, e.target) && unlockWallet !== e.target) {
      this.unlockBtn.setState({ unlockBtnVisible: false });
    }
  }

  onLockClick() {
    getWallet()
      .lockWallet()
      .done(data => {
        if (data.isLocked === 'true') {
          this.setState({ walletLocked: true });
        } else {
          // TODO print simple msg?
          console.log('error?');
        }
      })
      .fail(xhr => {
        // TODO print simple msg?
      });
  }

  onUnlockClick() {
    this.unlockBtn.setState({ unlockBtnVisible: true });
  }

  render() {
    const state = this.getState();

    loadTemplate('toolBar.html', (t) => {
      this.$el.html(t({
        walletLocked: state.walletLocked,
      }));

      this.unlockBtn.delegateEvents();
      this.$('.js-unlockBtnPlaceholder')
        .append(this.unlockBtn.render().el);
    });

    return super.render();
  }
}
