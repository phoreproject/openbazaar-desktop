import { clipboard } from 'electron';
import qr from 'qr-encode';
import app from '../../../app';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import {
  isSupportedWalletCur,
  getCurrencyByCode,
} from '../../../data/walletCurrencies';
import { getWallet, launchWallet } from '../../../utils/modalManager';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';


let hiderTimer;

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        showCoin: 'PHR',
        ...options.initialState,
      },
    };

    super({
      className: 'aboutDonations',
      ...opts,
    });
    this.options = opts;

    const phrAddress = 'PRZsB1sNgJXeKeC7sx5YJBfRS3Cz9RyCcF';
    const phrQRAddress = getCurrencyByCode('PHR').qrCodeText(phrAddress);

    this.dCoins = {
      PHR: {
        obDonationAddress: phrQRAddress,
        qrCodeDataURI: qr(phrQRAddress, { type: 6, size: 6, level: 'Q' }),
        walletSupported: isSupportedWalletCur('PHR'),
      },
    };
  }

  events() {
    return {
      'click .js-copyAddress': 'copyDonationAddress',
      'click .js-openInWallet': 'openInWalletClick',
      'click .js-phr': 'showPHR',
    };
  }

  showPHR() {
    this.setState({ showCoin: 'PHR' });
  }

  copyDonationAddress() {
    const addr = this.dCoins[this.getState().showCoin].obDonationAddress;
    clipboard.writeText(addr);
    const copyNotif = this.getCachedEl('.js-copyNotification');

    copyNotif.addClass('active');
    if (!!hiderTimer) {
      clearTimeout(hiderTimer);
    }
    hiderTimer = setTimeout(() => copyNotif.removeClass('active'), 3000);
  }

  openInWalletClick() {
    let wallet = getWallet();

    if (!wallet) {
      wallet = launchWallet({
        initialActiveCoin: this.getState().showCoin,
        initialSendModeOn: true,
      });
    }

    const sendView = wallet.getSendMoneyVw();

    if (sendView.saveInProgress) {
      openSimpleMessage(
        app.polyglot.t('about.donationsTab.unableToOpenInWallet.title'),
        app.polyglot.t('about.donationsTab.unableToOpenInWallet.body')
      );
    } else {
      const state = this.getState();
      wallet.activeCoin = state.showCoin;
      wallet.sendModeOn = true;
      sendView
        .setFormData({ address: this.dCoins[state.showCoin].obDonationAddress });
      wallet.open();
    }
  }

  render() {
    super.render();
    const showCoin = this.getState().showCoin;
    loadTemplate('modals/about/donations.html', (t) => {
      this.$el.html(t({
        showCoin,
        ...this.dCoins[showCoin],
      }));
    });

    return this;
  }
}

