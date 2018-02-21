'use strict';

const DatabaseRowNotFoundError = require('../../errors/database-row-not-found-error');

const getSchema = require('../../../app/initializers/database').getSchema;
const sql = require('../../database/sql');
const permission = require('../../database/permission');
const creatures = require('../creatures');

const yaml = require('node-yaml').readSync;
const defaults = yaml('../../../config/defaults.yml');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

async function getLoyaltyData(creatureId, uniqueId) {
    try {
        let [rows] = await sql('SELECT * FROM creature_has_loyalty WHERE creature_id = ? AND id = ?', [creatureId, uniqueId]);
        if (rows.length === 0) return new DatabaseRowNotFoundError;

        return rows[0];
    } catch(e) {
        return e;
    }
}

async function getEpochId(creatureId) {
    try {
        let [rows] = await sql('SELECT epoch_id FROM creature WHERE id = ?', [creatureId]);
        if (rows.length === 0) return new DatabaseRowNotFoundError;

        return parseInt(rows[0].epoch_id);
    } catch(e) {
        return e;
    }
}

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

        for(let key in req.body) {
            if(!req.body.hasOwnProperty(key)) continue;
            if(schema.fields.accepted.indexOf(key) === -1) continue;
            if(ignoredFields.indexOf(key) !== -1) continue;

            query += key + ' = ?,';
            array.push(req.body[key]);
        }

        query = query.slice(0, -1) + ' WHERE creature_id = ? AND id = ?';
        array.push(creatureId);
        array.push(uniqueId);

        await sql(query, array);

        res.status(204).send();
    } catch(e) {
        return next(e);
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
        return next(e);
    }
}

async function create(req, res, next, creatureId, uniqueId) {
    try {
        await permission.verify(req, 'creature', creatureId);

        let body = {};

        body.species_id = parseInt(req.body.species_id);
        body.age = parseInt(req.body.age) || 30;
        body.creaturetype_id = parseInt(req.body.creaturetype_id) || defaults.creatureType.avatar;

        let data = await getLoyaltyData(creatureId, uniqueId);

        let loyaltyId = parseInt(data.loyalty_id);
        let milestoneId = parseInt(data.milestone_id) || null;

        body.wealth_id = parseInt(data.wealth_id);
        body.occupation = data.occupation || null;

        body.firstname = data.name !== null && data.name.indexOf(' ') !== -1
            ? data.name.split(' ')[0]
            : data.name;

        body.lastname = data.name !== null && data.name.indexOf(' ') !== -1
            ? data.name.split(' ')[1]
            : null;

        body.epoch_id = await getEpochId(creatureId);

        let createdId = await creatures.insert(req, body);

        let query = 'INSERT INTO creature_has_relation (creature_id,relation_id,loyalty_id,milestone_id) VALUES (?,?,?,?)';
        let array = [creatureId, createdId, loyaltyId, milestoneId];

        await sql(query, array);

        await sql('DELETE FROM creature_has_loyalty WHERE creature_id = ? AND id = ?', [creatureId, uniqueId]);

        res.status(204).send();
    } catch(e) {
        return next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.update = update;
module.exports.remove = remove;
module.exports.create = create;
