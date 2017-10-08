var async = require('async');

var query = require('./query'),
    combination = require('./combination'),
    ownership = require('./ownership');

var tables = require('../../app/initializers/database').getTables();

function verifyMultipleOwnership(user, body, ownershipArray, callback) {
    if(ownershipArray.length === 0) return callback();

    async.each(ownershipArray, function(ownedTableName, next) {
        var key = ownedTableName + '_id';

        if(!body.hasOwnProperty(key)) return next();
        if(body[key] === '') return next();

        var id = parseInt(body[key]);

        ownership(user, ownedTableName, id, callback);
    }, function(err) {
        callback(err);
    });
}

function postCombinations(body, tableName, tableId, combinationArray, callback) {
    if(combinationArray.length === 0) return callback();

    async.each(combinationArray, function(combinationName, next) {
        var key = combinationName + '_id';

        if(!body.hasOwnProperty(key)) return next();
        if(body[key] === '') return next();

        var id = parseInt(body[key]);

        combination(tableName, tableId, combinationName, id, next);
    }, function(err) {
        callback(err);
    });
}

function tablesLoop(tableName) {
    var combinationsArray = [],
        userOwned = false;

    for(var x in tables) {
        var tblName = tables[x];

        if(tblName.indexOf(tableName + '_is_') !== -1 && tblName.indexOf('is_copy') === -1) {
            var splitName = tblName.split('_is_')[1];

            combinationsArray.push(splitName);
        }

        if(tblName.indexOf('user_has_' + tableName) !== -1) {
            userOwned = true;
        }
    }

    return [combinationsArray, userOwned];
}

module.exports.post = function(user, body, tableName, options, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    var tableId,
        ignoredArray = ['id', 'user_id', 'canon', 'created', 'deleted', 'updated'];

    options = options || {};
    options = {
        ownership: options.ownership || []
    };

    var tablesResult = tablesLoop(tableName),
        combinationsArray = tablesResult[0],
        userOwned = tablesResult[1],
        adminRestriction = !userOwned;

    if(adminRestriction && !user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    for(var i in combinationsArray) {
        var key = combinationsArray[i] + '_id';

        ignoredArray.push(key);
    }

    async.series([
        function(callback) {
            verifyMultipleOwnership(user, body, options.ownership, callback);
        },
        function(callback) {
            var sql = 'INSERT INTO ' + tableName + ' (user_id,',
                values = ' VALUES (?,',
                array = [user.id];

            for(var key in body) {
                if(!body.hasOwnProperty(key)) continue;
                if(body[key] === '') continue;
                if(body[key] === undefined) continue;
                if(ignoredArray.indexOf(key) !== -1) continue;

                sql += key + ',';
                values += '?,';
                array.push(body[key]);
            }

            sql = sql.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';

            sql += values;

            query(sql, array, function(err, result) {
                if(err) return callback(err);

                tableId = parseInt(result.insertId);

                callback();
            });
        },
        function(callback) {
            postCombinations(body, tableName, tableId, combinationsArray, callback);
        },
        function(callback) {
            if(!userOwned) return callback();

            var call = 'INSERT INTO user_has_' + tableName  + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)';

            query(call, [user.id, tableId], callback);
        }
    ], function(err) {
        callback(err, tableId);
    });
};

