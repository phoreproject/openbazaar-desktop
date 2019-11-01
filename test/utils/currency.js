import $ from 'jquery';
import app from '../../js/app';
import sinon from 'sinon';
import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import Polyglot from 'node-polyglot';
import enUsTranslations from '../../js/languages/en_US.json';
import * as cur from '../../js/utils/currency';

describe('the currency utility module', () => {
  before(function () {
    app.polyglot = new Polyglot();
    app.polyglot.extend(enUsTranslations);
    app.serverConfig = {
      ...(app.serverConfig || {}),
      cryptoCurrency: 'PHR',
    };
  });

  it('correctly converts a fiat amount from an integer to decimal', () => {
    expect(cur.integerToDecimal(123, 'USD')).to.equal(1.23);
  });

  it('correctly converts a PHR price from an integer to a decimal', () => {
    expect(cur.integerToDecimal(271453590, 'BTC')).to.equal(2.71453590);
  });

  it('correctly converts a fiat amount from a decimal to an integer', () => {
    expect(cur.decimalToInteger(1.23, 'USD')).to.equal(123);
  });

  it('correctly converts a fiat amount from a decimal to an integer' +
    ' rounding to the hundreds place.', () => {
    expect(cur.decimalToInteger(1.23678, 'USD')).to.equal(124);
  });

  it('correctly converts a BTC price from a decimal to an integer', () => {
    expect(cur.decimalToInteger(2.71, 'BTC')).to.equal(271000000);
  });

  it('correctly formats a non-crypto price to 2 decimal place', () => {
    expect(cur.formatPrice(2.713546, 'USD')).to.equal('2.71');
    expect(cur.formatPrice(2.7189, 'USD')).to.equal('2.72');
    expect(cur.formatPrice(2, 'USD')).to.equal('2.00');
  });

  it('correctly formats a PHR price up to 8 decimal places without any insignificant zeros', () => {
    expect(cur.formatPrice(2.713546, 'PHR')).to.equal('2.713546');
    expect(cur.formatPrice(2.718925729, 'PHR')).to.equal('2.71892573');
    expect(cur.formatPrice(2, 'PHR')).to.equal('2');
  });

  describe('has functions that involve converting between currencies', () => {
    let ajax;

    before(function () {
      ajax = sinon.stub($, 'ajax', () => {
        const deferred = $.Deferred();

        deferred.resolve({
          PHR: 1,
          PLN: 3148.48,
          USD: 750.6,
        });

        return deferred.promise();
      });

      cur.fetchExchangeRates();
    });

    describe('like convertCurrency', () => {
      it('which will convert between two fiat currencies', () => {
        expect(cur.convertCurrency(500, 'USD', 'PLN'))
          .to
          .equal(2097.308819610978);
      });

      it('which will convert from a fiat currency to PHR', () => {
        expect(cur.convertCurrency(500, 'USD', 'PHR'))
          .to
          .equal(0.6661337596589395);
      });

      it('which will convert from PHR to a fiat currency', () => {
        expect(cur.convertCurrency(500, 'PHR', 'USD'))
          .to
          .equal(375300);
      });

      it('which correctly handles being called with the same' +
       'fiat currency for both the from and to currency', () => {
        expect(cur.convertCurrency(500, 'USD', 'USD'))
          .to
          .equal(500);
      });

      it('which correctly handles being called with PHR as both' +
        'the from and to currency', () => {
        expect(cur.convertCurrency(500, 'PHR', 'PHR'))
          .to
          .equal(500);
      });
    });

    describe('like convertAndFormatCurrency', () => {
      it('which will convert between two fiat currencies properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'USD', 'PLN', { locale: 'en-US' }))
          .to
          .satisfy(val => ['PLN2,097.31', 'PLN 2,097.31'].includes(val));
      });

      it('which will convert between a fiat currency and PHR and properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'USD', 'PHR', { locale: 'en-US' }))
          .to
          .equal('0.66613376 PHR');
      });

      it('which will convert between PHR and a fiat currency properly localize ' +
        'the resulting value', () => {
        expect(cur.convertAndFormatCurrency(500, 'PHR', 'USD', { locale: 'en-US' }))
          .to
          .equal('$375,300.00');
      });
    });

    after(function () {
      ajax.restore();
    });
  });
});
