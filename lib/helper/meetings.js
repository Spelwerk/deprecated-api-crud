'use strict';

const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const sql = require('../database/sql');
const permissions = require('../database/permission');

async function insert(req, body) {
    try {
        if(!req.user.id) return new UserNotLoggedInError;

        let storyId = parseInt(body.story_id);

        await permissions.verify(req, 'story', storyId);

        return await sql('INSERT INTO meeting (story_id,notes) VALUES (?,?)', [storyId, body.notes], [storyId, body.plot]);
    } catch(e) {
        return e;
    }
}

async function update(req, body, id) {
    try {
        if(!req.user.id) return new UserNotLoggedInError;

        id = parseInt(id);

        let [rows] = await sql('SELECT story_id AS id FROM meeting WHERE id = ?', [id]);
        let storyId = parseInt(rows[0].id);

        await permissions.verify(req, 'story', storyId);

        await sql('UPDATE meeting SET notes = ? WHERE id = ?', [body.notes, id]);
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.update = update;
