'use strict';

let UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

const async = require('async');
const query = require('./query');
const combination = require('./combination');
const ownership = require('./ownership');
const getSchema = require('../../app/initializers/database').getSchema;

/**
 * Adds multiple combination IDs to tables
 * @deprecated
 * @param body Object
 * @param tableName String
 * @param tableId Integer
 * @param combinationArray Array
 * @param callback
 * @returns callback(err)
 */
function postCombinations(body, tableName, tableId, combinationArray, callback) {
    if(combinationArray.length === 0) return callback();

    async.eachLimit(combinationArray, 1, function(combinationName, next) {
        let key = combinationName + '_id';

        if(!body.hasOwnProperty(key)) return next();
        if(body[key] === '') return next();

        let id = parseInt(body[key]);

        combination(tableName, tableId, combinationName, id, next);
    }, function(err) {
        callback(err);
    });
}

/**
 * Copies all relations to a new ID
 * @deprecated
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

    async.eachLimit(relationArray, 1, function(relationName, next) {
        let table_has_relation = tableName + '_has_' + relationName,
            table_id = tableName + '_id';

        let cols = [],
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

                let sql = 'INSERT INTO ' + table_has_relation + ' (',
                    values = ' VALUES ',
                    array = [];

                // Loop cols and add field name to the SQL String
                for(let fieldName in cols) {
                    if(fieldName === 'id') continue;

                    sql += fieldName + ',';
                }

                // Loop body/results and add field values to the String
                for(let i in body) {
                    let row = body[i];

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
 * Looks through schema to find x_with_y relational data
 * @deprecated
 * @param schema Object
 * @param tableName String
 * @returns {Array}
 */
function getExtraData(schema, tableName) {
    let extraData = [],
        withData = schema.tables.withData;

    for(let i in withData) {
        let name = tableName + '_with_' + withData[i];
        let dataSchema = getSchema(name);

        extraData.push({name: name, fields: dataSchema.fields.accepted});
    }

    return extraData;
}

/**
 * Creates a new row in table
 * @deprecated
 * @param user Object
 * @param body Object
 * @param tableName String
 * @param callback
 * @returns callback(err, id)
 */
function post(user, body, tableName, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    let schema = getSchema(tableName);

    let tableId;

    if(schema.security.admin && !user.admin) return callback(new UserNotAdministratorError);

    async.series([
        function(callback) {
            let sql = 'INSERT INTO ' + tableName + ' (user_id,',
                values = ' VALUES (?,',
                array = [user.id];

            for(let key in body) {
                if(!body.hasOwnProperty(key)) continue;
                if(body[key] === '') continue;
                if(body[key] === undefined) continue;
                if(schema.fields.accepted.indexOf(key) === -1) continue;

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
            postCombinations(body, tableName, tableId, schema.tables.isOne, callback);
        },
        function(callback) {
            if(!schema.security.user) return callback();

            let call = 'INSERT INTO user_has_' + tableName  + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)';

            query(call, [user.id, tableId], callback);
        }
    ], function(err) {
        callback(err, tableId);
    });
}

/**
 * Edits a row in table
 * @deprecated
 * @param user Object
 * @param body Object
 * @param tableName String
 * @param tableId Integer
 * @param callback
 * @returns callback(err)
 */
