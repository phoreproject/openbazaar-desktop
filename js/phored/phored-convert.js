'use strict';

const Big = require('big.js');
const units = {
  'PHR': new Big(1),
  'mPHR': new Big(0.001),
  'μPHR': new Big(0.000001),
  'pSAT': new Big(0.00000001),
};

function convert(from, fromUnit, toUnit, representation) {
  let fromFactor = units[fromUnit];
  if (fromFactor === undefined) {
    throw new Error(`'${fromUnit}' is not a bitcoin unit`);
  }
  let toFactor = units[toUnit];
  if (toFactor === undefined) {
    throw new Error(`'${toUnit}' is not a bitcoin unit`);
  }

  if (Number.isNaN(from)) {
    if (!representation || representation === 'Number') {
      return from;
    } else if (representation === 'Big') {
      return new Big(from); // throws BigError
    } else if (representation === 'String') {
      return from.toString();
    }
    throw new Error(`'${representation}' is not a valid representation`);
  }

  let result = new Big(from).times(fromFactor)
    .div(toFactor);

  if (!representation || representation === 'Number') {
    return Number(result);
  } else if (representation === 'Big') {
    return result;
  } else if (representation === 'String') {
    return result.toString();
  }

  throw new Error(`'${representation}' is not a valid representation`);
}

convert.units = function () {
  return Object.keys(units);
};

convert.addUnit = function addUnit(unit, factor) {
  factor = new Big(factor);
  let existing = units[unit];
  if (existing && !existing.eq(factor)) {
    throw new Error(`'${unit}' already exists with a different conversion factor`);
  }
  units[unit] = factor;
};

let predefinedUnits = convert.units();
convert.removeUnit = function removeUnit(unit) {
  if (predefinedUnits.indexOf(unit) >= 0) {
    throw new Error(`'${unit}' is predefined and cannot be removed`);
  }
  delete units[unit];
};

module.exports = convert;
