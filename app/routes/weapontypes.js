'use strict';

const routes = require('../../lib/routes/generic/routes');
const basic = require('../../lib/routes/generic/generic');
const weaponTypes = require('../../lib/routes/weapontypes/weapontypes');

module.exports = (router) => {
    const tableName = 'weapontype';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'weapontype.id, ' +
        'weapontype.canon, ' +
        'weapontype.name, ' +
        'weapontype.description, ' +
        'weapontype.icon, ' +
        'weapontype.equipable, ' +
        'weapontype.augmentation, ' +
        'weapontype.manifestation, ' +
        'weapontype.form, ' +
        'weapontype.species, ' +
        'weapontype.created, ' +
        'weapontype.updated, ' +
        'attribute.id AS damage_id, ' +
        'attribute.name AS damage_name, ' +
        'expertise.id AS expertise_id, ' +
        'expertise.name AS expertise_name, ' +
        'weapontype_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM weapontype ' +
        'LEFT JOIN weapontype_is_copy ON weapontype_is_copy.weapontype_id = weapontype.id ' +
        'LEFT JOIN attribute ON attribute.id = weapontype.attribute_id ' +
        'LEFT JOIN expertise ON expertise.id = weapontype.expertise_id ' +
        'LEFT JOIN user ON user.id = weapontype.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await weaponTypes.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/augmentation/:boolean')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'augmentation = ?';

            await basic.select(req, res, next, call, [req.params.boolean]);
        });

    router.route('/damage/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'attribute_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/expertise/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'expertise_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/form/:boolean')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'form = ?';

            await basic.select(req, res, next, call, [req.params.boolean]);
        });

    router.route('/manifestation/:boolean')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'manifestation = ?';

            await basic.select(req, res, next, call, [req.params.boolean]);
        });

    router.route('/species/:boolean')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'species = ?';

            await basic.select(req, res, next, call, [req.params.boolean]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
