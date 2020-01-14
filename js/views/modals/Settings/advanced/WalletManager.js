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
    this.manageSeedStatus('manage/lockwallet', 'true');
  }

  onClickUnlockWallet() {
    this.manageSeedStatus('manage/unlockwallet', 'false');
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

  getPasswordIfCorrect() {
    const password = this.$('#seedPassword').val();
    const password2 = this.$('#seedPassword2').val();

    if (this._state.isEncrypted === false && password !== password2) {
      openSimpleMessage(
        app.polyglot.t('settings.advancedTab.server.walletManager.passwordsNotEqual'));
      return null;
    }

    if (password.length < 8) {
      openSimpleMessage(app.polyglot.t('settings.advancedTab.server.walletManager.shortPassword'),
        app.polyglot.t('settings.advancedTab.server.walletManager.passwordLenNotify'));
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
