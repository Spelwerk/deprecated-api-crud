'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const basic = require('../../lib/generic/basics');

module.exports = (router) => {
    const tableName = 'asset';

    const rootQuery = 'SELECT ' +
        'asset.id, ' +
        'asset.canon, ' +
        'asset.name, ' +
        'assettype.icon, ' +
        'asset.created ' +
        'FROM ' + tableName + ' ' +
        'LEFT JOIN assettype ON assettype.id = asset.assettype_id';

    const singleQuery = 'SELECT ' +
        'asset.id, ' +
        'asset.canon, ' +
        'asset.name, ' +
        'asset.description, ' +
        'assettype.icon, ' +
        'asset.equipable, ' +
        'asset.legal, ' +
        'asset.price, ' +
        'asset.created, ' +
        'asset.updated, ' +
        'assettype.id AS type_id, ' +
        'assettype.name AS type_name, ' +
        'corporation.id AS corporation_id, ' +
        'corporation.name AS corporation_name, ' +
        'asset_is_copy.copy_id, ' +
        'asset.user_id, ' +
        'user.displayname AS user_name ' +
        'FROM asset ' +
        'LEFT JOIN asset_is_corporation ON asset_is_corporation.asset_id = asset.id ' +
        'LEFT JOIN asset_is_copy ON asset_is_copy.asset_id = asset.id ' +
        'LEFT JOIN assettype ON assettype.id = asset.assettype_id ' +
        'LEFT JOIN corporation ON corporation.id = asset_is_corporation.corporation_id ' +
        'LEFT JOIN user ON user.id = asset.user_id';

    routes.root(router, tableName, rootQuery);
    routes.insert(router, tableName);
    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/type/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'WHERE ' +
                'asset.deleted IS NULL AND ' +
                'asset.assettype_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // RELATIONS

    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'primal');
    relations.route(router, tableName, 'skill');
};
