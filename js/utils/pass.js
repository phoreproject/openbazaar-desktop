import { openSimpleMessage } from '../views/modals/SimpleMessage';
import app from '../app';


export function getPasswordIfCorrect(password, password2, isEncrypted) {
  if (!isEncrypted && password !== password2) {
    openSimpleMessage(
      app.polyglot.t('settings.advancedTab.server.walletManager.passwordsNotEqual'));
    return null;
  }

  if (password.length < 8) {
    openSimpleMessage(app.polyglot.t('settings.advancedTab.server.walletManager.shortPassword'),
      app.polyglot.t('settings.advancedTab.server.walletManager.passwordLenNotify'));
    return null;
  }

  return password;
}


export function getPasswordError(password, password2) {
  if (password !== password2) {
    return app.polyglot.t('settings.advancedTab.server.walletManager.passwordsNotEqual');
  }

  if (password.length < 8) {
    return app.polyglot.t('settings.advancedTab.server.walletManager.shortPassword');
  }

  return null;
}
