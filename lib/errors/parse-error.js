'use strict';

module.exports.IntegerParseError = function(notInteger) {
    return {
        status: 500,
        title: 'Parse Error',
        message: 'The object was expected to be an Integer.',
        details: notInteger + ' was expected to be an integer but is instead: ' + typeOf(notInteger)
    };
};