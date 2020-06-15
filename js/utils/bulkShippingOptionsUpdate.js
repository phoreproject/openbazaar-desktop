import $ from 'jquery';
import { Events } from 'backbone';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import app from '../app';
import { decimalToInteger } from './currency';

const events = {
  ...Events,
};

export { events };

let bulkShippingOptionsUpdateSave;

export function isBulkShippingOptionsUpdating() {
  return bulkShippingOptionsUpdateSave && bulkShippingOptionsUpdateSave.state() === 'pending';
}

export function bulkShippingOptionsUpdate(listingModel) {
  if (listingModel === undefined) {
    throw new Error('Please provide shipping options.');
  }

  if (isBulkShippingOptionsUpdating()) {
    throw new Error('An update is in process, new updates must wait until it is finished.');
  } else {
    events.trigger('bulkShippingOptionsUpdating');

    const listing = listingModel.toJSON();

    // const shippingOptionsJSON = shippingOptions.toJSON();
    listing.shippingOptions.forEach(shipOpt => {
      shipOpt.services.forEach(service => {
        if (typeof service.price === 'number') {
          service.price = decimalToInteger(service.price, 'USD');
        }

        if (typeof service.additionalItemPrice === 'number') {
          service.additionalItemPrice = decimalToInteger(service.additionalItemPrice, 'USD');
        }
      });
    });

    bulkShippingOptionsUpdateSave = $.post({
      url: app.getServerUrl('ob/bulkupdateshippingoptions'),
      data: JSON.stringify(listing),
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
