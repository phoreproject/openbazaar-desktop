import baseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';


export default class extends baseVw {
  constructor(options = {}) {
    super({
      className: 'settingsWallet',
      ...options,
    });
  }


  render() {
    super.render();
    loadTemplate('modals/settings/wallet.html', (t) => {
      this.$el.html(t({
      }));
    });

    return this;
  }
}
