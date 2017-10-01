'use strict';

var query = require('./query');

/**
 * Returns permissions of user relation table
 *
 * @param user Object: user object set upon receiving token in middleware
 * @param tableName String: Name of table being verified for user ownership
 * @param tableId String: ID of table row being verified for user ownership
 * @param callback
 * @returns callback(err, favorite, owner, edit)
 */

module.exports = function(user, tableName, tableId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    tableId = parseInt(tableId);

    var user_has_table = 'user_has_' + tableName,
        table_id = tableName + '_id';

    query('SELECT favorite,owner,edit FROM ' + user_has_table + ' WHERE user_id = ? AND ' + table_id + ' = ?', [user.id, tableId], function(err, results) {
        if(err) return callback(err);

        var favorite = !!results[0].favorite,
            owner = !!results[0].owner,
            edit = !!results[0].edit;

        callback(null, favorite, owner, edit);
    });
};
