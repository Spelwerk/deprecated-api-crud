'use strict';

const routes = require('../../lib/routes/generic/routes');

module.exports = (router) => {
    routes.unique(router, 'label');
};
