'use strict';

const getSchema = require('../../../app/initializers/database').getSchema;
const sql = require('../../database/sql');
const permission = require('../../database/permission');
const creatures = require('../creatures');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function update(req, res, next, creatureId, uniqueId) {
    try {
        await permission.verify(req, 'creature', creatureId);

        let schema = getSchema('creature_has_loyalty');
        let ignoredFields = ['id', 'creature_id', 'loyalty_id'];

        let query = 'UPDATE creature_has_loyalty SET ';
        let array = [];

        for(let key in body) {
            if(!body.hasOwnProperty(key)) continue;
            if(schema.fields.accepted.indexOf(key) === -1) continue;
            if(ignoredFields.indexOf(key) !== -1) continue;

            query += key + ' = ?,';
            array.push(body[key]);
        }

        query = query.slice(0, -1) + ' WHERE creature_id = ? AND id = ?';
        array.push(creatureId);
        array.push(uniqueId);

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function remove(req, res, next, creatureId, uniqueId) {
    try {
        await permission.verify(req, 'creature', creatureId);

        let query = 'DELETE FROM creature_has_loyalty WHERE creature_id = ? AND id = ?';
        let array = [creatureId, uniqueId];

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

async function create(req, res, next, creatureId, uniqueId) {
    try {
        await permission.verify(req, 'creature', creatureId);

        let body = {};

        body.species_id = parseInt(req.body.species_id);
        body.age = parseInt(req.body.age) || 30;
        body.creaturetype_id = parseInt(req.body.creaturetype_id) || config.defaults.creatureType.avatar;

        let [rows] = await sql('SELECT * FROM creature_has_loyalty WHERE creature_id = ? AND id = ?', [creatureId, uniqueId]);

        let loyaltyId = parseInt(rows[0].loyalty_id);
        let milestoneId = parseInt(rows[0].milestone_id) || null;

        body.wealth_id = parseInt(rows[0].wealth_id);
        body.occupation = rows[0].occupation || null;

        body.firstname = rows[0].name !== null && rows[0].name.indexOf(' ') !== -1
            ? rows[0].name.split(' ')[0]
            : rows[0].name;

        body.lastname = rows[0].name !== null && rows[0].name.indexOf(' ') !== -1
            ? rows[0].name.split(' ')[1]
            : null;

        let [rows] = await sql('SELECT epoch_id FROM creature WHERE id = ?', [creatureId]);

        body.epoch_id = parseInt(rows[0].epoch_id);

        let createdId = await creatures.insert(req, body);

        let query = 'INSERT INTO creature_has_relation (creature_id,relation_id,loyalty_id,milestone_id) VALUES (?,?,?,?)';
        let array = [creatureId, createdId, loyaltyId, milestoneId];

        await sql(query, array);

        await sql('DELETE FROM creature_has_loyalty WHERE creature_id = ? AND id = ?', [creatureId, uniqueId]);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.update = update;
module.exports.remove = remove;
module.exports.create = create;
