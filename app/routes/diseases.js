var unique = require('../../lib/specific/unique');

module.exports = function(router) {
    'use strict';

    unique(router, 'disease');
};
