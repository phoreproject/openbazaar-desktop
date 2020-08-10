import $ from 'jquery';
import 'cropit';
import '../../../lib/select2';
import app from '../../../app';
import { getCurrentConnection } from '../../../utils/serverConnect';
import { getTranslatedCountries } from '../../../data/countries';
import { getCurrencies } from '../../../data/currencies';
import { openSimpleMessage } from '../SimpleMessage';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import { getPasswordIfCorrect } from '../../../utils/pass';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      dismissOnEscPress: false,
      showCloseButton: false,
      initialState: {
        screen: 'intro',
        saveInProgress: false,
        encryptionInProgress: false,
        isSeedEncrypted: false,
        seed: '',
        ...options.initialState,
      },
      ...options,
    };

    super(opts);
    this.options = opts;
    this.screens = ['intro', 'info', 'seed', 'backupSeed', 'encrypt', 'tos'];
    this.lastAvatarImageRotate = 0;
    this.avatarChanged = false;
    this.countryList = getTranslatedCountries();
    this.currencyList = getCurrencies();
    this.seedsWordsBackupOrder = {};
  }

  className() {
    return `${super.className()} onboarding modalScrollPage modalMedium`;
  }

  events() {
    return {
      'click .js-changeServer': 'onClickChangeServer',
      'click .js-getStarted': 'onClickGetStarted',
      'click .js-navBack': 'onClickNavBack',
      'click .js-navNext': 'onClickNavNext',
      'click .js-navSkip': 'onClickNavSkip',
      'click .js-avatarLeft': 'onAvatarLeftClick',
      'click .js-avatarRight': 'onAvatarRightClick',
      'click .js-changeAvatar': 'onClickChangeAvatar',
      'click .js-tosAgree': 'onClickTosAgree',
      'dragstart .js-seedBackupDraggable': 'onDragStart',
      'click .js-seedBackupDraggable': 'onDraggableClick',
      'dragover .js-seedBackupDroppable': 'onDragOver',
      'drop .js-seedBackupDroppable': 'onDrop',
      ...super.events(),
    };
  }

  onClickChangeServer() {
    app.connectionManagmentModal.open();
  }

  onClickGetStarted() {
    this.setState({ screen: 'info' });
  }

  onClickNavBack() {
    const curScreen = this.getState().screen;
    let newScreen = this.screens[this.screens.indexOf(curScreen) - 1];

    if (curScreen === 'info') {
      this.setModelsFromForm();
    }

    if (curScreen === 'tos' && this.options.isSeedEncrypted) {
      // Seed is encrypted, so we don't need to encrypt it again. Skip this window.
      newScreen = this.screens[this.screens.indexOf(newScreen) - 1];
    }

    this.setState({
      screen: newScreen,
    });
  }

  onClickNavNext() {
    const curScreen = this.getState().screen;
    let newScreen = this.screens[this.screens.indexOf(curScreen) + 1];

    if (curScreen === 'info') {
      this.setModelsFromForm();

      if (this.options.isSeedEncrypted) {
        // Seed is encrypted, so we don't need to encrypt it again. Skip this window.
        newScreen = this.screens[this.screens.indexOf(newScreen) + 1];
      }

      app.profile.set({}, { validate: true });
      app.settings.set({}, { validate: true });

      if (app.settings.validationError || app.profile.validationError) {
        this.render();
        return;
      }
    }

    if (curScreen === 'backupSeed') {
      const success = this.checkSeedBackup();
      if (!success) {
        return;
      }
    }

    if (curScreen === 'encrypt') {
      const password = getPasswordIfCorrect(this.$('#seedPassword').val(),
        this.$('#seedPassword2').val(), false);
      if (!password) {
        return;
      }

      this.setState({ encryptionInProgress: true });
      this.encryptWallet(password).done((seedStatus) => {
        if (seedStatus.isLocked === 'true') {
          this.setState({ screen: 'tos', isSeedEncrypted: seedStatus.isLocked === 'true' });
        }
      }).always(() => {
        this.setState({ encryptionInProgress: false });
      });
      return;
    }

    this.setState({ screen: newScreen });
  }

  onClickNavSkip() {
    const curScreen = this.getState().screen;
    const newScreen = this.screens[this.screens.indexOf(curScreen) + 1];
    this.setState({ screen: newScreen });
  }

  onClickChangeAvatar() {
    this.getCachedEl('#avatarInput')[0].click();
  }

  onAvatarLeftClick() {
    this.avatarRotate(-1);
  }

  onAvatarRightClick() {
    this.avatarRotate(1);
  }

  onClickTosAgree() {
    this.setState({ saveInProgress: true });

    const profileSave = app.profile.save({}, {
      type:
        Object.keys(app.profile.lastSyncedAttrs).length ?
          'PUT' : 'POST',
    });

    const settingsSave = app.settings.save({}, {
      type:
        Object.keys(app.settings.lastSyncedAttrs).length ?
          'PUT' : 'POST',
    });

    const saves = [profileSave, settingsSave];

    if (this.avatarChanged) {
      const avatarSave = this.saveAvatar()
        .done(avatarData => app.profile.set('avatarHashes', avatarData));
      saves.push(avatarSave);
    }

    $.when(...saves).done(() => {
      this.trigger('onboarding-complete');
    }).fail((jqXhr) => {
      let title;

      if (jqXhr === profileSave) {
        title = app.polyglot.t('onboarding.profileFailedSaveTitle');
      } else if (jqXhr === settingsSave) {
        title = app.polyglot.t('onboarding.settingsFailedSaveTitle');
      } else {
        title = app.polyglot.t('onboarding.settingsFailedSaveAvatar');
      }

      openSimpleMessage(title, jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
    })
    .always(() => {
      this.setState({ saveInProgress: false });
    });
  }

  setModelsFromForm() {
    const $settingsFields = this.getCachedEl('select[data-model=settings], ' +
      'input[data-model=settings], textarea[data-model=settings]');
    app.settings.set(this.getFormData($settingsFields));
    const $profileFields = this.getCachedEl('select[data-model=profile], ' +
      'input[data-model=profile], textarea[data-model=profile]');
    app.profile.set(this.getFormData($profileFields));
  }

  saveAvatar() {
    if (!this.avatarExport) {
      throw new Error('Unable to save the avatar because the export ' +
        'data is not available');
    }

    const avatarData = JSON.stringify(
      { avatar: this.avatarExport.replace(/^data:image\/(png|jpeg|webp);base64,/, '') });

    return $.ajax({
      type: 'POST',
      url: app.getServerUrl('ob/avatar/'),
      contentType: 'application/json; charset=utf-8',
      data: avatarData,
      dataType: 'json',
    });
  }

  avatarRotate(direction) {
    if (this.$avatarCropper.cropit('imageSrc')) {
      this.$avatarCropper.cropit(direction > 0 ? 'rotateCW' : 'rotateCCW');

      // normalize so this.lastAvatarImageRotate is a positive number between 0 and 3
      this.lastAvatarImageRotate = (this.lastAvatarImageRotate + direction) % 4;
      if (this.lastAvatarImageRotate === -1) {
        this.lastAvatarImageRotate = 3;
      } else if (this.lastAvatarImageRotate === -2) {
        this.lastAvatarImageRotate = 2;
      } else if (this.lastAvatarImageRotate === -3) {
        this.lastAvatarImageRotate = 1;
      }
    }
  }

  checkSeedBackup() {
    const correctSeed = this.options.seed.split(' ');
    if (Object.entries(this.seedsWordsBackupOrder).length !== correctSeed.length) {
      openSimpleMessage(
        app.polyglot.t('onboarding.backupSeedScreen.seedBackupIncorrect'),
        app.polyglot.t('onboarding.backupSeedScreen.notAllSeedWordsAreSpecified')
      );
      return false;
    }

    for (let i = 0; i < correctSeed.length; i++) {
      if (this.seedsWordsBackupOrder[i] !== correctSeed[i]) {
        openSimpleMessage(
          app.polyglot.t('onboarding.backupSeedScreen.seedBackupIncorrect'),
          app.polyglot.t('onboarding.backupSeedScreen.oneOfTheSeedWordsIsIncorrect')
        );
        return false;
      }
    }

    return true;
  }

  encryptWallet(password) {
    const promise = $.Deferred();
    $.post({
      url: app.getServerUrl('manage/lockwallet'),
      data: JSON.stringify({ password }),
      dataType: 'json',
      contentType: 'application/json',
    }).done((data) => {
      promise.resolve(data);
    })
    .fail(xhr => {
      promise.reject();
      openSimpleMessage(
        '',
        xhr.responseJSON && xhr.responseJSON.reason || ''
      );
    });

    return promise.promise();
  }

  onDragStart(event) {
    event
      .originalEvent
      .dataTransfer
      .setData('text/plain', event.target.id);
  }

  onDragOver(event) {
    event.preventDefault();
  }

  onDrop(event) {
    const id = event
      .originalEvent
      .dataTransfer
      .getData('text'); // source event
    const draggableElementJQ = this.getCachedEl(`#${id}`);
    const dropZoneJQ = this.getCachedEl(`#${event.target.id}`); // target view.
    if (dropZoneJQ.hasClass('js-seedBackupDraggable')) {
      // Do not drop from draggable to draggable;
      return;
    }

    if (dropZoneJQ.children().length >= 1) {
      // One div can contain only 1 word.
      return;
    }
    dropZoneJQ.append(draggableElementJQ);

    const targetId = parseInt(event.target.id.split('_')[1], 10);
    this.seedsWordsBackupOrder[targetId] = draggableElementJQ.text();

    event
      .originalEvent
      .dataTransfer
      .clearData();
  }

  onDraggableClick(event) {
    const draggableId = event.target.id.split('_')[1];
    const draggableOriginalParentJQ = this.getCachedEl(
      `#js-seedBackupDraggableParent_${draggableId}`);
    if ($.contains(draggableOriginalParentJQ[0], event.target)) {
      // Draggable in original place, do nothing.
      return;
    }

    const draggableElementJQ = this.getCachedEl(`#${event.target.id}`);
    const currentDraggableParentJQ = draggableElementJQ.parent();
    const currentDraggableParentId = currentDraggableParentJQ.attr('id').split('_')[1];
    if (this.seedsWordsBackupOrder[currentDraggableParentId] === draggableElementJQ.text()) {
      delete this.seedsWordsBackupOrder[currentDraggableParentId];
    }

    draggableOriginalParentJQ.append(event.target);
  }

  render() {
    this.seedsWordsBackupOrder = {};
    if (this.$avatarCropper) {
      this.lastAvatarZoom = this.$avatarCropper.cropit('zoom');
      this.lastAvatarImageSrc = this.$avatarCropper.cropit('imageSrc');
      this.avatarExport = this.$avatarCropper.cropit('export', {
        type: 'image/jpeg',
        quality: 1,
        originalSize: true,
      });
      this.$avatarCropper = null;
    }

    this.clearCachedElementMap();

    loadTemplate('modals/onboarding/onboarding.html', t => {
      loadTemplate('components/brandingBox.html', brandingBoxT => {
        const state = this.getState();
        const shuffled = this.options.seed.split(' ')
          .map((a) => ({ sort: Math.random(), value: a }))
          .sort((a, b) => a.sort - b.sort)
          .map((a) => a.value);

        this.$el.html(t({
          brandingBoxT,
          ...state,
          curConn: getCurrentConnection(),
          profile: app.profile.toJSON(),
          profileErrors: app.profile.validationError || {},
          profileConstraints: app.profile.max,
          settings: app.settings.toJSON(),
          settingsErrors: app.settings.validationError || {},
          countryList: this.countryList,
          currencyList: this.currencyList,
          seed: this.options.seed.split(' '),
          shuffledSeedWords: shuffled,
        }));

        super.render();

        if (state.screen === 'info') {
          setTimeout(() => {
            this.getCachedEl('#onboardingCountry').select2();
            this.getCachedEl('#onboardingCurrency').select2();

            this.$avatarCropper = this.getCachedEl('#avatarCropper').cropit({
              $preview: this.getCachedEl('.js-avatarPreview'),
              $fileInput: this.getCachedEl('#avatarInput'),
              smallImage: 'stretch',
              allowDragNDrop: false,
              maxZoom: 2,
              onImageLoaded: () => {
                this.getCachedEl('.js-avatarLeft').removeClass('disabled');
                this.getCachedEl('.js-avatarRight').removeClass('disabled');
                this.getCachedEl('.js-avatarZoom').removeClass('disabled');
                this.$avatarCropper.cropit('zoom', this.lastAvatarZoom);

                for (let i = 0; i < this.lastAvatarImageRotate; i++) {
                  this.$avatarCropper.cropit('rotateCW');
                }
              },
              onFileChange: () => {
                this.lastAvatarImageRotate = 0;
                this.lastAvatarImageSrc = '';
                this.lastAvatarZoom = 0;
                this.avatarChanged = true;
              },
              onFileReaderError: (data) => {
                console.log('file reader error');
                console.log(data);
              },
              onImageError: (errorObject) => {
                console.log(errorObject.code);
                console.log(errorObject.message);
              },
              imageState: {
                src: this.lastAvatarImageSrc || '',
              },
            });
          }, 0);
        }
      });
    });

    return this;
  }
}
