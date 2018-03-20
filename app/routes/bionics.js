'use strict';

const routes = require('../../lib/routes/generic/routes');
const relations = require('../../lib/routes/generic/relations/routes');
const basic = require('../../lib/routes/generic/generic');

module.exports = (router) => {
    const tableName = 'bionic';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'bionic.id, ' +
        'bionic.canon, ' +
        'bionic.name, ' +
        'bionic.description, ' +
        'bionic.icon, ' +
        'bionic.legal, ' +
        'bionic.price, ' +
        'bionic.hacking_difficulty, ' +
        'bionic.created, ' +
        'bionic.updated, ' +
        'corporation.id AS corporation_id, ' +
        'corporation.name AS corporation_name, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name, ' +
        'bionic_is_copy.copy_id ' +
        'FROM bionic ' +
        'LEFT JOIN bionic_is_corporation ON bionic_is_corporation.bionic_id = bionic.id ' +
        'LEFT JOIN bionic_is_copy ON bionic_is_copy.bionic_id = bionic.id ' +
        'LEFT JOIN corporation ON corporation.id = bionic_is_corporation.corporation_id ' +
        'LEFT JOIN user ON user.id = bionic.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/bodypart/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'bodypart_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'augmentation');
    relations.route(router, tableName, 'skill');
    relations.route(router, tableName, 'software');
};
