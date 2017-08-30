var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

var ignoredCols = ['id', 'user_id', 'original_id', 'canon', 'created', 'updated', 'deleted'],
    genericCols = ['name', 'description', 'icon'];

/**
 * Creates a row in table and sends response with inserted ID.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being posted into
 */

module.exports.post = function(req, res, next, tableName) {
    if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var body = req.body;

    var generic = {},
        specific = {};

    async.series([
        function(callback) {
            generic.call = 'INSERT INTO generic (user_id,';
            generic.values = ' VALUES (?,';
            generic.array = [req.user.id];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredCols.indexOf(key) !== -1) continue;

                    if(genericCols.indexOf(key) !== -1) {
                        generic.call += key + ',';
                        generic.values += '?,';
                        generic.array.push(body[key]);
                    }
                }
            }

            generic.call = generic.call.slice(0, -1) + ')';
            generic.values = generic.values.slice(0, -1) + ')';
            generic.call += generic.values;

            query(generic.call, generic.array, function(err, result) {
                if(err) return callback(err);

                generic.id = parseInt(result.insertId);

                callback();
            });
        },
        function(callback) {
            specific.call = 'INSERT INTO ' + tableName + ' (generic_id,';
            specific.values = ' VALUES (?,';
            specific.array = [generic.id];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredCols.indexOf(key) !== -1) continue;
                    if(genericCols.indexOf(key) !== -1) continue;

                    specific.call += key + ',';
                    specific.values += '?,';
                    specific.array.push(body[key]);
                }
            }

            specific.call = specific.call.slice(0, -1) + ')';
            specific.values = specific.values.slice(0, -1) + ')';
            specific.call += specific.values;

            query(specific.call, specific.array, callback);
        },
        function(callback) {
            query('INSERT INTO user_has_generic (user_id,generic_id) VALUES (?,?)', [req.user.id, generic.id], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(201).send({id: generic.id});
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
 */

module.exports.put = function(req, res, next, tableName, tableId) {
    tableId = parseInt(tableId);

    var body = req.body;

    var generic = {},
        specific = {};

    async.series([
        function(callback) {
            ownership(req, tableId, false, callback);
        },
        function(callback) {
            generic.call = 'UPDATE generic SET ';
            generic.array = [];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredCols.indexOf(key) !== -1) continue;

                    if(genericCols.indexOf(key) !== -1) {
                        generic.call += key + ' = ?,';
                        generic.array.push(body[key]);
                    }
                }
            }

            if(generic.array.length === 0) return callback();

            generic.call += ' updated = CURRENT_TIMESTAMP,';
            generic.call = generic.call.slice(0, -1) + ' WHERE id = ?';
            generic.array.push(tableId);

            query(generic.call, generic.array, callback);
        },
        function(callback) {
            specific.call = 'UPDATE ' + tableName + ' SET ';
            specific.array = [];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    if(ignoredCols.indexOf(key) !== -1) continue;
                    if(genericCols.indexOf(key) !== -1) continue;

                    specific.call += key + ' = ?,';
                    specific.array.push(body[key]);
                }
            }

            if(specific.array.length === 0) return callback();

            specific.call = specific.call.slice(0, -1) + ' WHERE generic_id = ?';
            specific.array.push(tableId);

            query(specific.call, specific.array, callback);
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
 * @param tableId Integer: ID of table row being changed
 */

module.exports.canon = function(req, res, next, tableId) {
    tableId = parseInt(tableId);

    async.series([
        function(callback) {
            ownership(req, tableId, true, callback);
        },
        function(callback) {
            var sql = 'UPDATE generic SET canon = 1, updated = CURRENT_TIMESTAMP WHERE id = ?';

            query(sql, [tableId], callback);
        }
    ], function(err) {
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

module.exports.clone = function(req, res, next, tableName, tableId) {
    if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    tableId = parseInt(tableId);

    var generic = {},
        specific = {},
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
            specific.call = 'INSERT INTO ' + tableName + ' (generic_id,';
            specific.values = ' VALUES (?,';
            specific.array = [generic.id];

            query('SELECT * FROM ' + tableName + ' WHERE generic_id = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                var select = results[0];

                for(var key in select) {
                    if(select.hasOwnProperty(key) && select[key] !== '') {
                        if(ignoredCols.indexOf(key) !== -1) continue;
                        if(key === 'generic_id') continue;

                        specific.call += key + ',';
                        specific.values += '?,';
                        specific.array.push(select[key]);
                    }
                }

                specific.call = specific.call.slice(0, -1) + ')';
                specific.values = specific.values.slice(0, -1) + ')';

                specific.call += specific.values;

                callback();
            });
        },
        function(callback) {
            query(specific.call, specific.array, callback);
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
    })
};

/**
 * Sets the deleted field to CURRENT_TIMESTAMP on a single table row.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableId Integer: ID of table row being deleted
 */

module.exports.delete = function(req, res, next, tableId) {
    tableId = parseInt(tableId);

    async.series([
        function(callback) {
            ownership(req, tableId, false, callback);
        },
        function(callback) {
            query('UPDATE generic SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};

/**
 * Sets the deleted field to NULL on a single table row.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableId Integer: ID of table row being revived
 */

module.exports.revive = function(req, res, next, tableId) {
    tableId = parseInt(tableId);

    async.series([
        function(callback) {
            ownership(req, tableId, true, callback);
        },
        function(callback) {
            query('UPDATE generic SET deleted = NULL WHERE id = ?', [tableId], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(200).send();
    });
};
