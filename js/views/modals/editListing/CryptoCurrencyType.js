import app from '../../../app';
import '../../../lib/select2';
import { supportedWalletCurs } from '../../../data/walletCurrencies';
import { isJQPromise } from '../../../utils/object';
import loadTemplate from '../../../utils/loadTemplate';
import BaseView from '../../baseVw';
import CryptoTradingPair from '../../components/CryptoTradingPair';
import CryptoCurrencyTradeField from './CryptoCurrencyTradeField';
import $ from 'jquery';
import { convertAndFormatCurrency, formatPrice } from '../../../utils/currency';
import { polyT } from '../../../utils/templateHelpers';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a Listing model.');
    }

    if (!isJQPromise(options.getCoinTypes)) {
      throw new Error('Please provide getCoinTypes as a jQuery promise.');
    }

    super(options);

    this.options = {
      getReceiveCur: () => this.model.get('metadata')
        .get('acceptedCurrencies')[0],
      ...options,
    };

    if (typeof this.options.getReceiveCur !== 'function') {
      throw new Error('If providing a getReceiveCur options, it must be a function.');
    }

    this.getCoinTypes = options.getCoinTypes;
    this.receiveCurs = supportedWalletCurs();
    const receiveCur = this.options.getReceiveCur();

    if (receiveCur && !this.receiveCurs.includes(receiveCur)) {
      // if the model has the receiving currency set to an unsupported cur,
      // we'll manually add that to the list of available options. Upon a
      // a save attempt, the user will be presented with an error prompting them
      // to select a valid currency.
      this.receiveCurs.push(receiveCur);
    }

    this.receiveCurs = this.receiveCurs.map(cur => ({
      code: cur,
      name: app.polyglot.t(`cryptoCurrencies.${cur}`, {
        _: cur,
      }),
    }));

    this.receiveCurs = this.receiveCurs.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

    this.tradeField = this.createChild(CryptoCurrencyTradeField, {
      select2Opts: this.tradeSelect2Opts,
      initialState: {
        isFetching: this.getCoinTypes.state() === 'pending',
      },
    });

    // Initially we'll show this as 'invisible' for spacing purposes. A spinner will
    // show until the subsequent getCoinTypes() call returns.
    this.cryptoTradingPair = this.createChild(CryptoTradingPair, {
      className: 'cryptoTradingPairWrap row invisible',
      initialState: {
        tradingPairClass: 'cryptoTradingPairLg rowSm',
        exchangeRateClass: 'clrT2 tx6',
        // TODO
        // TODO
        // TODO - don't assume BTC, hard-code to the exchange rate reference coin
        fromCur: this.options.getReceiveCur() ||
          (this.receiveCurs[0] && this.receiveCurs[0].code) || 'PHR',
        toCur: 'PHR',
      },
    });

    this.getCoinTypes.done(curs => {
      const selected = this.model.get('metadata')
        .get('coinType') || curs[0].code;

      this.coinTypes = curs;
      this.toCur = selected;
      this.updateDefaultCryptoFixPrice();

      this.tradeField.setState({
        curs,
        isFetching: false,
        selected,
      });

      this.cryptoTradingPair.$el.removeClass('invisible');
      this.cryptoTradingPair.setState({
        toCur: selected,
      });

      this.getCachedEl('.js-quantityCoinType')
        .text(selected);
    });

    this.tradeField.render();
    this.cryptoTradingPair.render();

    this.listenTo(app.settings, 'change:localCurrency', () => {
      this.getCachedEl('.js-marketValueWrap')
        .html(this.tmplMarketValue({ getDataFromUi: true }));
    });

    this.fromCur = this.options.getReceiveCur()
      || (this.receiveCurs[0] && this.receiveCurs[0].code);
    this.toCur = '';
  }

  className() {
    return 'cryptoCurrencyType padSmKids padStackAll';
  }

  events() {
    return {
      'change #editListingCoinType': 'onChangeCoinType',
      'change #editListingCryptoReceive': 'onChangeReceiveCur',
      'change #editFormatType': 'onChangeFormatType',
      'change input[name="item.price"]': 'onChangePrice',
      'change input[name="item.price2"]': 'onChangePrice2',
    };
  }

  onChangeCoinType(e) {
    this.getCachedEl('.js-quantityCoinType')
      .text(e.target.value);
    this.cryptoTradingPair.setState({
      toCur: e.target.value,
    });

    this.toCur = e.target.value;
    this.updateDefaultCryptoFixPrice();
  }

  onChangeReceiveCur(e) {
    this.cryptoTradingPair.setState({
      fromCur: e.target.value,
    });

    this.fromCur = e.target.value;
    this.updateDefaultCryptoFixPrice();
  }

  onChangeFormatType(event) {
    const value = $(event.target).val();
    const isFixed = (value === 'FIXED_PRICE');

    this.model.get('metadata').set('format', value);
    this.updateDefaultCryptoFixPrice();

    if (isFixed) {
      this.$editListingCryptoPriceSection.removeClass('hide');
      this.$editListingCryptoPriceSection2.removeClass('hide');
      this.$editListingCryptoPriceModifierSection.addClass('hide');
    } else {
      this.$editListingCryptoPriceModifierSection.removeClass('hide');
      this.$editListingCryptoPriceSection.addClass('hide');
      this.$editListingCryptoPriceSection2.addClass('hide');
    }
  }

  onChangePrice(event) {
    const val = $(event.target).val();
    if (isNaN(val)) {
      this.setPriceError(this.$editListingCryptoPriceHelper2);
      return;
    }

    this.updatePriceFields(formatPrice(1.0 / Number(val), this.fromCur), val);
  }

  onChangePrice2(event) {
    const val = $(event.target).val();
    if (isNaN(val)) {
      this.setPriceError(this.$editListingCryptoPriceHelper);
      return;
    }

    this.updatePriceFields(val, formatPrice(1.0 / Number(val), this.toCur));
  }

  get defaultFromCur() {
    return this.model.get('metadata').get('coinType') ||
      this.coinTypes ? this.coinTypes[0].code : '';
  }

  get tradeSelect2Opts() {
    return {
      minimumResultsForSearch: 5,
      matcher: (params, data) => {
        if (!params.term || params.term.trim() === '') {
          return data;
        }

        const term = params.term
          .toUpperCase()
          .trim();

        if (
          data.text
            .toUpperCase()
            .includes(term) ||
          data.id.includes(term)
        ) {
          return data;
        }

        return null;
      },
    };
  }

  get $editListingCryptoPriceSection() {
    return this._$editListingCryptoPriceSection ||
      (this._$editListingCryptoPriceSection = this.$('.js-editListingCryptoPrice'));
  }

  get $editListingCryptoPriceSection2() {
    return this._$editListingCryptoPriceSection2 ||
      (this._$editListingCryptoPriceSection2 = this.$('.js-editListingCryptoPrice2'));
  }

  get $editListingCryptoPriceInput() {
    return this._$editListingCryptoPriceInput ||
      (this._$editListingCryptoPriceInput = this.$('#editListingCryptoPrice'));
  }

  get $editListingCryptoPriceInput2() {
    return this._$editListingCryptoPriceInput2 ||
      (this._$editListingCryptoPriceInput2 = this.$('#editListingCryptoPrice2'));
  }

  get $editListingCryptoPriceHelper() {
    return this._$editListingCryptoPriceHelper ||
      (this._$editListingCryptoPriceHelper = this.$('#editListingCryptoPriceHelper'));
  }

  get $editListingCryptoPriceHelper2() {
    return this._$editListingCryptoPriceHelper2 ||
      (this._$editListingCryptoPriceHelper2 = this.$('#editListingCryptoPriceHelper2'));
  }

  get $editListingCryptoPriceModifierSection() {
    return this._$editListingCryptoPriceModifierSection ||
      (this._$editListingCryptoPriceModifierSection = this.$('.js-editListingCryptoPriceModifier'));
  }

  renderCryptoTradingPair() {

  }

  updateDefaultCryptoFixPrice() {
    if (!this.toCur || !this.fromCur) {
      return;
    }

    let formattedFromCurAmount = Number(convertAndFormatCurrency(1, this.fromCur, this.toCur, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).replace(/[^0-9\.-]+/g, ''));
    formattedFromCurAmount = formatPrice(formattedFromCurAmount, this.toCur);

    let formattedFromCurAmount2 = Number(convertAndFormatCurrency(1, this.toCur, this.fromCur, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).replace(/[^0-9\.-]+/g, ''));
    formattedFromCurAmount2 = formatPrice(formattedFromCurAmount2, this.fromCur);

    this.$editListingCryptoPriceInput.prop('placeholder', formattedFromCurAmount);
    this.$editListingCryptoPriceInput2.prop('placeholder', formattedFromCurAmount2);
    if (this.$editListingCryptoPriceInput.get('value') === undefined) {
      this.updatePriceFields(formattedFromCurAmount, formattedFromCurAmount2);
    }
  }

  updatePriceFields(price, price2) {
    this.$editListingCryptoPriceInput.prop('value', price);
    this.$editListingCryptoPriceInput2.prop('value', price2);

    this.$editListingCryptoPriceHelper.html(polyT('editListing.fixRatePriceHelper',
      {
        fromCur: this.fromCur,
        rate: price,
        toCur: this.toCur,
      }));

    this.$editListingCryptoPriceHelper2.html(polyT('editListing.fixRatePriceHelper2',
      {
        fromCur: this.toCur,
        rate: price2,
        toCur: this.fromCur,
      }));
  }

  setPriceError(priceField) {
    priceField.html(polyT('itemModelErrors.provideNumericAmount'));
  }

  render() {
    super.render();

    loadTemplate('modals/editListing/viewListingLinks.html', viewListingsT => {
      loadTemplate('modals/editListing/cryptoCurrencyType.html', t => {
        this.$el.html(t({
          contractTypes: this.model.get('metadata').contractTypesVerbose,
          priceTypes: this.model.get('metadata').formatsVerbose,
          coinTypes: this.coinTypes,
          receiveCurs: this.receiveCurs,
          errors: this.model.validationError || {},
          viewListingsT,
          ...this.model.toJSON(),
          receiveCur: this.options.getReceiveCur(),
        }));

        this._$editListingCryptoPriceSection = null;
        this._$editListingCryptoPriceSection2 = null;
        this._$editListingCryptoPriceInput = null;
        this._$editListingCryptoPriceInput2 = null;
        this._$editListingCryptoPriceHelper = null;
        this._$editListingCryptoPriceHelper2 = null;
        this._$editListingCryptoPriceModifierSection = null;

        this.getCachedEl('#editListingCryptoContractType, #editFormatType').select2({
          minimumResultsForSearch: Infinity,
        });

        this.getCachedEl('#editListingCryptoReceive').select2(this.tradeSelect2Opts);

        this.tradeField.delegateEvents();
        this.getCachedEl('.js-cryptoCurrencyTradeContainer').html(this.tradeField.el);

        this.cryptoTradingPair.delegateEvents();
        this.getCachedEl('.js-cryptoTradingPairContainer').html(this.cryptoTradingPair.el);
      });
    });

    return this;
  }
}
