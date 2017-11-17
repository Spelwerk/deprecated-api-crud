'use strict';

module.exports = function(email) {
    let text =
        '<b>Hello!</b>' +
        '<br/>' +
        'Your email has now been changed to ' + email + '.' +
        '<br/>';

    return text;
};
