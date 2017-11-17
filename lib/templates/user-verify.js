'use strict';

let nconf = require('nconf');

module.exports = function(secret, timeout) {
    let text =
        '<b>Hello!</b>' +
        '<br/>' +
        'Use the following verification code to verify your account creation: ' +
        '<br/>' +
        '<a href="' + nconf.get('links:base') + nconf.get('links:user:create') + secret + '">' + secret + '</a>' +
        '<br/>' +
        'This code will expire on : ' + timeout + ' or until it is used.' +
        '<br/>';

    return text;
};
