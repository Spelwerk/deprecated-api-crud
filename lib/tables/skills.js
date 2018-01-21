'use strict';

const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const elemental = require('../database/elemental');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body) {
    if(!req.user.id) return new UserNotLoggedInError;

    try {
        let skill = {
            name: body.name,
            description: body.description,
            icon: body.icon,
            manifestation_id: body.manifestation_id,
            species_id: body.species_id
        };

        let id = await elemental.insert(req, skill, 'skill');

        let expertise = {
            name: body.name,
            description: 'Generic expertise used where the other expertises do not fit, and you still want to show you are extra good at something. You can use the Custom Description field to explain where this is applicable for your character. Remember that if you have a suggestion for a new expertise you can easily add it to the game system and your own created worlds. If the new expertise is of great quality it may even be adopted as canon by Spelwerk.',
            manifestation_id: body.manifestation_id,
            species_id: body.species_id,
            skill_id: id
        };

        await elemental.insert(req, expertise, 'expertise');

        return id;
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;