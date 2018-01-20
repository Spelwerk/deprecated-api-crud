'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const basic = require('../../lib/generic/basics');
const elemental = require('../../lib/database/elemental');
const sql = require('../../lib/database/sql');
const permissions = require('../../lib/database/permission');

module.exports = (router) => {
    const tableName = 'form';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let manifestationId = parseInt(req.body.manifestation_id);

                await permissions.verify(req, 'manifestation', manifestationId);

                let expertise = {
                    name: req.body.name + ' Mastery',
                    manifestation_id: req.body.manifestation_id
                };

                let [rows] = await sql('SELECT skill_id AS id FROM skill_is_manifestation WHERE manifestation_id = ?', [manifestationId]);
                expertise.skill_id = rows[0].id;

                req.body.expertise_id = await elemental.insert(req, expertise, 'expertise');

                let id = await elemental.insert(req, req.body, 'form');

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
    relations.route(router, tableName, 'skills', 'skill');
};
