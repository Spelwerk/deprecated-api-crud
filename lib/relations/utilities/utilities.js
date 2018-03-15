'use strict';

const relation = require('../../database/relation');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, res, next, tableName, tableId, relationName, relationId, ignoredFields) {
    await relation.insert(req, req.body, tableName, tableId, relationName, relationId, ignoredFields);

    res.status(204).send();
}

async function update(req, res, next, tableName, tableId, relationName, relationId, ignoredFields) {
    await relation.update(req, req.body, tableName, tableId, relationName, relationId, ignoredFields);

    res.status(204).send();
}

async function remove(req, res, next, tableName, tableId, relationName, relationId) {
    await relation.remove(req, tableName, tableId, relationName, relationId);

    res.status(204).send();
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
