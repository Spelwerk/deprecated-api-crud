'use strict';

let UserNotAllowedToEditError = require('../../lib/errors/user-not-allowed-to-edit-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

let permissions = require('./permissions');

/**
 * Verifies if logged in user considered is owner of the table row.
 *
 * @param user Object: user object set upon receiving token in middleware
 * @param tableName String: Name of table being verified for user ownership
 * @param tableId String: ID of table row being verified for user ownership
 * @param callback
 * @returns callback(err)
 */
function ownership(user, tableName, tableId, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    if(user.admin) return callback();

    tableId = parseInt(tableId);

    permissions.get(user, tableName, tableId, function(err, favorite, owner, edit) {
        if(err) return callback(err);

        if(!owner && !edit) return callback(new UserNotAllowedToEditError);

        callback();
    });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = ownership;
