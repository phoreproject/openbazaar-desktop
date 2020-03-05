import baseView from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';
import { getWallet } from '../../../utils/modalManager';

export default class extends baseView {
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
  }

  className() {
    return 'unlockBtn';
  }

  events() {
    return {
      'click .js-unlock': 'onUnlockClick',
    };
  }

  onUnlockClick() {
    const password = this.$('#walletPassword').val();
    getWallet()
      .unlockWallet(password, true)
      .done((data) => {
        if (data.isLocked === 'false') {
          this.setState({ isLocked: false });
        } else {
          openSimpleMessage(app.polyglot.t('wallet.manage.unlockFailedDialogTitle'),
            app.polyglot.t('wallet.manage.stateChangeFailedUnknownReason'));
        }
      })
      .fail(xhr => {
        openSimpleMessage(app.polyglot.t('wallet.manage.unlockFailedDialogTitle'),
          xhr && xhr.responseJSON && xhr.responseJSON.reason || '');
      });
  }

  render() {
    const state = this.getState();

    loadTemplate('modals/wallet/unlockBtn.html', t => {
      this.$el.html(t({ ...state }));
    });

    return super.render();
  }

}
