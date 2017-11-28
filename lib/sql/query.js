'use strict';

let DatabaseError = require('../../lib/errors/database-error');

let mysql = require('mysql');

let pool = require(appRoot + '/app/initializers/database').getPool(),
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
        let fieldsObject = {};

        logger.debug({sql: sql, errorExists: !!err});

        if(err) return callback(new DatabaseError(err));

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
            for(let i in results) {
                let result = results[i];

                // Loop through the result object
                for(let j in result) {

                    // Loop through the fields object
                    for(let k in fieldsObject) {
                        let fieldType = fieldsObject[k];

                        if(j === k && fieldType === 'boolean') {
                            result[j] = result[j] === 1;
                        }
                    }
                }
            }
        }

        callback(null, results, fieldsObject);
    });
};
