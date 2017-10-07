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

module.exports.post = function(user, body, tableName, options, callback) {
    var tableId,
        combinationsArray = [];

    options = {
        adminRestriction: options.adminRestriction || false,
        userOwned: options.userOwned || false,
        ignored: options.ignored || [],
        ownership: options.ownership || []
    };

    options.ignored.push('id', 'user_id', 'canon', 'created', 'deleted', 'updated');

    for(var x in tables) {
        var cmbName = tables[x];

        if(cmbName.indexOf(tableName + '_is_') !== -1 && cmbName.indexOf('is_copy') === -1) {
            var splitName = cmbName.split('_is_')[1];

            combinationsArray.push(splitName);
        }
    }

    for(var i in combinationsArray) {
        var key = combinationsArray[i] + '_id';

        options.ignored.push(key);
    }

    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    if(options.adminRestriction && !user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

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
                if(options.ignored.indexOf(key) !== -1) continue;

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
            if(!options.userOwned) return callback();

            var call = 'INSERT INTO user_has_' + tableName  + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)';

            query(call, [user.id, tableId], callback);
        }
    ], function(err) {
        callback(err, tableId);
    });
};

module.exports.put = function(user, body, tableName, tableId, options, callback) {
    tableId = parseInt(tableId);

    var combinationsArray = [];

    options = {
        adminRestriction: options.adminRestriction || false,
        userOwned: options.userOwned || false,
        ignored: options.ignored || [],
        ownership: options.ownership || [],
        updatedField: options.updatedField || false
    };

    options.ignored.push('id', 'user_id', 'canon', 'created', 'deleted', 'updated');

    for(var x in tables) {
        var cmbName = tables[x];

        if(cmbName.indexOf(tableName + '_is_') !== -1 && cmbName.indexOf('is_copy') === -1) {
            var splitName = cmbName.split('_is_')[1];

            combinationsArray.push(splitName);
        }
    }

    for(var i in combinationsArray) {
        var key = combinationsArray[i] + '_id';

        options.ignored.push(key);
    }

    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    if(options.adminRestriction && !user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    async.series([
        function(callback) {
            if(!options.userOwned) return callback();

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
                if(options.ignored.indexOf(key) !== -1) continue;

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
    options = {
        adminRestriction: options.adminRestriction || false,
        userOwned: options.userOwned || false
    };

    tableId = parseInt(tableId);

    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    if(options.adminRestriction && !user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not administrator'});

    async.series([
        function(callback) {
            if(!options.userOwned) return callback();

            ownership(user, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId], callback);
        }
    ], function(err) {
        callback(err);
    });
};
