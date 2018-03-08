'use strict';

const routes = require('../../lib/generic/routes');
const basic = require('../../lib/generic/basics');
const primals = require('../../lib/tables/primals');

module.exports = (router) => {
    const tableName = 'primal';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'primal.id, ' +
        'primal.canon, ' +
        'primal.name, ' +
        'primal.description, ' +
        'primal.effects, ' +
        'primal.icon, ' +
        'primal.maximum, ' +
        'primal.created, ' +
        'primal.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'expertise.id AS expertise_id, ' +
        'expertise.name AS expertise_name, ' +
        'primal_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM primal ' +
        'LEFT JOIN primal_is_copy ON primal_is_copy.primal_id = primal.id ' +
        'LEFT JOIN manifestation ON manifestation.id = primal.manifestation_id ' +
        'LEFT JOIN expertise ON expertise.id = primal.expertise_id ' +
        'LEFT JOIN user ON user.id = primal.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await primals.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/manifestation/:manifestationId')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
