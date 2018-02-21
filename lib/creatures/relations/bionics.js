'use strict';

const sql = require('../../database/sql');
const relation = require('../../database/relation');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function remove(req, res, next, creatureId, bionicId) {
    try {
        await relation.remove(req, 'creature', creatureId, 'bionic', bionicId);

        await sql('DELETE FROM creature_has_augmentation WHERE creature_id = ? AND bionic_id = ?', [creatureId, bionicId]);

        res.status(204).send();
    } catch(e) {
        return next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.remove = remove;