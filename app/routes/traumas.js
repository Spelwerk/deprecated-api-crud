'use strict';

let unique = require('../../lib/helper/unique');

module.exports = function(router) {
    unique(router, 'trauma');
};
