import $ from 'jquery';
import { Events } from 'backbone';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import app from '../app';

const events = {
  ...Events,
};

export { events };

let bulkTermsUpdateSave;

export function isBulkTermsUpdating() {
  return bulkTermsUpdateSave && bulkTermsUpdateSave.state() === 'pending';
}

export function bulkTermsUpdate(terms) {
  if (terms === undefined) {
    throw new Error('Please provide a string with terms.');
  }

  if (isBulkTermsUpdating()) {
    throw new Error('An update is in process, new updates must wait until it is finished.');
  } else {
    events.trigger('bulkTermsUpdating');
    bulkTermsUpdateSave = $.post({
      url: app.getServerUrl('ob/bulkupdatetermsandconditions'),
      data: JSON.stringify({ termsAndConditions: terms }),
      dataType: 'json',
    }).done(() => {
      events.trigger('bulkTermsUpdateDone');
    }).fail((xhr) => {
      const reason = xhr.responseJSON && xhr.responseJSON.reason || xhr.statusText || '';
      const message =
        app.polyglot.t('settings.storeTab.bulkListingTermsUpdate.errors.errorMessage');
      const title = app.polyglot.t('settings.storeTab.bulkListingTermsUpdate.errors.errorTitle');
      const reasonMsg =
        app.polyglot.t(
          'settings.storeTab.bulkListingTermsUpdate.errors.reasonForError', { reason });
      const msg = `${message} ${reason ? `<br>${reasonMsg}` : ''}`;
      openSimpleMessage(title, msg);
      events.trigger('bulkTermsUpdateFailed');
    });
  }

  return bulkTermsUpdateSave;
}
