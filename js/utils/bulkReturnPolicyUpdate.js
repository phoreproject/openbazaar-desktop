import $ from 'jquery';
import { Events } from 'backbone';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import app from '../app';

const events = {
  ...Events,
};

export { events };

let bulkReturnPolicyUpdateSave;

export function isBulkReturnPolicyUpdating() {
  return bulkReturnPolicyUpdateSave && bulkReturnPolicyUpdateSave.state() === 'pending';
}

export function bulkReturnPolicyUpdate(returnPolicy) {
  if (returnPolicy === undefined) {
    throw new Error('Please provide a string with return policy.');
  }

  if (isBulkReturnPolicyUpdating()) {
    throw new Error('An update is in process, new updates must wait until it is finished.');
  } else {
    events.trigger('bulkReturnPolicyUpdating');
    bulkReturnPolicyUpdateSave = $.post({
      url: app.getServerUrl('ob/bulkupdatereturnpolicy'),
      data: JSON.stringify({ returnPolicy }),
      dataType: 'json',
    }).done(() => {
      events.trigger('bulkReturnPolicyUpdateDone');
    }).fail((xhr) => {
      const reason = xhr.responseJSON && xhr.responseJSON.reason || xhr.statusText || '';
      const message =
        app.polyglot.t('settings.storeTab.bulkListingReturnPolicyUpdate.errors.errorMessage');
      const title = app.polyglot.t(
        'settings.storeTab.bulkListingReturnPolicyUpdate.errors.errorTitle');
      const reasonMsg =
        app.polyglot.t(
          'settings.storeTab.bulkListingReturnPolicyUpdate.errors.reasonForError', { reason });
      const msg = `${message} ${reason ? `<br>${reasonMsg}` : ''}`;
      openSimpleMessage(title, msg);
      events.trigger('bulkReturnPolicyUpdateFailed');
    });
  }

  return bulkReturnPolicyUpdateSave;
}
