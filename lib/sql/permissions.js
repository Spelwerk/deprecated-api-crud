'use strict';

let UserNotAllowedToEditError = require('../../lib/errors/user-not-allowed-to-edit-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

let async = require('async');

let query = require('./query');

/**
 * Returns permissions of user relation table
 *
 * @param user Object: user object set upon receiving token in middleware
 * @param tableName String: Name of table being verified for user ownership
 * @param tableId String: ID of table row being verified for user ownership
 * @param callback
 * @returns callback(err, favorite, owner, edit)
 */

function get(user, tableName, tableId, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    tableId = parseInt(tableId);

    let user_has_table = 'user_has_' + tableName,
        table_id = tableName + '_id';

    query('SELECT favorite,owner,edit FROM ' + user_has_table + ' WHERE user_id = ? AND ' + table_id + ' = ?', [user.id, tableId], function(err, results) {
        if(err) return callback(err);

        let favorite = !!results[0].favorite,
            owner = !!results[0].owner,
            edit = !!results[0].edit;

        callback(null, favorite, owner, edit);
    });
}

module.exports.get = get;

/**
 * Inserts the user into user_has_table so that the table row is saved for that user.
 *
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.keep = function(user, tableName, tableId, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    tableId = parseInt(tableId);

    let user_has_table = 'user_has_' + tableName,
        table_id = tableName + '_id';

    query('INSERT INTO ' + user_has_table + ' (user_id,' + table_id + ') VALUES (?,?)', [user.id, tableId], callback);
};

/**
 * Sets the favorite status in the table row.
 *
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param favorite Boolean
 * @param callback
 * @returns callback(err)
 */

module.exports.favorite = function(user, tableName, tableId, favorite, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    tableId = parseInt(tableId);
    favorite = !!favorite;

    let user_has_table = 'user_has_' + tableName,
        table_id = tableName + '_id';

    query('UPDATE ' + user_has_table + ' SET favorite = ? WHERE user_id = ? AND ' + table_id + ' = ?', [favorite, user.id, tableId], callback);
};

/**
 * Lets another user have edit permissions for the table row.
 *
 * @param user Object
 * @param tableName String
 * @param tableId Integer
 * @param userEditId Integer
 * @param edit Boolean
 * @param callback
 * @returns callback(err)
 */

module.exports.edit = function(user, tableName, tableId, userEditId, edit, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    tableId = parseInt(tableId);
    userEditId = parseInt(userEditId);
    edit = !!edit;

    let user_has_table = 'user_has_' + tableName,
        table_id = tableName + '_id';

    async.series([
        function(callback) {
            get(user, tableName, tableId, function(err, favorite, owner) {
                if(err) return callback(err);

                if(!owner) return callback(new UserNotAllowedToEditError);

                callback();
            });
        },
        function(callback) {
            query('UPDATE ' + user_has_table + ' SET edit = ? WHERE user_id = ? AND ' + table_id + ' = ?', [edit, userEditId, tableId], callback);
        }
    ], function(err) {
        callback(err);
    });
};
