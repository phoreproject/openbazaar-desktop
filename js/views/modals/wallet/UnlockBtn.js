import baseView from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';


export default class extends baseView {
  constructor(options = {}) {
    const opts = {
      ...options,
      initialState: {
        unlockBtnVisible: false,
        ...options.initialState || {},
      },
    };

    super(opts);
    this.options = opts;
  }

  className() {
    return 'unlockBtn';
  }

  events() {
    return {
    };
  }

  render() {
    super.render();
    const state = this.getState();

    loadTemplate('modals/wallet/unlockBtn.html', t => {
      this.$el.html(t({ ...state }));
    });

    return this;
  }

}
