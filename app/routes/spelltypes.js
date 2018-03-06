'use strict';

const routes = require('../../lib/generic/routes');
const basic = require('../../lib/generic/basics');
const spellTypes = require('../../lib/tables/spelltypes');

module.exports = (router) => {
    const tableName = 'spelltype';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'spelltype.id, ' +
        'spelltype.canon, ' +
        'spelltype.name, ' +
        'spelltype.description, ' +
        'spelltype.created, ' +
        'spelltype.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'expertise.id AS expertise_id, ' +
        'expertise.name AS expertise_name, ' +
        'spelltype_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM spelltype ' +
        'LEFT JOIN spelltype_is_copy ON spelltype_is_copy.spelltype_id = spelltype.id ' +
        'LEFT JOIN manifestation ON manifestation.id = spelltype.manifestation_id ' +
        'LEFT JOIN expertise ON expertise.id = spelltype.expertise_id ' +
        'LEFT JOIN user ON user.id = spelltype.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await spellTypes.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) {
                return next(e);
            }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
