'use strict';

const AppError = require('../../errors/app-error');
const UserNotLoggedInError = require('../../errors/user-not-logged-in-error');

const sql = require('../../database/sql');
const elemental = require('../../database/common');
const permission = require('../../database/permission');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body) {
    if (!req.user.id) return new UserNotLoggedInError;

    try {
        let manifestationId = parseInt(body.manifestation_id);

        await permission.verify(req, 'manifestation', manifestationId);

        let [rows] = await sql('SELECT skill_id AS id FROM skill_is_manifestation WHERE manifestation_id = ?', [manifestationId]);
        if (rows.length === 0) return new AppError(400, "Skill not found!", "A skill related to manifestation was not found.");

        let expertise = {
            name: body.name + ' Mastery',
            manifestation_id: manifestationId,
            skill_id: parseInt(rows[0].id)
        };

        body.expertise_id = await elemental.insert(req, expertise, 'expertise');

        return await elemental.insert(req, body, 'primal');
    } catch(e) { return e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;