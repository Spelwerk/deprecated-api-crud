'use strict';

const UserNotLoggedInError = require('../../../errors/user-not-logged-in-error');

const getSchema = require('../../../../app/initializers/database').getSchema;
const sql = require('../../../database/sql');

async function insert(req, res, next, tableName) {
    let schema = getSchema(tableName);

    if (schema.security.user && !req.user.id) return next(UserNotLoggedInError);

    let table_has_comment = tableName + '_has_comment';
    let table_id = tableName + '_id';

    try {
        let id = await sql('INSERT INTO comment (user_id,comment) VALUES (?,?)', [req.user.id, req.body.comment]);

        await sql('INSERT INTO ' + table_has_comment + ' (' + table_id + ',comment_id) VALUES (?,?)', [req.params.id, id]);

        res.status(204).send();
    } catch(e) { return next(e); }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;