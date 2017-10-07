var mysql = require('mysql');

var pool = require(appRoot + '/app/initializers/database').getPool(),
    logger = require('../logger');

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
            fieldsObject = {};

        if(err) {
            // If an error is found, create the error object
            errorObject = {
                status: 500,
                message: 'An error occured in the database',
                error: err.sqlMessage,
                database: true,
                stackTrace: err
            };
        }

        logger.debug({sql: sql, errorExists: !!err});

        // If the fields object exists
        if(fields) {
            // Walk through the fields object and create a new array with compressed values
            fields.forEach(function(field) {
                if(field.type === 1) {
                    fieldsObject[field.name] = 'boolean';
                } else if(field.type === 3 && field.name.indexOf("id") !== -1) {
                    fieldsObject[field.name] = 'id';
                } else if(field.type === 3 && field.name.indexOf("id") === -1) {
                    fieldsObject[field.name] = 'integer';
                } else if(field.type === 12) {
                    fieldsObject[field.name] = 'datetime';
                } else if(field.type === 252) {
                    fieldsObject[field.name] = 'text';
                } else if(field.type === 253) {
                    fieldsObject[field.name] = 'string';
                }
            });
        }

        // If we have one or more result
        if(results && results.length > 0 && fields) {

            // Walk through the results object and replace all boolean TINYINT(1) with true booleans
            for(var i in results) {
                var result = results[i];

                // Loop through the result object
                for(var j in result) {

                    // Loop through the fields object
                    for(var k in fieldsObject) {
                        var fieldType = fieldsObject[k];

                        if(j === k && fieldType === 'boolean') {
                            result[j] = result[j] === 1;
                        }
                    }
                }
            }
        }

        callback(errorObject, results, fieldsObject);
    });
};
