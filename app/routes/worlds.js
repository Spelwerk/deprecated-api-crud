'use strict';

let UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const elemental = require('../../lib/database/elemental');
const sql = require('../../lib/database/sql');

module.exports = function(router) {
    const tableName = 'world';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                if(!req.user.id) return new UserNotLoggedInError;

                let id = await elemental.insert(req, req.body, tableName);

                let [rows] = await sql('SELECT id,minimum,maximum FROM attribute WHERE optional = 0');

                let attributeQuery = 'INSERT INTO world_has_attribute (world_id,attribute_id,value,minimum,maximum) VALUES ';

                for(let i in rows) {
                    let attributeId = parseInt(rows[i].id),
                        value = parseInt(rows[i].minimum),
                        minimum = parseInt(rows[i].minimum),
                        maximum = parseInt(rows[i].maximum);

                    attributeQuery += '(' + id + ',' + attributeId + ',' + value + ',' + minimum + ',' + maximum + '),';
                }

                attributeQuery = attributeQuery.slice(0, -1);

                await sql(attributeQuery);

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
    relations.route(router, tableName, 'countries', 'country');
    relations.route(router, tableName, 'identities', 'identity');
    relations.route(router, tableName, 'locations', 'location');
    relations.route(router, tableName, 'natures', 'nature');
};
