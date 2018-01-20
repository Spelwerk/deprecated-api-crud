'use strict';

const sql = require('../../database/sql');
const permission = require('../../database/permission');
const unique = require('../../database/unique');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, res, next, table, creatureId) {
    try {
        await permission.verify(req, 'creature', creatureId);

        let creature_has_wound = 'creature_has_' + table;
        let wound_id = table + '_id';

        let woundId = await unique.insert(req, table, req.body.name);
        let value = parseInt(req.body.value) || 1;

        let query = 'INSERT INTO ' + creature_has_wound + ' (creature_id,' + wound_id + ',value) VALUES (?,?,?)';
        let array = [creatureId, woundId, value];

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function update(req, res, next, table, creatureId, woundId) {
    try {
        await permission.verify(req, 'creature', creatureId);

        let creature_has_wound = 'creature_has_' + table;
        let wound_id = table + '_id';

        let newId = await unique.insert(req, table, req.body.name, false);
        let value = parseInt(req.body.value) || 1;

        let query = 'UPDATE ' + creature_has_wound + ' SET ' + wound_id + ' = ?, value = ? WHERE creature_id = ? AND id = ?';
        let array = [newId, value, creatureId, woundId];

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function remove(req, res, next, table, creatureId, woundId) {
    try {
        await permission.verify(req, 'creature', creatureId);

        let creature_has_wound = 'creature_has_' + table;

        let query = 'DELETE FROM ' + creature_has_wound + ' WHERE creature_id = ? AND id = ?';
        let array = [creatureId, woundId];

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function heal(req, res, next, table, creatureId, woundId, boolean) {
    try {
        await permission.verify(req, 'creature', creatureId);

        boolean = !!boolean;

        let creature_has_wound = 'creature_has_' + table;

        let query = 'UPDATE ' + creature_has_wound + ' SET healed = ? WHERE creature_id = ? AND id = ?';
        let array = [boolean, creatureId, woundId];

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
module.exports.heal = heal;
