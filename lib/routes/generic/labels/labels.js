'use strict';

const sql = require('../../../database/sql');
const permission = require('../../../database/permission');

async function insert(req, res, next, tableName) {
    let table_has_label = tableName + '_has_label';
    let table_id = tableName + '_id';
    let id;
    let name = req.body.label.toString().toLowerCase();

    try {
        await permission.verify(req, tableName, req.params.id);

        let [rows] = await sql('SELECT id FROM label WHERE LOWER(name) = ?', [name]);

        if (rows && rows.length !== 0) {
            id = rows[0].id;
        } else {
            id = await sql('INSERT INTO label (name) VALUES (?)', [name]);
        }

        await sql('INSERT INTO ' + table_has_label + ' (' + table_id + ',label_id) VALUES (?,?)', [req.params.id, id]);

        res.status(204).send();
    } catch(e) { return next(e); }
}

async function remove(req, res, next, tableName) {
    let table_has_label = tableName + '_has_label';
    let table_id = tableName + '_id';

    try {
        await permission.verify(req, tableName, req.params.id);

        await sql('DELETE FROM ' + table_has_label + ' WHERE ' + table_id + ' = ? AND label_id = ?', [req.params.id, req.params.label]);

        res.status(204).send();
    } catch(e) { return next(e); }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.remove = remove;
