'use strict';

const routes = require('../../lib/generic/routes');
const basic = require('../../lib/generic/basic');
const elemental = require('../../lib/database/elemental');

module.exports = (router) => {
    const tableName = 'weapontype';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let expertise = {
                    name: req.body.name + ' Mastery',
                    description: req.body.description,
                    skill_id: req.body.skill_id,
                    species_id: req.body.species_id
                };

                req.body.equipable = !!req.body.augmentation || !!req.body.form || !!req.body.manifestation || !!req.body.species_id;

                req.body.expertise_id = await elemental.insert(req, expertise, 'expertise');

                let id = await elemental.insert(req, req.body, 'weapontype');

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/augmentation/:boolean')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'augmentation = ?';

            await basic.select(req, res, next, call, [req.params.boolean]);
        });

    router.route('/damage/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'attribute_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/expertise/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'expertise_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/form/:boolean')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'form = ?';

            await basic.select(req, res, next, call, [req.params.boolean]);
        });

    router.route('/manifestation/:boolean')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'manifestation = ?';

            await basic.select(req, res, next, call, [req.params.boolean]);
        });

    router.route('/species/:boolean')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'species = ?';

            await basic.select(req, res, next, call, [req.params.boolean]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
