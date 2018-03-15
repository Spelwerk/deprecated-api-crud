'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/relations/generic');
const basic = require('../../lib/generic/basics');

module.exports = (router) => {
    const tableName = 'weapon';

    const rootQuery = 'SELECT ' +
        'weapon.id, ' +
        'weapon.canon, ' +
        'weapon.name, ' +
        'weapontype.icon, ' +
        'weapon.created ' +
        'FROM weapon ' +
        'LEFT JOIN weapontype ON weapontype.id = weapon.weapontype_id';

    const singleQuery = 'SELECT ' +
        'weapon.id, ' +
        'weapon.canon, ' +
        'weapon.name, ' +
        'weapon.description, ' +
        'weapontype.icon, ' +
        'weapon.legal, ' +
        'weapon.price, ' +
        'weapontype.equipable, ' +
        'weapon.created, ' +
        'weapon.updated, ' +
        'weapontype.id AS type_id, ' +
        'weapontype.name AS type_name, ' +
        'expertise.id AS expertise_id, ' +
        'expertise.name AS expertise_name, ' +
        'augmentation.id AS augmentation_id, ' +
        'augmentation.name AS augmentation_name, ' +
        'corporation.id AS corporation_id, ' +
        'corporation.name AS corporation_name, ' +
        'form.id AS form_id, ' +
        'form.name AS form_name, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name, ' +
        'attribute.id AS damage_id, ' +
        'attribute.name AS damage_name, ' +
        'weapon.damage_dice, ' +
        'weapon.damage_bonus, ' +
        'weapon.critical_dice, ' +
        'weapon.critical_bonus, ' +
        'weapon.hit, ' +
        'weapon.hands, ' +
        'weapon.distance, ' +
        'weapon_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM weapon ' +
        'LEFT JOIN weapon_is_augmentation ON weapon_is_augmentation.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_corporation ON weapon_is_corporation.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_form ON weapon_is_form.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_manifestation ON weapon_is_manifestation.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_species ON weapon_is_species.weapon_id = weapon.id ' +
        'LEFT JOIN weapon_is_copy ON weapon_is_copy.weapon_id = weapon.id ' +
        'LEFT JOIN weapontype ON weapontype.id = weapon.weapontype_id ' +
        'LEFT JOIN augmentation ON augmentation.id = weapon_is_augmentation.augmentation_id ' +
        'LEFT JOIN corporation ON corporation.id = weapon_is_corporation.corporation_id ' +
        'LEFT JOIN form ON form.id = weapon_is_form.form_id ' +
        'LEFT JOIN manifestation ON manifestation.id = weapon_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = weapon_is_species.species_id ' +
        'LEFT JOIN attribute ON attribute.id = weapontype.attribute_id ' +
        'LEFT JOIN expertise ON expertise.id = weapontype.expertise_id ' +
        'LEFT JOIN user ON user.id = weapon.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/augmentation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN weapon_is_augmentation ON weapon_is_augmentation.weapon_id = weapon.id ' +
                'WHERE ' +
                'weapon.deleted IS NULL AND ' +
                'weapon_is_augmentation.augmentation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/form/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN weapon_is_form ON weapon_is_form.weapon_id = weapon.id ' +
                'WHERE ' +
                'weapon.deleted IS NULL AND ' +
                'weapon_is_form.form_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN weapon_is_manifestation ON weapon_is_manifestation.weapon_id = weapon.id ' +
                'WHERE ' +
                'weapon.deleted IS NULL AND ' +
                'weapon_is_manifestation.manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN weapon_is_species ON weapon_is_species.weapon_id = weapon.id ' +
                'WHERE ' +
                'weapon.deleted IS NULL AND ' +
                'weapon_is_species.species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/type/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'WHERE ' +
                'weapon.deleted IS NULL AND ' +
                'weapon.weapontype_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'primal');
    relations.route(router, tableName, 'weaponmod');
    relations.route(router, tableName, 'skill');
};
