var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

var ignoredCols = ['id', 'user_id', 'canon', 'created', 'deleted', 'updated'];

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

        if(singleObject && results.length === 0) return next({status: 404, message: 'Not Found', error: 'The requested object was not found.'});

        var sendObject = singleObject
            ? {result: results[0], fields: fields}
            : {length: results.length, results: results, fields: fields};

        res.status(200).send(sendObject);
    });
};

/**
 * Creates a row in table and sends response with inserted ID.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param adminRestriction boolean: Requires administrator on logged in user to change
 * @param userOwned boolean: Will be saved in a user_has_tableName table
 * @param tableName String: Name of table being posted into
 */

module.exports.post = function(req, res, next, tableName, adminRestriction, userOwned) {
    adminRestriction = adminRestriction || false;
    userOwned = userOwned || false;

    if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    if(adminRestriction && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    var insert = {};

    async.series([
        function(callback) {
            var body = req.body,
                call = 'INSERT INTO ' + tableName + ' (user_id,',
                values = ' VALUES (?,',
                array = [req.user.id];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredCols.indexOf(key) !== -1) continue;

                    call += key + ',';
                    values += '?,';
                    array.push(body[key]);
                }
            }

            call = call.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';
            call += values;

            query(call, array, function(err, result) {
                if(err) return next(err);

                insert.id = parseInt(result.insertId);

                callback();
            });
        },
        function(callback) {
            if(!userOwned) return callback();

            var call = 'INSERT INTO user_has_' + tableName  + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)';

            query(call, [req.user.id, insert.id], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(201).send({id: insert.id});
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
 * @param userOwned boolean: Verifies "edit" against user_has_tableName table
 * @param updatedField boolean: Will set the updated field to CURRENT_TIMESTAMP if set to true
 */

module.exports.put = function(req, res, next, tableName, tableId, adminRestriction, userOwned, updatedField) {
    adminRestriction = adminRestriction || false;
    userOwned = userOwned || false;
    updatedField = updatedField || false;

    tableId = parseInt(tableId);

    if(adminRestriction && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

    async.series([
        function(callback) {
            if(!userOwned) return callback();

            ownership(req.user, tableName, tableId, callback);
        },
        function(callback) {
            var body = req.body,
                call = 'UPDATE ' + tableName + ' SET ',
                array = [];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    call += key + ' = ?,';
                    array.push(body[key]);
                }
            }

            if(array.length === 0) return callback();

            if(updatedField) call += ' updated = CURRENT_TIMESTAMP,';

            call = call.slice(0, -1) + ' WHERE id = ?';
            array.push(tableId);

            query(call, array, callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
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
 * @param userOwned boolean: Verifies "edit" against user_has_tableName table
 */

module.exports.delete = function(req, res, next, tableName, tableId, adminRestriction, userOwned) {
    adminRestriction = adminRestriction || false;
    userOwned = userOwned || false;

    tableId = parseInt(tableId);

    if(adminRestriction && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

    async.series([
        function(callback) {
            if(!userOwned) return callback();

            ownership(req.user, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
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
 * @param canon Boolean: If canon should be true or false
 */

module.exports.canon = function(req, res, next, tableName, tableId, canon) {
    if(!req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator.'});

    tableId = parseInt(tableId);
    canon = canon || false;

    query('UPDATE ' + tableName + ' SET canon = ?, updated = CURRENT_TIMESTAMP WHERE id = ?', [canon, tableId], function(err) {
        if(err) return next(err);

        res.status(204).send();
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
 */

// TODO create clone
module.exports.clone = function(req, res, next, tableName, tableId) {
    if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    /*

    tableId = parseInt(tableId);

    var generic = {},
        helper = {},
        relation = {};

    async.series([
        function(callback) {
            generic.call = 'INSERT INTO generic (user_id,original_id,';
            generic.values = ' VALUES (?,?,';
            generic.array = [req.user.id, tableId];

            query('SELECT * FROM generic WHERE id = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                var select = results[0];

                for(var key in select) {
                    if(select.hasOwnProperty(key) && select[key] !== '') {
                        if(ignoredCols.indexOf(key) !== -1) continue;

                        generic.call += key + ',';
                        generic.values += '?,';
                        generic.array.push(select[key]);
                    }
                }

                generic.call = generic.call.slice(0, -1) + ')';
                generic.values = generic.values.slice(0, -1) + ')';

                generic.call += generic.values;

                callback();
            });
        },
        function(callback) {
            query(generic.call, generic.array, function(err, result) {
                if(err) return callback(err);

                generic.id = parseInt(result.insertId);

                callback();
            })
        },
        function(callback) {
            helper.call = 'INSERT INTO ' + tableName + ' (generic_id,';
            helper.values = ' VALUES (?,';
            helper.array = [generic.id];

            query('SELECT * FROM ' + tableName + ' WHERE generic_id = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                var select = results[0];

                for(var key in select) {
                    if(select.hasOwnProperty(key) && select[key] !== '') {
                        if(ignoredCols.indexOf(key) !== -1) continue;
                        if(key === 'generic_id') continue;

                        helper.call += key + ',';
                        helper.values += '?,';
                        helper.array.push(select[key]);
                    }
                }

                helper.call = helper.call.slice(0, -1) + ')';
                helper.values = helper.values.slice(0, -1) + ')';

                helper.call += helper.values;

                callback();
            });
        },
        function(callback) {
            query(helper.call, helper.array, callback);
        },
        function(callback) {
            query('SELECT * FROM generic_has_generic WHERE generic_id = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                if(results.length === 0) return callback();

                relation.select = results;

                callback();
            });
        },
        function(callback) {
            if(!relation.select) return callback();

            var select = relation.select;

            relation.call = 'INSERT INTO generic_has_generic (generic_id,relation_id,value,custom) VALUES ';

            for(var i in select) {
                var result = select[i];

                relation.call += '(' + generic.id + ',';

                // Loop through the keys in the result and add it to the list of values
                for(var key in result) {
                    if(key === 'generic_id') continue;

                    relation.call += result[key] + ',';
                }

                relation.call = relation.call.slice(0, -1) + '),';
            }

            relation.call = relation.call.slice(0, -1);

            query(relation.call, null, callback);
        },
        function(callback) {
            query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, generic.id], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(201).send({id: generic.id});
    });

    */
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

    if(!req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

    query('UPDATE ' + tableName + ' SET deleted = NULL WHERE id = ?', [tableId], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};
