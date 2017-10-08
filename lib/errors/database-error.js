'use strict';

module.exports = function(err) {
    return {
        status: 500,
        title: 'Database Error',
        message: 'An error has occured in the database',
        details: err.sqlMessage,
        stackTrace: err
    };
};