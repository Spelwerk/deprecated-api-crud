var async = require('async'),
    mysql = require('mysql');

var logger = require(appRoot + '/lib/logger'),
    auth = require(appRoot + '/lib/sql/auth'),
    pool = require(appRoot + '/app/initializers/database').getPool();

function query(call, params, callback) {
    if(params) {
        call = mysql.format(call, params);
    }

    pool.query(call, function(err, result, fields) {
        var errorObject = null;

        if(err) {
            errorObject.status = 500;
            errorObject.message = 'Database error';
            errorObject.error = err;
            errorObject.query = call;
        }

        callback(errorObject, result, fields);
    });
}

module.exports = query;

exports.get = function(req, call, params, callback) {
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

    query(call, params, callback);
};

exports.post = function(req, tableName, adminRestriction, userContent, callback) {
    if(!req.user.id) return callback('Forbidden.');

    if(adminRestriction && !req.user.admin) return callback('Forbidden.');

    var insert = {};

    async.series([
        function(callback) {
            var body        = req.body,
                call        = 'INSERT INTO ' + tableName + ' (',
                values      = ' VALUES (',
                valuesArray = [];

            for(var key in body) {
                if(body.hasOwnProperty(key) && body[key] !== '') {
                    call += key + ',';
                    values += '?,';
                    valuesArray.push(body[key]);
                }
            }

            call = call.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';

            call += values;

            query(call, valuesArray, function(err, result) {
                insert.id = parseInt(result.insertId);

                callback(err);
            });
        },
        function(callback) {
            if(!userContent) return callback();

            query('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)', [req.user.id, insert.id], callback);
        }
    ],function(err) {
        callback(err, insert);
    });
};

exports.put = function(req, tableName, tableId, adminRestriction, callback) {
    async.series([
        function(callback) {
            auth.ownership(req, adminRestriction, tableName, tableId, callback);
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

            call = call.slice(0, -1) + ' WHERE id = ?';

            valuesArray.push(tableId);

            query(call, valuesArray, callback);
        }
    ],function(err) {
        callback(err);
    });
};

exports.canon = function(req, tableName, tableId, callback) {
    async.series([
        function(callback) {
            auth.ownership(req, true, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET canon = 1 WHERE id = ?', [tableId], callback);
        }
    ],function(err) {
        callback(err);
    });
};

exports.clone = function(req, tableName, tableId, adminRestriction, userContent, callback) {
    var call        = 'INSERT INTO ' + tableName + ' (',
        valuesArray = [],
        clone       = {};

    async.series([
        function(callback) {
            query('SELECT * FROM ' + tableName + ' WHERE id = ?', [tableId], function(err, result) {
                var select = result[0],
                    values = ' VALUES (';

                for(var key in select) {
                    if(select.hasOwnProperty(key)) {
                        if(key === 'id') continue;
                        if(key === 'canon') continue;
                        if(key === 'popularity') continue;
                        if(key === 'created') continue;
                        if(key === 'deleted') continue;
                        if(key === 'updated') continue;

                        call += key + ',';
                        values += '?,';
                        valuesArray.push(select[key]);
                    }
                }

                call = call.slice(0, -1) + ')';
                values = values.slice(0, -1) + ')';

                call += values;

                callback(err);
            });
        },
        function(callback) {
            query(call, valuesArray, function(err, result) {
                clone.id = result.insertId;

                callback(err);
            });
        },
        function(callback) {
            if(!userContent) return callback();

            query('INSERT INTO user_has_' + tableName + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)', [req.user.id, clone.id], callback);
        }
    ],function(err) {
        callback(err, clone);
    })
};

exports.delete = function(req, tableName, tableId, adminRestriction, callback) {
    async.series([
        function(callback) {
            auth.ownership(req, adminRestriction, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId], callback);
        }
    ],function(err) {
        callback(err);
    });
};

exports.revive = function(req, tableName, tableId, callback) {
    async.series([
        function(callback) {
            auth.ownership(req, true, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET deleted = NULL WHERE id = ?', [tableId], callback);
        }
    ],function(err) {
        callback(err);
    });
};
