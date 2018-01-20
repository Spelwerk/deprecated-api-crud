'use strict';

const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const elemental = require('../database/elemental');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body) {
    if(!req.user.id) return new UserNotLoggedInError;

    try {
        let expertise = {
            name: body.name + ' Mastery',
            description: body.description,
            skill_id: body.skill_id,
            species_id: body.species_id
        };

        body.equipable = !!body.augmentation || !!body.form || !!body.manifestation || !!body.species_id;
        body.expertise_id = await elemental.insert(req, expertise, 'expertise');

        return await elemental.insert(req, body, 'weapontype');
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;