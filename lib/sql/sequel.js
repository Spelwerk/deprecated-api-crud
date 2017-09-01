var query = require('./query');

var ignoredCols = ['id', 'created', 'deleted', 'updated'];

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

    var order_by = req.headers['x-order-by'] !== undefined
        ? JSON.parse(req.headers['x-order-by'])
        : null;

    var pagination_limit = req.headers['x-pagination-limit'] !== undefined
        ? req.headers['x-pagination-limit']
        : null;

    var pagination_amount = req.headers['x-pagination-amount'] !== undefined
        ? req.headers['x-pagination-amount']
        : null;

    if(order_by !== null) {
        call += ' ORDER BY ';

        for (var key in order_by) {
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

        if(singleObject && results.length === 0) return next({status: 404, message: 'Not Found', error: 'The requested object was not found.'});

        var sendObject = singleObject
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
 * @param adminRestriction boolean: Requires administrator on logged in user to change
 * @param tableName String: Name of table being posted into
 */

module.exports.post = function(req, res, next, adminRestriction, tableName) {
    if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    if(adminRestriction && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not Administrator'});

    var insert = {};

    var body        = req.body,
        call        = 'INSERT INTO ' + tableName + ' (',
        values      = ' VALUES (',
        valuesArray = [];

    for(var key in body) {
        if(body.hasOwnProperty(key) && body[key] !== '') {
            if(ignoredCols.indexOf(key) !== -1) continue;

            call += key + ',';
            values += '?,';
            valuesArray.push(body[key]);
        }
    }

    call = call.slice(0, -1) + ')';
    values = values.slice(0, -1) + ')';

    call += values;

    query(call, valuesArray, function(err, result) {
        if(err) return next(err);

        insert.id = parseInt(result.insertId);

        res.status(201).send({id: insert.id});
    });
};

/**
 * Changes single table row with new data.
 *
 * @param req object: Express request object
 * @param res object: Express response object
 * @param next function: Express next() function
 * @param adminRestriction boolean: Requires administrator on logged in user to change
 * @param tableName String: Name of table being changed
 * @param tableId Integer: ID of table row being changed
 * @param useUpdateColumn boolean: Will set the updated field to CURRENT_TIMESTAMP if set to true
 */

module.exports.put = function(req, res, next, adminRestriction, tableName, tableId, useUpdateColumn) {
    tableId = parseInt(tableId);
    useUpdateColumn = useUpdateColumn || false;

    if(adminRestriction && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

    var body        = req.body,
        call        = 'UPDATE ' + tableName + ' SET ',
        valuesArray = [];

    for(var key in body) {
        if(body.hasOwnProperty(key) && body[key] !== '') {
            call += key + ' = ?,';
            valuesArray.push(body[key]);
        }
    }

    if(useUpdateColumn) call += ' updated = CURRENT_TIMESTAMP,';

    call = call.slice(0, -1) + ' WHERE id = ?';

    valuesArray.push(tableId);

    query(call, valuesArray, function(err) {
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
 * @param adminRestriction boolean: Requires administrator on logged in user to change
 * @param tableName Name of table being changed
 * @param tableId Integer: ID of table row being deleted
 */

module.exports.delete = function(req, res, next, adminRestriction, tableName, tableId) {
    tableId = parseInt(tableId);

    if(adminRestriction && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

    query('UPDATE ' + tableName + ' SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [tableId], function(err) {
        if(err) return next(err);

        res.status(204).send();
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

    if(!req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator'});

    query('UPDATE ' + tableName + ' SET deleted = NULL WHERE id = ?', [tableId], function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
};
