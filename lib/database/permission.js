'use strict';

const UserNotAllowedToEditError = require('../../lib/errors/user-not-allowed-to-edit-error');
const UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

const sql = require('./sql');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function get(req, table, id) {
    try {
        if (!req.user.id) return new UserNotLoggedInError;

        id = parseInt(id);

        let user_has_table = 'user_has_' + table,
            table_id = table + '_id';

        let [rows] = await sql('SELECT * FROM ' + user_has_table + ' WHERE user_id = ? AND ' + table_id + ' = ?', [req.user.id, id]);

        let object = {};

        let row = rows && rows.length !== 0 ? rows[0] : null;
        if (!row) return null;

        for (let key in row) {
            if (!row.hasOwnProperty(key)) continue;
            if (key.indexOf('_id') !== -1) continue;

            object[key] = row[key];
        }

        return object;
    } catch(e) { return e; }
}

async function verify(req, table, id) {
    try {
        if (!req.user.id) throw new UserNotLoggedInError;

        if (req.user.admin) return;

        let object = await get(req.user, table, id);

        if (!object.owner && !object.edit && !object.storyteller) throw new UserNotAllowedToEditError;
    } catch(e) { throw e; }
}

async function keep(req, table, id) {
    try {
        if (!req.user.id) throw new UserNotLoggedInError;

        id = parseInt(id);

        let user_has_table = 'user_has_' + table;
        let table_id = table + '_id';

        await sql('INSERT INTO ' + user_has_table + ' (user_id,' + table_id + ') VALUES (?,?)', [req.user.id, id]);
    } catch(e) { throw e; }
}

async function remove(req, table, id) {
    try {
        if (!req.user.id) throw new UserNotLoggedInError;

        id = parseInt(id);

        let user_has_table = 'user_has_' + table;
        let table_id = table + '_id';

        await sql('DELETE FROM ' + user_has_table + ' WHERE user_id = ? AND ' + table_id + ' = ?', [req.user.id, id]);
    } catch(e) { throw e; }
}

async function favorite(req, table, id, boolean) {
    try {
        if (!req.user.id) throw new UserNotLoggedInError;

        id = parseInt(id);
        boolean = !!boolean;

        let user_has_table = 'user_has_' + table;
        let table_id = table + '_id';

        await sql('UPDATE ' + user_has_table + ' SET favorite = ? WHERE user_id = ? AND ' + table_id + ' = ?', [boolean, req.user.id, id]);
    } catch(e) { throw e; }
}

async function edit(req, table, id, user, boolean) {
    try {
        if (!req.user.id) throw new UserNotLoggedInError;

        id = parseInt(id);
        user = parseInt(user);
        boolean = !!boolean;

        let user_has_table = 'user_has_' + table;
        let table_id = table + '_id';

        let object = await get(req.user, table, id);

        if (!object.owner) throw new UserNotAllowedToEditError;

        await sql('UPDATE ' + user_has_table + ' SET edit = ? WHERE user_id = ? AND ' + table_id + ' = ?', [boolean, user, id]);
    } catch(e) { throw e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.get = get;
module.exports.verify = verify;
module.exports.keep = keep;
module.exports.favorite = favorite;
module.exports.edit = edit;
module.exports.remove = remove;
