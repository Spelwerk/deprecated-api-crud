'use strict';

let nconf = require('nconf');

module.exports = function(secret, timeout) {
    let text =
        '<b>Hello!</b>' +
        '<br/>' +
        'Use the following verification code to reset your password: ' +
        '<br/>' +
        '<a href="' + nconf.get('links:base') + nconf.get('links:user:password') + secret + '">' + secret + '</a>' +
        '<br/>' +
        'This code will expire on : ' + timeout + ' or until it is used.' +
        '<br/>';

    return text;
};
