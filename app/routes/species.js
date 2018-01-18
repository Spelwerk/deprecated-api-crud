'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const basic = require('../../lib/generic/basic');
const elemental = require('../../lib/database/elemental');

const yaml = require('node-yaml');
const defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = (router) => {
    const tableName = 'species';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let weapon = {
                    name: req.body.weapon || 'Brawl',
                    description: 'Unarmed combat for the species: ' + req.body.name,
                    weapontype_id: defaults.weaponType.unarmed,
                    legal: 1,
                    price: 0,
                    damage_dice: 2,
                    damage_bonus: 0,
                    critical_dice: 1,
                    critical_bonus: 0,
                    distance: 0
                };

                let id = await elemental.insert(req, req.body, 'species');
                weapon.species_id = id;

                await elemental.insert(req, weapon, 'weapon');

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/world/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'world_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
};
