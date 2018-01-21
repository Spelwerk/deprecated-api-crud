'use strict';

const sql = require('../../database/sql');
const relation = require('../../database/relation');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

async function items(creatureId, backgroundId, relation) {
    try {
        let [rows] = await sql('SELECT ' + relation + '_id AS id FROM background_has_' + relation + ' WHERE background_id = ?', [backgroundId]);

        for(let i in rows) {
            let query = 'INSERT INTO creature_has_' + relation + ' (creature_id,' + relation + '_id) VALUES (?,?)';
            let array = [creatureId, rows[i].id];

            await sql(query, array);
        }
    } catch(e) {
        throw e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, res, next, creatureId) {
    try {
        await relation.insert(req, req.body, 'creature', creatureId, 'background', req.body.insert_id);

        await items(creatureId, req.body.insert_id, 'armour');
        await items(creatureId, req.body.insert_id, 'asset');
        await items(creatureId, req.body.insert_id, 'bionic');
        await items(creatureId, req.body.insert_id, 'shield');
        await items(creatureId, req.body.insert_id, 'weapon');

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
