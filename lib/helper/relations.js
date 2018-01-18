'use strict';

let sequel = require('./sequel'),
    relation = require('../sql/relation');

/**
 * Creates a row in a relation table
 * @deprecated
 * @param req Object
 * @param res Object
 * @param next Object
 * @param tableName String
 * @param tableId Integer
 * @param relationName String
 * @param relationId Integer
 * @param ignoredFields Array
 */
function post(req, res, next, tableName, tableId, relationName, relationId, ignoredFields) {
    relation.post(req.user, tableName, tableId, relationName, relationId, req.body, ignoredFields, function(err) {
        if(err) return next(err);

        res.status(201).send();
    });
}

/**
 * Edits a row in a relation table
 * @deprecated
 * @param req Object
 * @param res Object
 * @param next Object
 * @param tableName String
 * @param tableId Integer
 * @param relationName String
 * @param relationId Integer
 * @param ignoredFields Array
 */
function put(req, res, next, tableName, tableId, relationName, relationId, ignoredFields) {
    relation.put(req.user, tableName, tableId, relationName, relationId, req.body, ignoredFields, function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
}

/**
 * Removes a row from a relation table
 * @deprecated
 * @param req Object
 * @param res Object
 * @param next Object
 * @param tableName String
 * @param tableId Integer
 * @param relationName String
 * @param relationId Integer
 */
function remove(req, res, next, tableName, tableId, relationName, relationId) {
    relation.remove(req.user, tableName, tableId, relationName, relationId, function(err) {
        if(err) return next(err);

        res.status(204).send();
    });
}

/**
 * Creates a route for an entire relation, with get/post/put/delete
 * @deprecated
 * @param router Router Object
 * @param tableName String
 * @param routeName String
 * @param relationName String
 */
function route(router, tableName, routeName, relationName) {
    let table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    let sql = 'SELECT * ' +
        'FROM ' + table_has_relation + ' ' +
        'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + table_has_relation + '.' + relation_id  + ' ' +
        'WHERE deleted IS NULL';

    router.route('/:id/' + routeName)
        .get(function(req, res, next) {
            let call = sql + ' AND ' + table_has_relation + '.' + table_id  + ' = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req.user, tableName, req.params.id, relationName, req.body.insert_id, req.body, null, function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/' + routeName + '/:itemId')
        .get(function(req, res, next) {
            let call = sql + ' AND ' +
                table_has_relation + '.' + table_id  + ' = ? AND ' +
                table_has_relation + '.' + relation_id + ' = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.itemId]);
        })
        .put(function(req, res, next) {
            relation.put(req.user, tableName, req.params.id, relationName, req.params.itemId, req.body, null, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            relation.remove(req.user, tableName, req.params.id, relationName, req.params.itemId, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.post = post;
module.exports.put = put;
module.exports.remove = remove;
module.exports.route = route;