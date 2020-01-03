import _ from 'underscore';
import $ from 'jquery';

import BaseModal from '../BaseModal';
import loadTemplate from '../../../utils/loadTemplate';
import WalletSeed from '../Settings/advanced/WalletSeed';
import { recordEvent } from '../../../utils/metrics';
import app from '../../../app';
import { openSimpleMessage } from '../SimpleMessage';


export default class extends BaseModal {
  constructor(options = {}) {
    super(options);
  }

  downloadSeedWords() {
    if (this.walletSeedFetch && this.walletSeedFetch.state() === 'pending') {
      return this.walletSeedFetch;
    }

    if (this.walletSeed) this.walletSeed.setState({ isFetching: true });

    this.walletSeedFetch = $.get(app.getServerUrl('wallet/mnemonic')).done((data) => {
      this.mnemonic = data.mnemonic;
      this.isEncrypted = data.isEncrypted;

      if (this.walletSeed) {
        this.walletSeed.setState({ seed: data.mnemonic, isEncrypted: data.isEncrypted });
      }
    }).always(() => {
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

  open(...args) {
    return super.open(...args);
  }

  render() {
    super.render();

    loadTemplate('modals/wallet/unlockWallet.html', t => {
      this.$el.html(t({}));

      if (this.walletSeed) this.walletSeed.remove();
      this.walletSeed = this.createChild(WalletSeed, {
        initialState: {
          seed: this.mnemonic || '',
          isEncrypted: this.isEncrypted || false,
          isFetching: this.walletSeedFetch && this.walletSeedFetch.state() === 'pending',
        },
      });

      this.downloadSeedWords();
      this.getCachedEl('.js-walletSeedContainer').append(this.walletSeed.render().el);
    });
    return this;
  }
}
