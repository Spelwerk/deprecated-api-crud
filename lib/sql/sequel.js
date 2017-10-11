'use strict';

let AppError = require('../../lib/errors/app-error'),
    UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error');

let query = require('./query'),
    elemental = require('./elemental');

/**
 * Queries database for a list and sends response with results and fields.
 *
 * @param req Object: Express request object
 * @param res Object: Express response object
 * @param next function: Express next() function
 * @param call String: SQL query to send into the query() function
 * @param params Array: Parameters with which query() function will format the SQL query
 * @param singleObject boolean: If the query should return a single object or not
 */

module.exports.get = function(req, res, next, call, params, singleObject) {
    singleObject = singleObject || false;

    let order_by = req.headers['x-order-by'] !== undefined
        ? JSON.parse(req.headers['x-order-by'])
        : null;

    let pagination_limit = req.headers['x-pagination-limit'] !== undefined
        ? req.headers['x-pagination-limit']
        : null;

    let pagination_amount = req.headers['x-pagination-amount'] !== undefined
        ? req.headers['x-pagination-amount']
        : null;

    if(order_by !== null) {
        call += ' ORDER BY ';

        for (let key in order_by) {
            call += key + ' ' + order_by[key] + ', ';
        }

        call = call.slice(0, -2);
    }

    if(pagination_limit !== null) {
        call += ' LIMIT ' + pagination_limit;
    }

    if(pagination_amount !== null) {
        call += ',' + pagination_amount;
    }

    query(call, params, function(err, results, fields) {
        if(err) return next(err);

        if(singleObject && results.length === 0) return next(new AppError(404, "Not Found"));

        let sendObject = singleObject
            ? {result: results[0], fields: fields}
            : {length: results.length, results: results, fields: fields};

        res.status(200).send(sendObject);
    });
};

/**
 * Creates a row in table and sends response with inserted ID.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being posted into
 * @param options Object
 */

module.exports.post = function(req, res, next, tableName, options) {
    elemental.post(req.user, req.body, tableName, options, function(err, id) {
        if(err) return next(err);

        res.status(201).send({id: id});
    });
};

/**
 * Changes single table row with new data.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being changed
 * @param tableId Integer: ID of table row being changed
 * @param options Object
 */

module.exports.put = function(req, res, next, tableName, tableId, options) {
    elemental.put(req.user, req.body, tableName, tableId, options, function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};

/**
 * Sets the deleted field to CURRENT_TIMESTAMP on a single table row.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName Name of table being changed
 * @param tableId Integer: ID of table row being deleted
 * @param options Object { adminRestriction, userOwned }
 */

module.exports.delete = function(req, res, next, tableName, tableId, options) {
    elemental.delete(req.user, tableName, tableId, options, function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};

/**
 * Changes the canon boolean to become true.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being changed
 * @param tableId Integer: ID of table row being changed
 * @param canon Boolean: If canon should be true or false
 */

module.exports.canon = function(req, res, next, tableName, tableId, canon) {
    if(!req.user.admin) return next(new UserNotAdministratorError);

    tableId = parseInt(tableId);
    canon = canon || false;

    query('UPDATE ' + tableName + ' SET canon = ?, updated = CURRENT_TIMESTAMP WHERE id = ?', [canon, tableId], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};

/**
 * Clones a single table row into a new row and sets user as owner of this new row if userContent is enabled.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName String: Name of table being changed
 * @param tableId Integer: ID of table row being changed
 * @param options Object
 */

module.exports.clone = function(req, res, next, tableName, tableId, options) {
    elemental.clone(req.user, tableName, tableId, options, function(err, id) {
        if(err) return next(err);

        res.status(201).send({id: id});
    });
};

/**
 * Sets the deleted field to NULL on a single table row.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param tableName Name of table being changed
 * @param tableId Integer: ID of table row being revived
 */

module.exports.revive = function(req, res, next, tableName, tableId) {
    tableId = parseInt(tableId);

    if(!req.user.admin) return next(new UserNotAdministratorError);

    query('UPDATE ' + tableName + ' SET deleted = NULL WHERE id = ?', [tableId], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};
