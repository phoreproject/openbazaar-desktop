import loadTemplate from '../../../../utils/loadTemplate';
import BaseVw from '../../../baseVw';

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
    return 'walletSeed gutterH';
  }

  events() {
    return {
      'click .js-showSeed': 'onClickShowSeed',
      'click .js-hideSeed': 'onClickHideSeed',
    };
  }

  onClickShowSeed() {
    this.trigger('clickShowSeed');
  }

  onClickHideSeed() {
    this.setState({ seed: '' });
    this.trigger('clickHideSeed');
  }

  render() {
    super.render();

    loadTemplate('modals/settings/advanced/walletSeed.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
