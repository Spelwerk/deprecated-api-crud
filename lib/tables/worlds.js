'use strict';

const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const elemental = require('../database/elemental');
const sql = require('../database/sql');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body) {
    if (!req.user.id) return new UserNotLoggedInError;

    try {
        let id = await elemental.insert(req, body, 'world');

        let [rows] = await sql('SELECT id,minimum,maximum FROM attribute WHERE optional = 0');

        let query = 'INSERT INTO world_has_attribute (world_id,attribute_id,value,minimum,maximum) VALUES ';

        for (let i in rows) {
            let attributeId = parseInt(rows[i].id);
            let value = parseInt(rows[i].minimum);
            let minimum = parseInt(rows[i].minimum);
            let maximum = parseInt(rows[i].maximum);

            query += '(' + id + ',' + attributeId + ',' + value + ',' + minimum + ',' + maximum + '),';
        }

        query = query.slice(0, -1);

        await sql(query);

        return id;
    } catch(e) { return e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;