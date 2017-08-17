var query = require('./query');

/**
 * Verifies if logged in user considered is owner of the table row.
 *
 * @param req object: Express request object
 * @param tableName String: Name of table being verified for user ownership
 * @param tableId String: ID of table row being verified for user ownership
 * @param adminRestriction boolean:
 * @param callback
 * @returns callback(error)
 */

module.exports = function(req, tableName, tableId, adminRestriction, callback) {
    if(!req.user.token) return callback({status: 403, message: 'User not logged in', error: 'Token not found in header'});

    if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    if(adminRestriction && !req.user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    if(req.user.admin) return callback();

    query('SELECT owner FROM user_has_' + tableName + ' WHERE user_id = ? AND ' + tableName + '_id = ?', [req.user.id, tableId], function(err, result) {
        if(err) return callback(err);

        req.user.owner = !!result[0];

        if(!req.user.owner) return callback({status: 403, message: 'Forbidden', error: 'User is not owner or administrator and may not change this row'});

        callback();
    });
};