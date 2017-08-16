var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

var tables = require(appRoot + '/app/initializers/database').getTables();

var ignoredCols = ['id', 'canon', 'popularity', 'created', 'deleted', 'updated'];

/**
 * Queries database for a list and sends response with results and fields.
 *
 * @param req Object: Express request object
 * @param res Object: Express response object
 * @param next function: Express next() function
 * @param call String: SQL query to send into the query() function
 * @param params Array: Parameters with which query() function will format the SQL query
 * @param singleObject boolean: If the query should return a single object or not
 */

module.exports.get = function(req, res, next, call, params, singleObject) {
    singleObject = singleObject || false;

    var order_by = req.headers['x-order-by'] !== undefined
        ? JSON.parse(req.headers['x-order-by'])
        : null;

    var pagination_limit = req.headers['x-pagination-limit'] !== undefined
        ? req.headers['x-pagination-limit']
        : null;

    var pagination_amount = req.headers['x-pagination-amount'] !== undefined
        ? req.headers['x-pagination-amount']
        : null;

    if(order_by !== null) {
        call += ' ORDER BY ';

        for (var key in order_by) {
            call += key + ' ' + order_by[key] + ', ';
        }

        call = call.slice(0, -2);
    }

    if(pagination_limit !== null) {
        call += ' LIMIT ' + pagination_limit;
    }

    if(pagination_amount !== null) {
        call += ',' + pagination_amount;
    }

    query(call, params, function(err, results, fields) {
        if(err) return next(err);

        var message = 'Query successful';

        if(singleObject && results.length === 0) return next({status: 404, message: 'Not Found', error: 'The requested object was not found.'});

        var sendObject = singleObject
            ? {success: true, message: message, result: results[0], fields: fields}
            : {success: true, message: message, length: results.length, results: results, fields: fields};

        res.status(200).send(sendObject);
    });
};

/**
 * Creates a row in table and sends response with inserted ID.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being posted into
 * @param adminRestriction boolean: Requires administrator on logged in user to change
 * @param userContent boolean: Will be saved into the appropriate user_has_tableName table
 */

module.exports.post = function(req, res, next, tableName, adminRestriction, userContent) {
    if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User ID is missing'});

    if(adminRestriction && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    var insert = {};

    async.series([
        function(callback) {
            var body        = req.body,
                call        = 'INSERT INTO ' + tableName + ' (',
                values      = ' VALUES (',
                valuesArray = [];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredCols.indexOf(key) !== -1) continue;

                    call += key + ',';
                    values += '?,';
                    valuesArray.push(body[key]);
                }
            }

            call = call.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';

            call += values;

            query(call, valuesArray, function(err, result) {
                if(err) return callback(err);

                insert.id = parseInt(result.insertId);
                insert.affected = parseInt(result.affectedRows);

                callback();
            });
        },
        function(callback) {
            if(!userContent) return callback();

            query('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)', [req.user.id, insert.id], callback);
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Created new row in ' + tableName;

        res.status(201).send({success: true, message: message, affected: insert.affected, id: insert.id});
    });
};

/**
 * Changes single table row with new data.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being changed
 * @param tableId Integer: ID of table row being changed
 * @param adminRestriction boolean: Requires administrator on logged in user to change
 * @param useUpdateColumn boolean: Will set the updated field to CURRENT_TIMESTAMP if set to true
 */

module.exports.put = function(req, res, next, tableName, tableId, adminRestriction, useUpdateColumn) {
    tableId = parseInt(tableId);
    useUpdateColumn = useUpdateColumn || false;

    var insert = {};

    async.series([
        function(callback) {
            ownership(req, adminRestriction, tableName, tableId, callback);
        },
        function(callback) {
            var body        = req.body,
                call        = 'UPDATE ' + tableName + ' SET ',
                valuesArray = [];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    call += key + ' = ?,';
                    valuesArray.push(body[key]);
                }
            }

            if(useUpdateColumn) call += ' updated = CURRENT_TIMESTAMP,';

            call = call.slice(0, -1) + ' WHERE id = ?';

            valuesArray.push(tableId);

            query(call, valuesArray, function(err, result) {
                if(err) return callback(err);

                insert.changed = parseInt(result.changedRows);

                callback();
            });
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Changed ' + tableName + ' row with id: ' + tableId;

        res.status(200).send({success: true, message: message, changed: insert.changed, id: tableId});
    });
};

/**
 * Changes the canon boolean to become true.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being changed
 * @param tableId Integer: ID of table row being changed
 * @param useUpdateColumn boolean: Will set the updated field to CURRENT_TIMESTAMP if set to true
 */

