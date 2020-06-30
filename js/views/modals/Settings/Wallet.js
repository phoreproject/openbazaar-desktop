import baseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';
import { recordEvent } from '../../../utils/metrics';
import $ from 'jquery';
import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';
import WalletSeed from './advanced/WalletSeed';
import WalletManager from './advanced/WalletManager';


export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsWallet',
      ...options,
    });
  }


  onClickShowSeed() {
    if (this.walletSeed) this.walletSeed.setState({ isFetching: true });

    recordEvent('Settings_Advanced_ShowSeed');

    if (this.walletSeedFetch && this.walletSeedFetch.state() === 'pending') {
      return this.walletSeedFetch;
    }

    this.walletSeedFetch = $.get(app.getServerUrl('wallet/mnemonic'))
      .done((data) => {
        this.isEncrypted = data.isEncrypted === 'true';
        if (this.walletSeed) {
          this.walletSeed.setState({ seed: data.mnemonic, isEncrypted: this.isEncrypted });
          if (this.hideMnemonicTimer) {
            clearTimeout(this.hideMnemonicTimer);
          }
          this.hideMnemonicTimer = setTimeout(() => {
            this.walletSeed.onClickHideSeed();
          }, 2 * 60 * 1000);
        }
      })
      .always(() => {
        if (this.walletSeed) this.walletSeed.setState({ isFetching: false });
      })
      .fail(xhr => {
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.unableToFetchSeedTitle'),
          xhr.responseJSON && xhr.responseJSON.reason || ''
        );
      });

    return this.walletSeedFetch;
  }

  onClickShowManager() {
    if (this.walletManager) this.walletManager.setState({ isFetching: true });

    recordEvent('Settings_Advanced_ShowManager');

    if (this.walletEncryptionStatusFetch &&
      this.walletEncryptionStatusFetch.state() === 'pending') {
      return this.walletEncryptionStatusFetch;
    }

    this.walletEncryptionStatusFetch = $.get(app.getServerUrl('manage/iswalletlocked'))
      .done((data) => {
        this.isEncrypted = data.isLocked === 'true';
        if (this.walletManager) {
          this.walletManager.setState({ isEncrypted: this.isEncrypted, wasFetched: true });
        }
      })
      .always(() => {
        if (this.walletManager) this.walletManager.setState({ isFetching: false });
      })
      .fail(xhr => {
        openSimpleMessage(
          app.polyglot.t('settings.advancedTab.server.unableToFetchSeedStatus'),
          xhr.responseJSON && xhr.responseJSON.reason || ''
        );
      });

    return this.walletEncryptionStatusFetch;
  }

  render() {
    super.render();
    loadTemplate('modals/settings/wallet.html', (t) => {
      this.$el.html(t({
      }));


      if (this.walletSeed) this.walletSeed.remove();
      this.walletSeed = this.createChild(WalletSeed, {
        initialState: {
          isEncrypted: this.isEncrypted || false,
          isFetching: this.walletSeedFetch && this.walletSeedFetch.state() === 'pending',
        },
      });
      this.listenTo(this.walletSeed, 'clickShowSeed', this.onClickShowSeed);
      this.getCachedEl('.js-walletSeedContainer')
        .append(this.walletSeed.render().el);

      if (this.walletManager) this.walletManager.remove();
      this.walletManager = this.createChild(WalletManager, {
        initialState: {
          isEncrypted: this.isEncrypted || null,
          isFetching: this.walletSeedFetch && this.walletSeedFetch.state() === 'pending',
        },
      });
      this.listenTo(this.walletManager, 'clickShowManager', this.onClickShowManager);
      this.getCachedEl('.js-walletManagement')
        .append(this.walletManager.render().el);
    });

    return this;
  }
}
