'use strict';

const sql = require('../../database/sql');
const relation = require('../../database/relation');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function remove(req, res, next, creatureId, weaponId) {
    try {
        await relation.remove(req, 'creature', creatureId, 'weapon', weaponId);

        await sql('DELETE FROM creature_has_weaponmod WHERE creature_id = ? AND weapon_id = ?', [creatureId, weaponId]);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.remove = remove;