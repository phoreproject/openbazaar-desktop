import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        start: 1,
        ...options.initialState,
      },
    };

    super(opts);
  }

  className() {
    return 'pageControlsWrapper overflowAuto';
  }

  events() {
    return {
      'click .js-pageCnt': 'onPageClick',
    };
  }

  onPageClick(ev) {
    this.trigger('onPageClick', this.$el(ev.currentTarget).data('page'));
  }

  render() {
    loadTemplate('components/pageControls.html', (t) => {
      this.$el.html(t({
        type: this.type,
        ...this.getState(),
      }));
    });

    return this;
  }
}
