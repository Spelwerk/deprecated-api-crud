'use strict';

const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const elemental = require('../database/elemental');

const yaml = require('node-yaml').readSync;
const defaults = yaml('./../../config/defaults.yml');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body) {
    if(!req.user.id) return new UserNotLoggedInError;

    try {
        let manifestation = {
            name: body.name,
            description: body.description,
            icon: body.icon
        };

        let id = await elemental.insert(req, manifestation, 'manifestation');

        let attribute = {
            name: body.power,
            description: 'Power for: ' + body.name,
            icon: body.icon,
            attributetype_id: defaults.attributeType.power,
            optional: 1,
            minimum: 0,
            maximum: body.maximum,
            manifestation_id: id
        };

        await elemental.insert(req, attribute, 'attribute');

        let skill = {
            name: body.skill,
            description: 'Skill for: ' + body.name,
            icon: body.icon,
            manifestation_id: id
        };

        await elemental.insert(req, skill, 'skill');

        return id;
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;