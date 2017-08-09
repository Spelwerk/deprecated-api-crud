var mysql = require('mysql');

var pool = require(appRoot + '/app/initializers/database').getPool();

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
        var error = null,
            fieldsArray = [],
            booleanFields = [];

        if(err) {
            // If an error is found, create the error object
            error = {
                status: 500,
                message: 'Database error',
                error: err,
                query: sql
            };
        }

        if(!results[0]) {
            // If there are no results, create the error object with status 204
            error = {
                status: 204,
                message: 'Query successful, but no content was found',
                error: 'Query successful, but no content was found',
                query: sql
            };

        } else {

            // If the fields object exists
            if(fields) {
                // Walk through the fields object and create a new array with compressed values
                fields.forEach(function(field) {
                    if(field.type === 1) {
                        fieldsArray.push({name: field.name, type: 'boolean'});

                        booleanFields.push(field.name);
                    }

                    if(field.type === 3) {
                        fieldsArray.push({name: field.name, type: 'id'});
                    }

                    if(field.type === 12) {
                        fieldsArray.push({name: field.name, type: 'datetime'});
                    }

                    if(field.type === 253) {
                        fieldsArray.push({name: field.name, type: 'string'});
                    }
                });
            }

            // Walk through the results object and replace all boolean TINYINT(1) with true booleans
            results.forEach(function(result){

                // If the fields object exists
                if(fields) {
                    for(var key in result) {
                        if(booleanFields.indexOf(key) !== -1) {
                            result[key] = result[key] === 1;
                        }
                    }
                }
            });
        }

        callback(error, results, fieldsArray);
    });
};