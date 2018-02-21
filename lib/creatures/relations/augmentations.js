'use strict';

const sql = require('../../database/sql');
const permission = require('../../database/permission');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, res, next, creatureId, bionicId) {
    creatureId = parseInt(creatureId);
    bionicId = parseInt(bionicId);

    let augmentationId = parseInt(req.body.insert_id);

    try {
        await permission.verify(req, 'creature', creatureId);

        let query = 'INSERT INTO creature_has_augmentation (creature_id,bionic_id,augmentation_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE augmentation_id = ?';
        let array = [creatureId, bionicId, augmentationId, augmentationId];

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        return next(e);
    }
}

async function remove(req, res, next, creatureId, bionicId, augmentationId) {
    creatureId = parseInt(creatureId);
    bionicId = parseInt(bionicId);
    augmentationId = parseInt(augmentationId);

    try {
        await permission.verify(req, 'creature', creatureId);

        let query = 'DELETE FROM creature_has_augmentation WHERE creature_id = ? AND bionic_id = ? AND augmentation_id = ?';
        let array = [creatureId, bionicId, augmentationId];

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
