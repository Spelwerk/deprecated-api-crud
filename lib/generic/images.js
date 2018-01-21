'use strict';

const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const getSchema = require('../../app/initializers/database').getSchema;
const sql = require('../database/sql');
const permission = require('../database/permission');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, res, next, tableName) {
    let schema = getSchema(tableName);

    if(schema.security.user && !req.user.id) return next(UserNotLoggedInError);

    let table_has_image = tableName + '_has_image';
    let table_id = tableName + '_id';

    try {
        await permission.verify(req, tableName, req.params.id);

        await sql('INSERT INTO ' + table_has_image + ' (' + table_id + ',image_id) VALUES (?,?)', [req.params.id, req.body.insert_id]);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function remove(req, res, next, tableName) {
    let schema = getSchema(tableName);

    if(schema.security.user && !req.user.id) return next(UserNotLoggedInError);

    let table_has_image = tableName + '_has_image';
    let table_id = tableName + '_id';

    try {
        await permission.verify(req, tableName, req.params.id);

        await sql('DELETE FROM ' + table_has_image + ' WHERE ' + table_id + ' = ? AND image_id = ?', [req.params.id, req.params.image]);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.remove = remove;
