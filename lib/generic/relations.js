'use strict';

const yaml = require('node-yaml').readSync;
const plural = yaml('../../config/plural.yml');

const basic = require('./basics');
const relation = require('../database/relation');

async function insert(req, res, next, tableName, tableId, relationName, relationId, ignoredFields) {
    try {
        await relation.insert(req, req.body, tableName, tableId, relationName, relationId, ignoredFields);

        res.status(204).send();
    } catch(e) {
        return next(e);
    }
}

async function update(req, res, next, tableName, tableId, relationName, relationId, ignoredFields) {
    try {
        await relation.update(req, req.body, tableName, tableId, relationName, relationId, ignoredFields);

        res.status(204).send();
    } catch(e) {
        return next(e);
    }
}

async function remove(req, res, next, tableName, tableId, relationName, relationId) {
    try {
        await relation.remove(req, tableName, tableId, relationName, relationId);

        res.status(204).send();
    } catch(e) {
        return next(e);
    }
}

async function route(router, tableName, relationName) {
    let relationRoute = plural[relationName];

    let table_has_relation = tableName + '_has_' + relationName;
    let table_id = tableName + '_id';
    let relation_id = relationName + '_id';
    let query = 'SELECT * ' +
        'FROM ' + table_has_relation + ' ' +
        'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + table_has_relation + '.' + relation_id  + ' ' +
        'WHERE deleted IS NULL';

    router.route('/:id/' + relationRoute)
        .get(async (req, res, next) => {
            let call = query + ' AND ' + table_has_relation + '.' + table_id  + ' = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        })
        .post(async (req, res, next) => {
            await insert(req, res, next, tableName, req.params.id, relationName, req.body.insert_id);
        });

    router.route('/:id/' + relationRoute + '/name')
        .get(async (req, res, next) => {
            let call = 'SELECT ' + relation_id + ' AS id, name FROM ' + table_has_relation + ' ' +
                'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + table_has_relation + '.' + relation_id  + ' ' +
                'WHERE ' + table_id  + ' = ? AND deleted IS NULL';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/:id/' + relationRoute + '/value')
        .get(async (req, res, next) => {
            let call = 'SELECT ' + relation_id + ' AS id, name, value FROM ' + table_has_relation + ' ' +
                'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + table_has_relation + '.' + relation_id  + ' ' +
                'WHERE ' + table_id  + ' = ? AND deleted IS NULL';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/:id/' + relationRoute + '/:item')
        .get(async (req, res, next) => {
            let call = query + ' AND ' +
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
