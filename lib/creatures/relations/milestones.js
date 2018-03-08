'use strict';

const sql = require('../../database/sql');
const relation = require('../../database/relation');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

async function items(creatureId, milestoneId, relation) {
    const creature_has_relation = 'creature_has_' + relation;
    const milestone_has_relation = 'milestone_has_' + relation;
    const relation_id = relation + '_id';

    try {
        let [rows] = await sql('SELECT ' + relation_id + ' AS id FROM ' + milestone_has_relation + ' WHERE milestone_id = ?', [milestoneId]);

        for (let i in rows) {
            let query = 'INSERT INTO ' + creature_has_relation + ' (creature_id,' + relation_id + ') VALUES (?,?) ON DUPLICATE KEY UPDATE ' + relation_id + ' = VALUES(' + relation_id + ')';
            let array = [creatureId, rows[i].id];

            await sql(query, array);
        }
    } catch(e) { throw e; }
}

async function loyalty(creatureId, milestoneId) {
    try {
        let [rows] = await sql('SELECT * FROM milestone_has_loyalty WHERE milestone_id = ?', [milestoneId]);

        for (let i in rows) {
            let query = 'INSERT INTO creature_has_loyalty (creature_id,loyalty_id,wealth_id,milestone_id,name,occupation) VALUES (?,?,?,?,?,?)';
            let array = [creatureId, rows[i].loyalty_id, rows[i].wealth_id, milestoneId, 'Unknown', rows[i].occupation];

            await sql(query, array);
        }
    } catch(e) { throw e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, res, next, creatureId) {
    try {
        await relation.insert(req, req.body, 'creature', creatureId, 'milestone', req.body.insert_id);

        await items(creatureId, req.body.insert_id, 'armour');
        await items(creatureId, req.body.insert_id, 'asset');
        await items(creatureId, req.body.insert_id, 'bionic');
        await items(creatureId, req.body.insert_id, 'shield');
        await items(creatureId, req.body.insert_id, 'weapon');

        await loyalty(creatureId, req.body.insert_id);

        res.status(204).send();
    } catch(e) {
        next(e);
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
