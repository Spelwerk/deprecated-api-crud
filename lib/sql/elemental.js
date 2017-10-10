'use strict';

let UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

var async = require('async');

var query = require('./query'),
    combination = require('./combination'),
    ownership = require('./ownership');

var tables = require('../../app/initializers/database').getTables();

/**
 * Verifies ownership on multiple tables
 *
 * @param user Object
 * @param body Object
 * @param ownershipArray Array
 * @param callback
 * @returns callback(err)
 */

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

/**
 * Adds multiple combination IDs to tables
 *
 * @param body Object
 * @param tableName String
 * @param tableId Integer
 * @param combinationArray Array
 * @param callback
 * @returns callback(err)
 */

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

/**
 * Copies all relations to a new ID
 *
 * @param tableName String
 * @param tableId Integer
 * @param newId Integer
 * @param relationArray Array
 * @param callback
 * @returns callback(err)
 */

function copyRelations(tableName, tableId, newId, relationArray, callback) {
    if(relationArray.length === 0) return callback();

    tableId = parseInt(tableId);
    newId = parseInt(newId);

    async.each(relationArray, function(relationName, next) {
        var table_has_relation = tableName + '_has_' + relationName,
            table_id = tableName + '_id';

        var cols = [],
            body;

        async.series([
            function(callback) {
                query('SELECT * FROM ' + table_has_relation + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results, fields) {
                    if(err) return callback(err);

                    cols = fields;
                    body = results;

                    callback();
                });
            },
            function(callback) {
                if(body.length === 0) return callback();

                var sql = 'INSERT INTO ' + table_has_relation + ' (',
                    values = ' VALUES ',
                    array = [];

                // Loop cols and add field name to the SQL String
                for(let fieldName in cols) {
                    if(fieldName === 'id') continue;

                    sql += fieldName + ',';
                }

                // Loop body/results and add field values to the String
                for(let i in body) {
                    var row = body[i];

                    values += '(';

                    // Loop row and copy value to the String
                    // Do not copy original tableId, insert newId instead
                    for(let key in row) {
                        if(key === 'id') continue;

                        values += '?,';

                        if(key.indexOf(table_id) !== -1) {
                            array.push(newId);
                        } else {
                            array.push(row[key]);
                        }
                    }

                    values = values.slice(0, -1);

                    values += '),';
                }

                sql = sql.slice(0, -1) + ')';
                values = values.slice(0, -1);

                sql += values;

                query(sql, array, callback);
            }
        ], function(err) {
            next(err);
        })
    }, function(err) {
        callback(err);
    })
}

/**
 * Loops through full tables list and returns with all tableName related tables
 *
 * @param tableName String
 * @returns {[Boolean,Array,Array]}
 */

function tablesLoop(tableName) {
    var userOwned = false,
        combinationsArray = [],
        relationArray = [];

    for(let x in tables) {
        var tblName = tables[x];

        // If there's a table called user_has_* then the table can be owned by users
        if(tblName.indexOf('user_has_' + tableName) !== -1) {
            userOwned = true;
        }

        // If there's a table called tableName_is_* then a nullable combination table exists
        if(tblName.indexOf(tableName + '_is_') !== -1 && tblName.indexOf('is_copy') === -1) {
            var cmbName = tblName.split('_is_')[1];

            combinationsArray.push(cmbName);
        }

        // If there's a table called tableName_has_* then a relation table exists
        if(tblName.indexOf(tableName + '_has_') !== -1 && tblName.indexOf('has_comment') === -1) {
            var rlnName = tblName.split('_has_')[1];

            relationArray.push(rlnName);
        }
    }

    return [userOwned, combinationsArray, relationArray];
}

/**
 * If there is a combination table, add the combination_id to the ignored array
 * so that it won't try to populate in the regular table
 *
 * @param combinationsArray Array
 * @param ignoredArray Array
 * @returns {Array}
 */

function ignoredLoop(combinationsArray, ignoredArray) {
    if(combinationsArray.length === 0) return ignoredArray;

    for(let i in combinationsArray) {
        var key = combinationsArray[i] + '_id';

        ignoredArray.push(key);
    }

    return ignoredArray;
}

/**
 * Creates a new row in table
 *
 * @param user Object
 * @param body Object
 * @param tableName String
 * @param options Object
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, body, tableName, options, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    var tableId,
        ignoredArray = ['id', 'user_id', 'canon', 'created', 'deleted', 'updated'];

    options = options || {};
    options = {
        ownership: options.ownership || []
    };

    var tablesResult = tablesLoop(tableName),
        userOwned = tablesResult[0],
        combinationsArray = tablesResult[1],
        adminRestriction = !userOwned;

    if(adminRestriction && !user.admin) return callback(new UserNotAdministratorError);

    ignoredArray = ignoredLoop(combinationsArray, ignoredArray);

    async.series([
        function(callback) {
            verifyMultipleOwnership(user, body, options.ownership, callback);
        },
        function(callback) {
            var sql = 'INSERT INTO ' + tableName + ' (user_id,',
                values = ' VALUES (?,',
                array = [user.id];

            for(let key in body) {
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

/**
 * Edits a row in table
 *
 * @param user Object
 * @param body Object
 * @param tableName String
 * @param tableId Integer
 * @param options Object
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, body, tableName, tableId, options, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    tableId = parseInt(tableId);

    var ignoredArray = ['id', 'user_id', 'canon', 'created', 'deleted', 'updated'];

    options = options || {};
    options = {
        ownership: options.ownership || [],
        updatedField: options.updatedField || false
    };

    var tablesResult = tablesLoop(tableName),
        userOwned = tablesResult[0],
        combinationsArray = tablesResult[1],
        adminRestriction = !userOwned;

    if(adminRestriction && !user.admin) return callback(new UserNotAdministratorError);

    ignoredArray = ignoredLoop(combinationsArray, ignoredArray);

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

            for(let key in body) {
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

/**
 * Deletes a row from table
 *
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param options Object
 * @param callback
 * @returns callback(err)
 */

module.exports.delete = function(user, tableName, tableId, options, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    tableId = parseInt(tableId);

    var userOwned = tablesLoop(tableName)[1],
        adminRestriction = !userOwned;

    if(adminRestriction && !user.admin) return callback(new UserNotAdministratorError);

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

/**
 * Copies a row from table
 *
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param options Object
 * @param callback
 * @returns callback(err, id)
 */

module.exports.clone = function(user, tableName, tableId, options, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    tableId = parseInt(tableId);

    var ignoredArray = ['id', 'user_id', 'canon', 'created', 'deleted', 'updated'],
        body = {},
        newId;

    options = options || {};
    options = {
        ownership: options.ownership || []
    };

    var tablesResult = tablesLoop(tableName),
        userOwned = tablesResult[0],
        combinationsArray = tablesResult[1],
        relationArray = tablesResult[2],
        adminRestriction = !userOwned;

    if(adminRestriction && !user.admin) return callback(new UserNotAdministratorError);

    ignoredArray = ignoredLoop(combinationsArray, ignoredArray);

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

            for(let key in body) {
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
            copyRelations(tableName, tableId, newId, relationArray, callback);
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
