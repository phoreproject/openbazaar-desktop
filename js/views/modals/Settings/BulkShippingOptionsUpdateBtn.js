import $ from 'jquery';
import baseVw from '../../baseVw';
import loadTemplate from '../../../utils/loadTemplate';

import {
  isBulkShippingOptionsUpdating,
  events as bulkShippingOptionsUpdateEvents,
} from '../../../utils/bulkShippingOptionsUpdate';

export default class extends baseVw {
  constructor(options = {}) {
    const opts = {
      ...options,
      className: 'bulkCoinUpdateBtn flex gutterH',
      initialState: {
        isBulkShippingOptionsUpdating: isBulkShippingOptionsUpdating(),
        error: '',
        ...options.initialState,
      },
    };
    super(opts);

    this.listenTo(bulkShippingOptionsUpdateEvents,
      'bulkShippingOptionsUpdateDone bulkShippingOptionsUpdateFailed',
      () => this.setState({ isBulkShippingOptionsUpdating: false }));

    this.boundOnDocClick = this.onDocumentClick.bind(this);
    $(document).on('click', this.boundOnDocClick);
  }

  events() {
    return {
      'click .js-applyToCurrent': 'clickApplyToCurrent',
      'click .js-applyToCurrentCancel': 'clickApplyToCurrentCancel',
      'click .js-applyToCurrentConfirm': 'clickApplyToCurrentConfirm',
    };
  }

  startProcessingTimer() {
    if (!this.processingTimer) {
      this.processingTimer = setTimeout(() => {
        this.processingTimer = null;
        // If the update is still pending, let it set the isBulkShippingOptionsUpdating state.
        if (!isBulkShippingOptionsUpdating()) {
          this.setState({ isBulkShippingOptionsUpdating: false });
        }
      }, 500);
    }
  }

  setState(state = {}, options = {}) {
    // When the state is set to processing, start a timer so it's visible even if it's very short.
    if (state.isBulkShippingOptionsUpdating) this.startProcessingTimer();

    // If the state is set to stop processing, let the timer finish.
    if (state.hasOwnProperty('isBulkShippingOptionsUpdating') &&
      !state.isBulkShippingOptionsUpdating &&
      this.processingTimer) {
      delete state.isBulkShippingOptionsUpdating;
    }

    super.setState(state, options);
  }

  clickApplyToCurrent() {
    this.setState({ showConfirmTooltip: true });
    return false;
  }

  clickApplyToCurrentCancel() {
    this.setState({ showConfirmTooltip: false });
    return false;
  }

  clickApplyToCurrentConfirm() {
    this.trigger('bulkShippingOptionsUpdateConfirm');
    return false;
  }

  onDocumentClick(e) {
    if (this.getState().showConfirmTooltip &&
      !$(e.target).hasClass('js-confirmBox') &&
      !($.contains(this.getCachedEl('.js-confirmBox')[0], e.target))) {
      this.setState({ showConfirmTooltip: false });
    }
  }

  remove() {
    $(document).off('click', this.boundOnDocClick);
    clearTimeout(this.processingTimer);
    super.remove();
  }

  render() {
    super.render();

    loadTemplate('modals/settings/bulkShippingOptionsUpdateBtn.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
      }));
    });

    return this;
  }
}
