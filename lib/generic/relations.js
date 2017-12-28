'use strict';

const basic = require('./basic');
const relations = require('../database/relations');

async function insert(req, res, next, tableName, tableId, relationName, relationId, ignoredFields) {
    try {
        await relations.insert(req, req.body, tableName, tableId, relationName, relationId, ignoredFields);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function update(req, res, next, tableName, tableId, relationName, relationId, ignoredFields) {
    try {
        await relations.update(req, req.body, tableName, tableId, relationName, relationId, ignoredFields);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function remove(req, res, next, tableName, tableId, relationName, relationId) {
    try {
        await relations.remove(req, tableName, tableId, relationName, relationId);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function route(router, tableName, routeName, relationName) {
    let table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    let query = 'SELECT * ' +
        'FROM ' + table_has_relation + ' ' +
        'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + table_has_relation + '.' + relation_id  + ' ' +
        'WHERE deleted IS NULL';

    router.route('/:id/' + routeName)
        .get(async (req, res, next) => {
            let call = query + ' AND ' + table_has_relation + '.' + table_id  + ' = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        })
        .post(async (req, res, next) => {
            await insert(req, res, next, tableName, req.params.id, relationName, req.body.insert_id);
        });

    router.route('/:id/' + routeName + '/:item')
        .get(async (req, res, next) => {
            let call = sql + ' AND ' +
                table_has_relation + '.' + table_id  + ' = ? AND ' +
                table_has_relation + '.' + relation_id + ' = ?';

            await basic.select(req, res, next, call, [req.params.id, req.params.item, true]);
        })
        .put(async (req, res, next) => {
            await update(req, res, next, tableName, req.params.id, relationName, req.params.item);
        })
        .delete(async (req, res, next) => {
            await remove(req, res, next, tableName, req.params.id, relationName, req.params.item);
        });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
module.exports.route = route;
