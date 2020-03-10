import $ from 'jquery';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import app from '../../../app';
import { openSimpleMessage } from '../../modals/SimpleMessage';


export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      temporaryUnlock: false,
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
      url: app.getServerUrl('manage/initwallet'),
      data: JSON.stringify({ password, skipCrypt: this.options.temporaryUnlock }),
      dataType: 'json',
      contentType: 'application/json',
    }).done((data) => {
      if (data.isLocked === 'false') {
        this.walletUnlocked.resolve();
      } else {
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.walletManager.dialogFailTitle'));
      }
    }).fail(xhr => {
      openSimpleMessage(app.polyglot.t('settings.advancedTab.server.walletManager.dialogFailTitle'),
        xhr && xhr.responseJSON && xhr.responseJSON.reason || '');
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