module.exports.put = function(user, body, tableName, tableId, options, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    tableId = parseInt(tableId);

    var ignoredArray = ['id', 'user_id', 'canon', 'created', 'deleted', 'updated'];

    options = options || {};
    options = {
        ownership: options.ownership || [],
        updatedField: options.updatedField || false
    };

    var tablesResult = tablesLoop(tableName),
        combinationsArray = tablesResult[0],
        userOwned = tablesResult[1],
        adminRestriction = !userOwned;

    if(adminRestriction && !user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    for(var i in combinationsArray) {
        var key = combinationsArray[i] + '_id';

        ignoredArray.push(key);
    }

    async.series([
        function(callback) {
            if(!userOwned) return callback();

            ownership(user, tableName, tableId, callback);
        },
        function(callback) {
            verifyMultipleOwnership(user, body, options.ownership, callback);
        },
        function(callback) {
            var sql = 'UPDATE ' + tableName + ' SET ',
                array = [];

            for(var key in body) {
                if(!body.hasOwnProperty(key)) continue;
                if(body[key] === '') continue;
                if(body[key] === undefined) continue;
                if(ignoredArray.indexOf(key) !== -1) continue;

                sql += key + ' = ?,';
                array.push(body[key]);
            }

            if(array.length === 0) return callback();

            if(options.updatedField) sql += ' updated = CURRENT_TIMESTAMP,';

            sql = sql.slice(0, -1) + ' WHERE id = ?';
            array.push(tableId);

            query(sql, array, callback);
        },
        function(callback) {
            postCombinations(body, tableName, tableId, combinationsArray, callback);
        }
    ], function(err) {
        callback(err);
    });
};

module.exports.delete = function(user, tableName, tableId, options, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    tableId = parseInt(tableId);

    var userOwned = tablesLoop(tableName)[1],
        adminRestriction = !userOwned;

    if(adminRestriction && !user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not administrator'});

    async.series([
        function(callback) {
            if(!userOwned) return callback();

            ownership(user, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId], callback);
        }
    ], function(err) {
        callback(err);
    });
};

module.exports.clone = function(user, tableName, tableId, options, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    tableId = parseInt(tableId);

    var ignoredArray = ['id', 'user_id', 'canon', 'created', 'deleted', 'updated'],
        body = {},
        newId;

    options = options || {};
    options = {
        ownership: options.ownership || []
    };

    var tablesResult = tablesLoop(tableName),
        combinationsArray = tablesResult[0],
        userOwned = tablesResult[1],
        adminRestriction = !userOwned;

    if(adminRestriction && !user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    for(var i in combinationsArray) {
        var key = combinationsArray[i] + '_id';

        ignoredArray.push(key);
    }

    async.series([
        function(callback) {
            verifyMultipleOwnership(user, body, options.ownership, callback);
        },
        function(callback) {
            query('SELECT * FROM ' + tableName + ' WHERE id = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                body = results[0];

                callback();
            });
        },
        function(callback) {
            if(combinationsArray.length === 0) return callback();

            async.each(combinationsArray, function(cmbName, next) {
                var table_has_cmb = tableName + '_is_' + cmbName,
                    table_id = tableName + '_id',
                    cmb_id = cmbName + '_id';

                query('SELECT * FROM ' + table_has_cmb + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results) {
                    if(err) return next(err);

                    if(!results[0]) return next();

                    body[cmb_id] = results[0][cmb_id];

                    next();
                });
            }, function(err) {
                callback(err);
            });
        },
        function(callback) {
            var sql = 'INSERT INTO ' + tableName + ' (user_id,',
                values = ' VALUES (?,',
                array = [user.id];

            for(var key in body) {
                if(!body.hasOwnProperty(key)) continue;
                if(body[key] === '') continue;
                if(body[key] === undefined) continue;
                if(ignoredArray.indexOf(key) !== -1) continue;

                sql += key + ',';
                values += '?,';
                array.push(body[key]);
            }

            sql = sql.slice(0, -1) + ')';
            values = values.slice(0, -1) + ')';

            sql += values;

            query(sql, array, function(err, result) {
                if(err) return callback(err);

                newId = parseInt(result.insertId);

                callback();
            });
        },
        function(callback) {
            postCombinations(body, tableName, newId, combinationsArray, callback);
        },
        function(callback) {
            combination(tableName, newId, 'copy', tableId, callback);
        },
        function(callback) {
            if(!userOwned) return callback();

            var call = 'INSERT INTO user_has_' + tableName  + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)';

            query(call, [user.id, newId], callback);
        }
    ], function(err) {
        callback(err, newId);
    });
};
