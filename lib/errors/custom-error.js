'use strict';

module.exports.CustomError = function(status, title, message, details) {
    return {
        status: status || 500,
        title: title || 'Server Error',
        message: message || null,
        details: details || null
    };
};