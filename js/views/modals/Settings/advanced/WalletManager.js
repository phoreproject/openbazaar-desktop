import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';
import $ from 'jquery';
import app from '../../../../app';
import { openSimpleMessage } from '../../SimpleMessage';

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
    this.manageSeedStatus('manage/lockwallet', 'true');
  }

  onClickUnlockWallet() {
    this.manageSeedStatus('manage/unlockwallet', 'false');
  }

  getPasswordIfCorrect() {
    const password = this.$('#seedPassword').val();
    const password2 = this.$('#seedPassword2').val();

    if (password !== password2) {
      openSimpleMessage('Passwords are not equal', '');
      return null;
    }

    if (password.length < 8) {
      openSimpleMessage('Your password is too short',
        'The password length should be at least 8 characters long');
      return null;
    }

    return password;
  }

  getStringFromStatus(isLocked) {
    return isLocked === 'true' ?
      app.polyglot.t('settings.advancedTab.server.walletManager.encrypted') :
      app.polyglot.t('settings.advancedTab.server.walletManager.decrypted');
  }

  manageSeedStatus(url, isLocked) {
    const password = this.getPasswordIfCorrect();
    if (!password) {
      return null;
    }

    if (this.walletManageRequest && this.walletManageRequest.state() === 'pending') {
      return this.walletManageRequest;
    }

    this.walletManageRequest = $.post({
      url: app.getServerUrl(url),
      data: JSON.stringify({ password }),
      dataType: 'json',
      contentType: 'application/json',
    })
      .done((data) => {
        if (data.isLocked !== isLocked) {
          const title = app.polyglot.t('settings.advancedTab.server.walletManager.dialogFailTitle');
          const message = app.polyglot.t('settings.advancedTab.server.walletManager.dialogFailMsg',
            { shouldBe: this.getStringFromStatus(isLocked),
              is: this.getStringFromStatus(data.isLocked) });
          openSimpleMessage(title, message);
        } else {
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

    return this.walletManageRequest;
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
