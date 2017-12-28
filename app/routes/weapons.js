'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const basic = require('../../lib/generic/basic');

module.exports = (router) => {
    const tableName = 'weapon';

    let query = 'SELECT ' +
        'weapon.id, ' +
        'weapon.user_id, ' +
        'weapon.canon, ' +
        'weapon.name, ' +
        'weapon.description, ' +
        'weapon.weapontype_id, ' +
        'weapon.legal, ' +
        'weapon.price, ' +
        'weapon.damage_dice, ' +
        'weapon.damage_bonus, ' +
        'weapon.critical_dice, ' +
        'weapon.critical_bonus, ' +
        'weapon.hit, ' +
        'weapon.hands, ' +
        'weapon.distance, ' +
        'weapon.created, ' +
        'weapon.updated, ' +
        'weapon.deleted, ' +
        'weapontype.name AS weapontype_name, ' +
        'weapontype.icon, ' +
        'weapontype.attribute_id, ' +
        'weapontype.expertise_id, ' +
        'weapon_is_copy.copy_id, ' +
        'weapon_is_augmentation.augmentation_id, ' +
        'weapon_is_form.form_id, ' +
        'weapon_is_manifestation.manifestation_id, ' +
        'weapon_is_species.species_id, ' +
        'weapon_is_corporation.corporation_id ' +
        'FROM weapon ' +
        'LEFT JOIN weapontype ON weapontype.id = weapon.weapontype_id ' +
        'LEFT JOIN weapon_is_copy ON weapon_is_copy.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_augmentation ON weapon_is_augmentation.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_form ON weapon_is_form.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_manifestation ON weapon_is_manifestation.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_species ON weapon_is_species.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_corporation ON weapon_is_corporation.weapon_id = weapon.id';

    routes.root(router, tableName, query);
    routes.insert(router, tableName);
    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/augmentation/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE weapon.deleted IS NULL AND ' +
                'augmentation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/form/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE weapon.deleted IS NULL AND ' +
                'form_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE weapon.deleted IS NULL AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE weapon.deleted IS NULL AND ' +
                'species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/type/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE weapon.deleted IS NULL AND ' +
                'weapontype_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
    relations.route(router, tableName, 'primals', 'primal');
    relations.route(router, tableName, 'mods', 'weaponmod');
    relations.route(router, tableName, 'skills', 'skill');
};