function put(user, body, tableName, tableId, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    let schema = getSchema(tableName);

    tableId = parseInt(tableId);

    if(schema.security.admin && !user.admin) return callback(new UserNotAdministratorError);

    async.series([
        function(callback) {
            if(!schema.security.user) return callback();

            ownership(user, tableName, tableId, callback);
        },
        function(callback) {
            let sql = 'UPDATE ' + tableName + ' SET ',
                array = [];

            for(let key in body) {
                if(!body.hasOwnProperty(key)) continue;
                if(body[key] === '') continue;
                if(body[key] === undefined) continue;
                if(schema.fields.accepted.indexOf(key) === -1) continue;

                sql += key + ' = ?,';
                array.push(body[key]);
            }

            if(array.length === 0) return callback();

            if(schema.fields.updated) sql += ' updated = CURRENT_TIMESTAMP,';

            sql = sql.slice(0, -1) + ' WHERE id = ?';
            array.push(tableId);

            query(sql, array, callback);
        },
        function(callback) {
            postCombinations(body, tableName, tableId, schema.tables.isOne, callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Deletes a row from table
 * @deprecated
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param callback
 * @returns callback(err)
 */
function remove(user, tableName, tableId, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    let schema = getSchema(tableName);

    tableId = parseInt(tableId);

    if(schema.security.admin && !user.admin) return callback(new UserNotAdministratorError);

    async.series([
        function(callback) {
            if(!schema.security.user) return callback();

            ownership(user, tableName, tableId, callback);
        },
        function(callback) {
            query('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId], callback);
        }
    ], function(err) {
        callback(err);
    });
}

/**
 * Copies a row from table
 * @deprecated
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param callback
 * @returns callback(err, id)
 */
function clone(user, tableName, tableId, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    let schema = getSchema(tableName),
        extraData = getExtraData(schema, tableName);

    tableId = parseInt(tableId);

    let body = {},
        newId,
        table_id = tableName + '_id';

    if(schema.security.admin && !user.admin) return callback(new UserNotAdministratorError);

    async.series([
        // Getting Body Data
        function(callback) {
            query('SELECT * FROM ' + tableName + ' WHERE id = ?', [tableId], function(err, results) {
                if(err) return callback(err);

                body = results[0];

                callback();
            });
        },

        // Getting Combinations
        function(callback) {
            if(schema.tables.isOne.length === 0) return callback();

            async.eachLimit(schema.tables.isOne, 1, function(combinationName, next) {
                let table_has_combination = tableName + '_is_' + combinationName,
                    table_id = tableName + '_id',
                    combination_id = combinationName + '_id';

                query('SELECT * FROM ' + table_has_combination + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results) {
                    if(err) return next(err);

                    if(results.length === 0) return next();

                    body[combination_id] = results[0][combination_id];

                    next();
                });
            }, function(err) {
                callback(err);
            });
        },

        // Getting Extra Data
        function(callback) {
            if(schema.tables.withData.length === 0) return callback();

            async.eachLimit(extraData, 1, function(item, next) {
                let tableWithName = item.name;

                query('SELECT * FROM ' + tableWithName + ' WHERE ' + table_id + ' = ?', [tableId], function(err, results) {
                    if(err) return next(err);

                    if(results.length === 0) return next();

                    let array = results[0];

                    for(let key in array) {
                        if(!array.hasOwnProperty(key)) continue;
                        if(key === table_id) continue;

                        body[key] = array[key];
                    }

                    callback();
                });
            }, function(err) {
                callback(err);
            });
        },

        // Creating the Clone
        function(callback) {
            let sql = 'INSERT INTO ' + tableName + ' (user_id,',
                values = ' VALUES (?,',
                array = [user.id];

            for(let key in body) {
                if(!body.hasOwnProperty(key)) continue;
                if(body[key] === '') continue;
                if(body[key] === undefined) continue;
                if(schema.fields.accepted.indexOf(key) === -1) continue;

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

        // Setting Relations
        function(callback) {
            let array = [];

            for(let i in schema.tables.hasMany) {
                array.push(schema.tables.hasMany[i]);
            }

            if(schema.supports.images) array.push('image');
            if(schema.supports.labels) array.push('label');

            copyRelations(tableName, tableId, newId, array, callback);
        },

        // Setting Combinations
        function(callback) {
            postCombinations(body, tableName, newId, schema.tables.isOne, callback);
        },

        // Setting Extra Data
        function(callback) {
            async.eachLimit(extraData, 1, function(item, next) {
                let tableWithName = item.name,
                    tableWithFields = item.fields;

                let sql = 'INSERT INTO ' + tableWithName  +' (' + table_id + ',',
                    values = ' VALUES(?,',
                    array = [newId];

                for(let key in body) {
                    if(!body.hasOwnProperty(key)) continue;
                    if(body[key] === '') continue;
                    if(body[key] === undefined) continue;
                    if(tableWithFields.indexOf(key) === -1) continue;

                    sql += key + ',';
                    values += '?,';
                    array.push(body[key]);
                }

                if(array.length === 1) return next();

                sql = sql.slice(0, -1) + ')';
                values = values.slice(0, -1) + ')';

                sql += values;

                query(sql, array, next);
            }, function(err) {
                callback(err);
            });
        },

        // Setting as Copy
        function(callback) {
            combination(tableName, newId, 'copy', tableId, callback);
        },

        // User
        function(callback) {
            if(!schema.security.user) return callback();

            query('INSERT INTO user_has_' + tableName  + ' (user_id,' + tableName + '_id,owner) VALUES (?,?,1)', [user.id, newId], callback);
        }
    ], function(err) {
        callback(err, newId);
    });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.post = post;
module.exports.put = put;
module.exports.remove = remove;
module.exports.clone = clone;