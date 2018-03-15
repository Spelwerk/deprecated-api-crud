'use strict';

const yaml = require('node-yaml').readSync;
const plural = yaml('../../../config/plural.yml');
const basic = require('../../generic/basics');
const utilities = require('./utilities');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

function rootGet(router, tableName, relationName, query) {
    const relationRoute = plural[relationName];
    const table_has_relation = tableName + '_has_' + relationName;
    const table_id = tableName + '_id';

    router.get('/:id/' + relationRoute, async (req, res, next) => {
        let call = query + ' WHERE ' + table_has_relation + '.' + table_id + ' = ?';

        await basic.select(req, res, next, call, [req.params.id]);
    });
}

function rootPost(router, tableName, relationName) {
    const relationRoute = plural[relationName];

    router.post('/:id/' + relationRoute, async (req, res, next) => {
        await utilities.insert(req, res, next, tableName, req.params.id, relationName, req.body.insert_id);
    });
}

function itemGet(router, tableName, relationName, query) {
    const relationRoute = plural[relationName];
    const table_has_relation = tableName + '_has_' + relationName;
    const table_id = tableName + '_id';
    const relation_id = relationName + '_id';

    router.get('/:id/' + relationRoute + '/:item', async (req, res, next) => {
        let call = query + ' WHERE ' +
            table_has_relation + '.' + table_id + ' = ? AND ' +
            table_has_relation + '.' + relation_id + ' = ?';

        await basic.select(req, res, next, call, [req.params.id, req.params.item], true);
    });
}

function itemPut(router, tableName, relationName) {
    const relationRoute = plural[relationName];

    router.put('/:id/' + relationRoute + '/:item', async (req, res, next) => {
        await utilities.update(req, res, next, tableName, req.params.id, relationName, req.params.item);
    });
}

function itemDelete(router, tableName, relationName) {
    const relationRoute = plural[relationName];

    router.delete('/:id/' + relationRoute + '/:item', async (req, res, next) => {
        await utilities.remove(req, res, next, tableName, req.params.id, relationName, req.params.item);
    });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.rootGet = rootGet;
module.exports.rootPost = rootPost;

module.exports.itemGet = itemGet;
module.exports.itemPut = itemPut;
module.exports.itemDelete = itemDelete;
