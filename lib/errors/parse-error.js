'use strict';

var CustomError = require('./custom-error');

module.exports.IntegerParseError = function(notInteger) {
    return CustomError(500,
        'Parsing Error',
        'The object was expected to be an Integer.',
        notInteger + ' was expected to be an integer but is instead: ' + typeOf(notInteger));
};