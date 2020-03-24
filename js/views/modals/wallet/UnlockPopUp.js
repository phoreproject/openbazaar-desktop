import baseView from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';
import { getWallet } from '../../../utils/modalManager';
import $ from 'jquery';
import * as moment from 'moment';

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

    this.updateWalletTimoutAndHint('', 0);
  }

  className() {
    return 'unlockBtn';
  }

  events() {
    return {
      'click .js-unlock': 'onUnlockClick',
      'click .js-addTime': 'onAddTimeClick',
      'change .js-walletUnlockTimeout': 'onTimePeriodChange',
    };
  }

  onUnlockClick() {
    const password = this.$('#walletPassword').val();
    const unlockTimeout = parseInt(this.$('#unlockTimeout').val() || '0', 10);
    getWallet()
      .unlockWallet(password, unlockTimeout, true)
      .done((data) => {
        if (data.isLocked === 'false') {
          this.setState({ unlockBtnVisible: false });
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

  onAddTimeClick(ev) {
    const seconds = parseInt($(ev.currentTarget).data('seconds'), 10);
    this.updateWalletTimoutAndHint(this.$('#unlockTimeout').val(), seconds);
  }

  onTimePeriodChange() {
    this.updateWalletTimoutAndHint(this.$('#unlockTimeout').val(), 0);
  }

  updateWalletTimoutAndHint(currentStr, addValue) {
    if (currentStr === '' && addValue === 0) {
      this.setState({
        timePeriodHelper: app.polyglot.t('wallet.manage.lockWalletIndefinitely'),
        walletUnlockTimeout: addValue });
    } else {
      const newValue = parseInt(currentStr || '0', 10) + addValue;
      const timePeriod = moment.duration(newValue * 1000).humanize();
      this.setState({
        timePeriodHelper:
          app.polyglot.t('wallet.manage.lockWalletForParticularTime', { timePeriod }),
        walletUnlockTimeout: newValue });
    }
  }

  render() {
    const state = this.getState();

    loadTemplate('modals/wallet/unlockPopUp.html', t => {
      this.$el.html(t({ ...state }));
    });

    return super.render();
  }

}
