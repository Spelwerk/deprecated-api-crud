'use strict';

module.exports = function() {

    module.exports.CustomError = require('./custom-error');
    module.exports.Database = require('./database-error');

    module.exports.User = require('./user-error');
    module.exports.Parse = require('./parse-error');

    module.exports.NotFoundError = function() {
        return {
            status: 404,
            title: 'Not Found',
            message: null,
            details: null
        };
    };

};