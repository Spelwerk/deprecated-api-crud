'use strict';

module.exports = function() {

    module.exports.User = require('./user-error');
    module.exports.Parse = require('./parse-error');
    module.exports.Custom = require('./custom-error');
    module.exports.Database = require('./database-error');

    module.exports.NotFoundError = function() {
        return {
            status: 404,
            title: 'Not Found',
            message: null,
            details: null
        };
    };

};