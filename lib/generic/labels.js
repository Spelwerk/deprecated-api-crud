'use strict';

const sql = require('../database/sql');
const permissions = require('../database/permissions');

async function insert(req, res, next, tableName) {
    let table_has_label = tableName + '_has_label';
    let table_id = tableName + '_id';
    let id;
    let name = req.body.label.toLowerCase();

    try {
        await permissions.verify(req.user, tableName, req.params.id);

        let [rows] = await sql('SELECT id FROM label WHERE LOWER(name) = ?', [name]);

        if(rows.length !== 0) {
            id = rows[0].id;
        } else {
            let [newId] = await sql('INSERT INTO label (name) VALUES (?)', [name]);

            id = newId;
        }

        await sql('INSERT INTO ' + table_has_label + ' (' + table_id + ',label_id) VALUES (?,?)', [req.params.id, id]);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function remove(req, res, next, tableName) {
    let table_has_label = tableName + '_has_label';
    let table_id = tableName + '_id';

    try {
        await permissions.verify(req.user, tableName, req.params.id);

        await sql('DELETE FROM ' + table_has_label + ' WHERE ' + table_id + ' = ? AND label_id = ?', [req.params.id, req.params.label]);

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
