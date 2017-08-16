var mysql = require('mysql');

var pool = require(appRoot + '/app/initializers/database').getPool(),
    logger = require('./../logger');

/**
 * Generic database query formatted and fitted for the API needs. All database queries should go into this.
 *
 * @param sql String: SQL query
 * @param params Array: List of parameters which will replace all questionmarks (?) in the SQL query
 * @param callback
 * @returns callback(error, results, fields)
 */

module.exports = function(sql, params, callback) {
    if(params) {
        sql = mysql.format(sql, params);
    }

    pool.query(sql, function(err, results, fields) {
        var errorObject = null,
            fieldsObject = {},
            booleanArray = [];

        //if(err && environment === 'development') console.error(err);

        logger.debug({sql: sql, results: results});

        if(err) {
            // If an error is found, create the error object
            errorObject = {
                status: 500,
                message: 'Database error',
                error: err,
                query: sql
            };
        }

        // If the fields object exists
        if(fields) {
            // Walk through the fields object and create a new array with compressed values
            fields.forEach(function(field) {
                if(field.type === 1) {
                    fieldsObject[field.name] = 'boolean';

                    booleanArray.push(field.name);
                }

                if(field.type === 3) {
                    fieldsObject[field.name] = 'integer';
                }

                if(field.type === 12) {
                    fieldsObject[field.name] = 'datetime';
                }

                if(field.type === 252) {
                    fieldsObject[field.name] = 'text';
                }

                if(field.type === 253) {
                    fieldsObject[field.name] = 'string';
                }
            });
        }

        // If we have one or more result
        if(results && results.length > 0) {

            // Walk through the results object and replace all boolean TINYINT(1) with true booleans
            results.forEach(function(result){

                // If the fields object exists
                if(fields) {

                    // Loop through fields
                    for(var key in result) {
                        if(booleanArray.indexOf(key) !== -1) {
                            result[key] = result[key] === 1;
                        }
                    }
                }
            });
        }

        callback(errorObject, results, fieldsObject);
    });
};