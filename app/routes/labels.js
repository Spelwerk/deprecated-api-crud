'use strict';

const routes = require('../../lib/generic/routes');

module.exports = (router) => {
    routes.unique(router, 'label');
};
