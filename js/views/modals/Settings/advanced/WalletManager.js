import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';
import app from '../../../../app';
import { openSimpleMessage } from '../../SimpleMessage';
import { getPasswordIfCorrect } from '../../../../utils/pass';
import { getWallet } from '../../../../utils/modalManager';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        isEncrypted: '',
        isFetching: false,
        wasFetched: false,
        ...options.initialState || {},
      },
      ...options,
    };

    super(opts);
    this.listenTo(this.model, 'change', () => this.render());
  }

  setState(state = {}, options = {}) {
    super.setState(state, options);
    this.isEncryptedChanged();
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
    this.changeSeedStatus('true');
  }

  onClickUnlockWallet() {
    this.changeSeedStatus('false');
  }

  isEncryptedChanged() {
    if (this._state.isEncrypted === true) {
      this.$('.js-lock').addClass('disabled');
      this.$('.js-unlock').removeClass('disabled');
      this.$('#seedPassword2').addClass('disabled');
      this.$('#seedPassword2').val('');
    } else if (this._state.isEncrypted === false) {
      this.$('.js-lock').removeClass('disabled');
      this.$('.js-unlock').addClass('disabled');
      this.$('#seedPassword2').removeClass('disabled');
    }
  }

  getStringFromStatus(isLocked) {
    return isLocked === 'true' ?
      app.polyglot.t('settings.advancedTab.server.walletManager.encrypted') :
      app.polyglot.t('settings.advancedTab.server.walletManager.decrypted');
  }

  changeSeedStatus(isLocked) {
    const password = getPasswordIfCorrect(this.$('#seedPassword')
        .val(),
      this.$('#seedPassword2')
        .val(), this.getState().isEncrypted);
    if (!password) {
      return;
    }

    const wallet = getWallet();
    let promise = undefined;
    if (isLocked === 'true') {
      promise = wallet.lockWallet(password, false);
    } else {
      promise = wallet.unlockWallet(password, 0, false);
    }

    promise.done((data) => {
      if (data.isLocked !== isLocked) {
        const title = app.polyglot.t('settings.advancedTab.server.walletManager.dialogFailTitle');
        const message = app.polyglot.t('settings.advancedTab.server.walletManager.dialogFailMsg',
          {
            shouldBe: this.getStringFromStatus(isLocked),
            is: this.getStringFromStatus(data.isLocked),
          });
        openSimpleMessage(title, message);
      } else {
        this.setState({ isEncrypted: data.isLocked === 'true' });
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.walletManager.dialogSuccessTitle'),
          app.polyglot.t('settings.advancedTab.server.walletManager.dialogSuccessMsg',
            { isLocked: this.getStringFromStatus(isLocked) }));
      }
    })
      .fail(xhr => {
        openSimpleMessage(
          '',
          xhr.responseJSON && xhr.responseJSON.reason || ''
        );
      });
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
