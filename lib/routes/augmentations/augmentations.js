'use strict';

const UserNotLoggedInError = require('../../errors/user-not-logged-in-error');

const elemental = require('../../database/common');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body) {
    if (!req.user.id) return new UserNotLoggedInError;

    try {
        let augmentation = {
            name: body.name,
            description: body.description,
            legal: !!body.legal,
            price: body.price,
            hacking_difficulty: body.hacking_difficulty,
            corporation_id: body.corporation_id
        };

        let id = await elemental.insert(req, augmentation, 'augmentation');

        if (typeof body.weapontype_id !== 'undefined' && body.weapontype_id !== null && body.weapontype_id !== '') {
            let weapon = {
                name: body.name,
                description: body.description,
                weapontype_id: body.weapontype_id,
                legal: !!body.legal,
                price: body.price,
                damage_dice: body.damage_dice,
                damage_bonus: body.damage_bonus,
                critical_dice: body.critical_dice,
                critical_bonus: body.critical_bonus,
                distance: body.distance,
                augmentation_id: id
            };

            await elemental.insert(req, weapon, 'weapon');
        }

        return id;
    } catch(e) { return e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;
