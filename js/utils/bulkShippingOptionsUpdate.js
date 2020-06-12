import $ from 'jquery';
import { Events } from 'backbone';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import app from '../app';

const events = {
  ...Events,
};

export { events };

let bulkShippingOptionsUpdateSave;

export function isBulkShippingOptionsUpdating() {
  return bulkShippingOptionsUpdateSave && bulkShippingOptionsUpdateSave.state() === 'pending';
}

export function bulkShippingOptionsUpdate(shippingOptions) {
  if (shippingOptions === undefined) {
    throw new Error('Please provide shipping options.');
  }

  if (isBulkShippingOptionsUpdating()) {
    throw new Error('An update is in process, new updates must wait until it is finished.');
  } else {
    events.trigger('bulkShippingOptionsUpdating');
    bulkShippingOptionsUpdateSave = $.post({
      url: app.getServerUrl('ob/bulkupdateshippingoptions'),
      data: JSON.stringify({ shippingOptions }),
      dataType: 'json',
    }).done(() => {
      events.trigger('bulkShippingOptionsUpdateDone');
    }).fail((xhr) => {
      const reason = xhr.responseJSON && xhr.responseJSON.reason || xhr.statusText || '';
      const message =
        app.polyglot.t('settings.storeTab.bulkListingShippingOptionsUpdate.errors.errorMessage');
      const title = app.polyglot.t(
        'settings.storeTab.bulkListingShippingOptionsUpdate.errors.errorTitle');
      const reasonMsg =
        app.polyglot.t(
          'settings.storeTab.bulkListingShippingOptionsUpdate.errors.reasonForError', { reason });
      const msg = `${message} ${reason ? `<br>${reasonMsg}` : ''}`;
      openSimpleMessage(title, msg);
      events.trigger('bulkShippingOptionsUpdateFailed');
    });
  }

  return bulkShippingOptionsUpdateSave;
}
