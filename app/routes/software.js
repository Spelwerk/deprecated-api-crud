'use strict';

const routes = require('../../lib/routes/generic/routes');
const basic = require('../../lib/routes/generic/generic');

module.exports = (router) => {
    const tableName = 'software';

    const rootQuery = 'SELECT id, canon, name, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'software.id, ' +
        'software.canon, ' +
        'software.name, ' +
        'software.description, ' +
        'software.legal, ' +
        'software.price, ' +
        'software.hacking_difficulty, ' +
        'software.hacking_bonus, ' +
        'software.created, ' +
        'software.updated, ' +
        'softwaretype.id AS type_id, ' +
        'softwaretype.name AS type_name, ' +
        'software_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM software ' +
        'LEFT JOIN software_is_copy ON software_is_copy.software_id = software.id ' +
        'LEFT JOIN softwaretype ON softwaretype.id = software.softwaretype_id ' +
        'LEFT JOIN user ON user.id = software.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/type/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'software.softwaretype_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
