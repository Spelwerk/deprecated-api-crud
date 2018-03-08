'use strict';

const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const sql = require('../database/sql');
const permissions = require('../database/permission');

async function insert(req, body) {
    try {
        if (!req.user.id) return new UserNotLoggedInError;

        let storyId = parseInt(body.story_id);

        await permissions.verify(req, 'story', storyId);

        return await sql('INSERT INTO chapter (story_id,plot) VALUES (?,?)', [storyId, body.plot]);
    } catch(e) { return e; }
}

async function update(req, body, id) {
    try {
        if (!req.user.id) return new UserNotLoggedInError;

        id = parseInt(id);

        let [rows] = await sql('SELECT story_id AS id FROM chapter WHERE id = ?', [id]);
        let storyId = parseInt(rows[0].id);

        await permissions.verify(req, 'story', storyId);

        await sql('UPDATE chapter SET plot = ?, updated = CURRENT_TIMESTAMP WHERE id = ?', [body.plot, id]);
    } catch(e) { return e; }
}

async function remove(req, id) {
    try {
        if (!req.user.id) return new UserNotLoggedInError;

        id = parseInt(id);

        let [rows] = await sql('SELECT story_id AS id FROM chapter WHERE id = ?', [id]);
        let storyId = parseInt(rows[0].id);

        await permissions.verify(req, 'story', storyId);

        await sql('UPDATE chapter SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    } catch(e) { return e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
module.exports.update = update;
module.exports.remove = remove;
