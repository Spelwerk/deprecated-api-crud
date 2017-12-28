'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const elemental = require('../../lib/database/elemental');

module.exports = (router) => {
    const tableName = 'augmentation';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_corporation ON ' + tableName + '_is_corporation.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            let augmentation = {
                name: req.body.name,
                description: req.body.description,
                legal: !!req.body.legal,
                price: req.body.price,
                hacking_difficulty: req.body.hacking_difficulty,
                corporation_id: req.body.corporation_id
            };

            let weapon = {
                name: req.body.name,
                description: req.body.description,
                weapontype_id: req.body.weapontype_id,
                legal: !!req.body.legal,
                price: req.body.price,
                damage_dice: req.body.damage_dice,
                damage_bonus: req.body.damage_bonus,
                critical_dice: req.body.critical_dice,
                critical_bonus: req.body.critical_bonus,
                distance: req.body.distance
            };

            try {
                let id = await elemental.insert(req, augmentation, 'augmentation');

                weapon.augmentation_id = id;

                if(weapon.weapontype_id) {
                    await elemental.insert(req, weapon, 'weapon');
                }

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
    relations.route(router, tableName, 'expertises', 'expertise');
    relations.route(router, tableName, 'skills', 'skill');
    relations.route(router, tableName, 'software', 'software');
};
