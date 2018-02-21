'use strict';

const sql = require('../../database/sql');
const permission = require('../../database/permission');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, res, next, creatureId, weaponId) {
    creatureId = parseInt(creatureId);
    weaponId = parseInt(weaponId);

    let modId = parseInt(req.body.insert_id);

    try {
        await permission.verify(req, 'creature', creatureId);

        let query = 'INSERT INTO creature_has_weaponmod (creature_id,weapon_id,weaponmod_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE weaponmod_id = ?';
        let array = [creatureId, weaponId, modId, modId];

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        return next(e);
    }
}

async function remove(req, res, next, creatureId, weaponId, modId) {
    creatureId = parseInt(creatureId);
    weaponId = parseInt(weaponId);
    modId = parseInt(modId);

    try {
        await permission.verify(req, 'creature', creatureId);

        let query = 'DELETE FROM creature_has_weaponmod WHERE creature_id = ? AND weapon_id = ? AND weaponmod_id = ?';
        let array = [creatureId, weaponId, modId];

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        return next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.remove = remove;
