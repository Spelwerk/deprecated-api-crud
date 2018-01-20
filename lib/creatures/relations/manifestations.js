'use strict';

const AppError = require('../../errors/app-error');

const sql = require('../../database/sql');
const relation = require('../../database/relation');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

async function attributes(creatureId, manifestationId) {
    try {
        let [rows] = await sql('SELECT * FROM attribute_is_manifestation WHERE manifestation_id = ?', [manifestationId]);
        if(rows.length === 0) return new AppError(404, "Manifestation Error", "The manifestation does not have an attribute, which is erroneous");

        for(let i in rows) {
            let query = 'INSERT INTO creature_has_attribute (creature_id,attribute_id) VALUES (?,?)';
            let array = [creatureId, rows[i].attribute_id];

            await sql(query, array);
        }
    } catch(e) {
        throw e;
    }
}

async function skills(creatureId, manifestationId) {
    try {
        let [rows] = await sql('SELECT * FROM skill_is_manifestation WHERE manifestation_id = ?', [manifestationId]);
        if(rows.length === 0) return new AppError(404, "Manifestation Error", "The manifestation does not have a skill, which is erroneous");

        for(let i in rows) {
            let query = 'INSERT INTO creature_has_skill (creature_id,attribute_id) VALUES (?,?)';
            let array = [creatureId, rows[i].skill_id];

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
        await relation.insert(req, req.body, 'creature', creatureId, 'manifestation', req.body.insert_id);

        await attributes(creatureId, req.body.insert_id);
        await skills(creatureId, req.body.insert_id);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