module.exports.canon = function(req, res, next, tableName, tableId, useUpdateColumn) {
    tableId = parseInt(tableId);
    useUpdateColumn = useUpdateColumn || false;

    var insert = {};

    async.series([
        function(callback) {
            ownership(req, true, tableName, tableId, callback);
        },
        function(callback) {
            var sql = useUpdateColumn
                ? 'UPDATE ' + tableName + ' SET canon = 1, updated = CURRENT_TIMESTAMP WHERE id = ?'
                : 'UPDATE ' + tableName + ' SET canon = 1 WHERE id = ?';

            query(sql, [tableId], function(err, result) {
                if(err) return callback(err);

                insert.changed = parseInt(result.changedRows);

                callback();
            });
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Added ' + tableName + ' row with id: ' + tableId + ' to canon';

        res.status(200).send({success: true, message: message, changed: insert.changed, id: tableId});
    });
};

/**
 * Clones a single table row into a new row and sets user as owner of this new row if userContent is enabled.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being changed
 * @param tableId Integer: ID of table row being changed
 * @param adminRestriction boolean: Requires administrator on logged in user to change
 * @param userContent boolean: Will be saved into the appropriate user_has_tableName table
 */

module.exports.clone = function(req, res, next, tableName, tableId, adminRestriction, userContent) {
    tableId = parseInt(tableId);

    var call        = 'INSERT INTO ' + tableName + ' (',
        valuesArray = [],
        clone       = {},
        relationTables = [];

    async.series([
        function(callback) {
            query('SELECT * FROM ' + tableName + ' WHERE id = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                var select = results[0],
                    values = ' VALUES (';

                for(var key in select) {
                    if(select.hasOwnProperty(key)) {
                        if(ignoredCols.indexOf(key) !== -1) continue;

                        call += key + ',';
                        values += '?,';
                        valuesArray.push(select[key]);
                    }
                }

                call = call.slice(0, -1) + ')';
                values = values.slice(0, -1) + ')';

                call += values;

                callback();
            });
        },
        function(callback) {
            query(call, valuesArray, function(err, result) {
                if(err) return callback(err);

                clone.id = parseInt(result.insertId);
                clone.affected = parseInt(result.affectedRows);

                callback();
            });
        },
        function(callback) {
            for(var i in tables) {
                var compareName = tableName + '_has_',
                    tmpName = tables[i];

                if(tmpName.indexOf(compareName) !== -1 && tmpName.indexOf('_comment') === -1) {
                    relationTables.push(tmpName);
                }
            }

            callback();
        },
        function(callback) {
            if(relationTables.length === 0) return callback();

            // For each relation table the table has...
            async.each(relationTables, function(relationTableName, callback){
                var relationTableId = tableName + '_id';

                // Find all the relation values
                query('SELECT * FROM ' + relationTableName + ' WHERE ' + relationTableName + '.' + relationTableId + ' = ?', [tableId], function(err, results) {
                    if(err) return callback(err);

                    if(results.length === 0) return callback();

                    var firstResult = results[0];

                    var relationCall = 'INSERT INTO ' + relationTableName + ' (' + relationTableId + ',',
                        valuesCall = 'VALUES ';

                    // Set up the column headers
                    for(var i in firstResult) {
                        if(firstResult.hasOwnProperty(i)) {
                            if(i === relationTableId) continue;

                            relationCall += i + ',';
                        }
                    }

                    // Loop through the results
                    for(var j in results) {
                        var result = results[j];

                        valuesCall += '(' + clone.id + ',';

                        // Loop through the keys in the result and add it to the list of values
                        for(var k in result) {
                            if(result.hasOwnProperty(k)) {
                                if(k === relationTableId) continue;

                                valuesCall += result[k] + ',';
                            }
                        }

                        valuesCall = valuesCall.slice(0, -1) + '),';
                    }

                    // Slice and fix the values
                    relationCall = relationCall.slice(0, -1) + ')';
                    valuesCall = valuesCall.slice(0, -1);

                    // Create the SQL call and query
                    var sql = relationCall + valuesCall;

                    query(sql, null, function(err, results) {
                        if(err) return callback(err);

                        clone.affected += results.affectedRows;

                        callback();
                    });
                });
            }, function(err) {
                callback(err);
            });
        },
        function(callback) {
            if(!userContent) return callback();

            query('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)', [req.user.id, clone.id], callback);
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Created a new clone of ' + tableName + ' row with id: ' + tableId;

        res.status(201).send({success: true, message: message, affected: clone.affected, id: clone.id});
    })
};

/**
 * Sets the deleted field to CURRENT_TIMESTAMP on a single table row.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName Name of table being changed
 * @param tableId Integer: ID of table row being deleted
 * @param adminRestriction boolean: Requires administrator on logged in user to change
 */

module.exports.delete = function(req, res, next, tableName, tableId, adminRestriction) {
    tableId = parseInt(tableId);

    var insert = {};

    async.series([
        function(callback) {
            ownership(req, adminRestriction, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId], function(err, result) {
                if(err) return callback(err);

                insert.affected = result.affectedRows;

                callback();
            });
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Deleted row from ' + tableName + ' with id: ' + tableId;

        res.status(200).send({success: true, message: message, affected: insert.affected});
    });
};

/**
 * Sets the deleted field to NULL on a single table row.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName Name of table being changed
 * @param tableId Integer: ID of table row being revived
 */

module.exports.revive = function(req, res, next, tableName, tableId) {
    tableId = parseInt(tableId);

    var insert = {};

    async.series([
        function(callback) {
            ownership(req, true, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET deleted = NULL WHERE id = ?', [tableId], function(err, result) {
                if(err) return callback(err);

                insert.changed = parseInt(result.changedRows);

                callback();
            });
        }
    ],function(err) {
        if(err) return next(err);

        var message = 'Revived previously deleted row from ' + tableName + ' with id: ' + tableId;

        res.status(200).send({success: true, message: message, changed: insert.changed});
    });
};
