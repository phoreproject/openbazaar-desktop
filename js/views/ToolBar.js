import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import Dialog from './modals/Dialog';
import app from '../app';


export default class extends BaseVw {

  constructor(options) {
    const opts = {
      events: {
        'click .js-lockWallet': 'lockWalletClick',
      },
      ...options,
    };
    super(opts);
  }

  lockWalletClick() {
    this.passwordInputDialog = this.createChild(Dialog, {
      removeOnClose: false,
      title: app.polyglot.t('editListing.confirmCloseDialog.title'),
      message: 'message',
      buttons: [{
        text: app.polyglot.t('editListing.confirmCloseDialog.btnNo'),
        fragment: 'no',
      }, {
        text: app.polyglot.t('editListing.confirmCloseDialog.btnYes'),
        fragment: 'yes',
      }],
    }).render()
      .open();
  }

  render() {
    loadTemplate('toolBar.html', (t) => {
      this.$el.html(t({}));
    });

    super.render();

    return this;
  }
}
