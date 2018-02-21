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
        let id = await elemental.insert(req, body, 'species');

        let weapon = {
            name: body.weapon || 'Brawl',
            description: 'Unarmed combat for the species: ' + body.name,
            weapontype_id: defaults.weaponType.unarmed,
            legal: 1,
            price: 0,
            damage_dice: 2,
            damage_bonus: 0,
            critical_dice: 1,
            critical_bonus: 0,
            distance: 0,
            species_id: id
        };

        await elemental.insert(req, weapon, 'weapon');

        return id;
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;