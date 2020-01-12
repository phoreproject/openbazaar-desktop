import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import app from '../../../app';


export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      title: '',
      message: '',
      removeOnClose: true,
      dismissOnOverlayClick: false,
      dismissOnEscPress: false,
      showCloseButton: false,
      defaultBtnClass: 'flexExpand btnFlx clrP',
      ...options,
    };

    super(opts);
    this.options = opts;

    this.walletUnlocked = $.Deferred();
  }

  get events() {
    return {
      'click .js-unlock': 'onUnlockClick',
    };
  }

  className() {
    return 'unlockSeed';
  }

  onUnlockClick() {
    const password = this.$('#seedPassword').val();
    this.walletSeedFetch = $.post({
      url: app.getServerUrl('manage/unlockwallet'),
      data: JSON.stringify({ password }),
      dataType: 'json',
      contentType: 'application/json',
    }).done((data) => {
      if (data.isLocked === 'false') {
        this.walletUnlocked.resolve();
      } else {
        this.trigger('seed-unlock-failed', 'Wallet is still locked');
      }
    }).fail(xhr => {
      this.trigger('seed-unlock-failed', xhr && xhr.responseJSON && xhr.responseJSON.reason || '');
    });
  }

  waitForWalletUnlock() {
    return this.walletUnlocked.promise();
  }

  render() {
    loadTemplate('modals/wallet/unlockSeed.html', (t) => {
      this.$el.html(t(this.options));

      super.render();
    });

    return this;
  }
}
