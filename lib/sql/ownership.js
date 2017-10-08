'use strict';

var permissions = require('./permissions');

/**
 * Verifies if logged in user considered is owner of the table row.
 *
 * @param user Object: user object set upon receiving token in middleware
 * @param tableName String: Name of table being verified for user ownership
 * @param tableId String: ID of table row being verified for user ownership
 * @param callback
 * @returns callback(err)
 */

module.exports = function(user, tableName, tableId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    if(user.admin) return callback();

    tableId = parseInt(tableId);

    permissions.get(user, tableName, tableId, function(err, favorite, owner, edit) {
        if(err) return callback(err);

        if(!owner && !edit) return callback({status: 403, message: 'Forbidden', error: 'User is not owner or administrator and may not change this row'});

        callback();
    });
};
