var query = require('./query');

/**
 * Verifies if logged in user considered is owner of the table row.
 *
 * @param req object: Express request object
 * @param tableId String: ID of table row being verified for user ownership
 * @param adminRestriction boolean:
 * @param callback
 * @returns callback(error)
 */

module.exports = function(req, tableId, adminRestriction, callback) {
    if(!req.user.token) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in. Token not found in header'});

    if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in. Token could not be decoded'});

    if(adminRestriction && !req.user.admin) return callback({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    if(req.user.admin) return callback();

    if(req.user.verifiedOwner) return callback();

    query('SELECT id FROM generic WHERE id = ? AND user_id = ? ', [tableId, req.user.id], function(err, result) {
        if(err) return callback(err);

        req.user.owner = !!result[0].id;

        if(!req.user.owner) return callback({status: 403, message: 'Forbidden', error: 'User is not owner or administrator and may not change this row'});

        req.user.verifiedOwner = true;

        callback();
    });
};